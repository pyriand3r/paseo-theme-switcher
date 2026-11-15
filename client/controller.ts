// Swap logic for the single registered theme. No React and no react-native here, so the node test
// runner can drive it with a fake host.
import {
  type Appearance,
  DEFAULT_DARK_ID,
  DEFAULT_LIGHT_ID,
  type Palette,
  type PaletteColors,
  resolvePalette,
  THEME_ID,
  THEME_NAME,
} from "../shared/palettes.ts";
import type { ThemePrefs } from "../shared/theme-prefs.ts";

/** `null` is what `Appearance.getColorScheme()` returns when the OS gives no preference. */
export type Scheme = "light" | "dark" | null;

export interface ThemeRegistration {
  id: string;
  name: string;
  appearance: Appearance;
  colors: PaletteColors;
}

/** The part of `PluginClientContext` the controller needs. */
export interface ThemeHost {
  addTheme(theme: ThemeRegistration): () => void | Promise<void>;
}

export interface SwapResult {
  at: number;
  ok: boolean;
  text: string;
}

export interface AppliedPalette {
  paletteId: string;
  name: string;
  background: string;
}

export interface ControllerState {
  scheme: Scheme;
  /** Change events received after start-up; the start-up scheme is not counted. */
  schemeEvents: number;
  prefs: ThemePrefs;
  /** Where `prefs` came from: the defaults, the settings screen, the daemon, or a failed read. */
  prefsSource: string;
  /** Stored palette ids that did not resolve and fell back to the slot default. */
  notes: readonly string[];
  listener: string;
  applied: AppliedPalette | null;
  lastSwap: SwapResult | null;
}

export interface ControllerOptions {
  host: ThemeHost;
  scheme: Scheme;
  /** Reads the saved pair from the daemon. Rejects when it cannot. */
  readPrefs?: () => Promise<ThemePrefs>;
}

export interface Controller {
  getState(): ControllerState;
  subscribe(listener: () => void): () => void;
  /** Reads the saved pair (bounded by `timeoutMs`), then registers the matching palette. Never rejects. */
  start(timeoutMs: number): Promise<void>;
  /** An OS mode change. Re-reads the saved pair in the background. */
  setScheme(scheme: Scheme): Promise<void>;
  /** A change made through the settings screen or seen in the settings document. */
  setPrefs(prefs: ThemePrefs): Promise<void>;
  setListenerStatus(text: string): void;
  /** Resolves when the background reads and swaps started so far have finished. */
  settled(): Promise<void>;
  /** Removes the registered theme and ignores later calls. Idempotent. */
  dispose(): Promise<void>;
}

interface Applied {
  palette: Palette;
  remove: () => void | Promise<void>;
}

function isThenable(value: unknown): value is PromiseLike<unknown> {
  return typeof value === "object" && value !== null && "then" in value && typeof value.then === "function";
}

function errorText(error: unknown): string {
  return error instanceof Error ? `${error.name}: ${error.message}` : String(error);
}

function registrationFor(palette: Palette): ThemeRegistration {
  return { id: THEME_ID, name: THEME_NAME, appearance: palette.appearance, colors: { ...palette.colors } };
}

function samePrefs(a: ThemePrefs, b: ThemePrefs): boolean {
  return a.lightPaletteId === b.lightPaletteId && a.darkPaletteId === b.darkPaletteId;
}

export function createController(options: ControllerOptions): Controller {
  const { host, readPrefs } = options;
  const listeners = new Set<() => void>();

  let scheme: Scheme = options.scheme;
  let schemeEvents = 0;
  let prefs: ThemePrefs = { lightPaletteId: DEFAULT_LIGHT_ID, darkPaletteId: DEFAULT_DARK_ID };
  let prefsSource = "defaults";
  /** Bumped by every explicit `setPrefs`; a read that started before it must not overwrite it. */
  let prefsEpoch = 0;
  let listener = "not attached";
  let applied: Applied | null = null;
  let lastSwap: SwapResult | null = null;
  let disposed = false;
  let running: Promise<void> | null = null;
  let dirty = false;
  let cancelStart: (() => void) | undefined;
  const background = new Set<Promise<void>>();
  let state = buildState();

  function resolveSlot(slot: Appearance): { palette: Palette; note: string | null } {
    return resolvePalette(slot, slot === "light" ? prefs.lightPaletteId : prefs.darkPaletteId);
  }

  function desired(): Palette {
    if (scheme === "dark") return resolveSlot("dark").palette;
    if (scheme === "light") return resolveSlot("light").palette;
    // No OS preference: keep what is applied; before anything is applied, use the light slot.
    return applied ? applied.palette : resolveSlot("light").palette;
  }

  function buildState(): ControllerState {
    const notes = (["light", "dark"] as const).flatMap((slot) => resolveSlot(slot).note ?? []);
    return {
      scheme,
      schemeEvents,
      prefs,
      prefsSource,
      notes,
      listener,
      applied: applied
        ? { paletteId: applied.palette.id, name: applied.palette.name, background: applied.palette.colors.background }
        : null,
      lastSwap,
    };
  }

  function publish(): void {
    state = buildState();
    for (const notify of listeners) notify();
  }

  function record(ok: boolean, text: string): void {
    lastSwap = { at: Date.now(), ok, text };
  }

  async function swapOnce(): Promise<void> {
    if (disposed) return;
    const palette = desired();
    if (applied?.palette.id === palette.id) {
      publish();
      return;
    }
    const previous = applied;
    if (previous) {
      try {
        // Only wait for a promise: a synchronous remover and the add below then share one turn, so
        // the host can batch them and never renders a frame without the selected theme.
        const pending = previous.remove();
        if (isThenable(pending)) await pending;
      } catch (error) {
        record(false, `Removing ${previous.palette.name} failed: ${errorText(error)}`);
        publish();
        return;
      }
      applied = null;
    }
    if (disposed) {
      publish();
      return;
    }
    try {
      applied = { palette, remove: host.addTheme(registrationFor(palette)) };
      record(true, previous ? `${previous.palette.name} to ${palette.name}` : `Applied ${palette.name}`);
    } catch (error) {
      let text = `Applying ${palette.name} failed: ${errorText(error)}`;
      if (previous) {
        try {
          applied = { palette: previous.palette, remove: host.addTheme(registrationFor(previous.palette)) };
          text += `; restored ${previous.palette.name}`;
        } catch (restoreError) {
          text += `; restoring ${previous.palette.name} failed too: ${errorText(restoreError)}`;
        }
      }
      record(false, text);
    }
    publish();
  }

  /** Coalescing and serialized: any number of calls end on the latest desired palette. */
  function apply(): Promise<void> {
    dirty = true;
    if (running) return running;
    // An async function runs synchronously up to its first await, so an idle apply with a
    // synchronous remover swaps within the caller's turn.
    running = (async () => {
      try {
        while (dirty) {
          dirty = false;
          await swapOnce();
        }
      } finally {
        running = null;
      }
    })();
    return running;
  }

  function takePrefs(next: ThemePrefs, source: string): void {
    if (samePrefs(prefs, next) && prefsSource === source) return;
    prefs = { lightPaletteId: next.lightPaletteId, darkPaletteId: next.darkPaletteId };
    prefsSource = source;
    publish();
  }

  /** Tracks a task that never rejects so `settled` can wait for it. */
  function track(task: Promise<void>): Promise<void> {
    background.add(task);
    void task.finally(() => background.delete(task));
    return task;
  }

  /** Reads the saved pair, keeps it unless a newer explicit change exists, and applies. Never rejects. */
  async function refreshPrefs(): Promise<void> {
    if (!readPrefs || disposed) return;
    const epoch = prefsEpoch;
    try {
      const saved = await readPrefs();
      if (disposed || epoch !== prefsEpoch) return;
      takePrefs(saved, "saved on the daemon");
    } catch (error) {
      if (disposed || epoch !== prefsEpoch) return;
      prefsSource = `read failed (${errorText(error)}); keeping the current pair`;
      publish();
    }
    await apply();
  }

  return {
    getState: () => state,
    subscribe(notify) {
      listeners.add(notify);
      return () => {
        listeners.delete(notify);
      };
    },
    async start(timeoutMs) {
      if (disposed) return;
      if (!readPrefs) {
        await apply();
        return;
      }
      const read = track(refreshPrefs());
      // `Promise.withResolvers` is ES2024: not in this project's lib and not guaranteed on Hermes.
      const outcome = await new Promise<"read" | "timeout" | "cancelled">((resolve) => {
        const timer = setTimeout(() => resolve("timeout"), timeoutMs);
        cancelStart = () => {
          clearTimeout(timer);
          resolve("cancelled");
        };
        void read.then(() => {
          clearTimeout(timer);
          resolve("read");
        });
      });
      cancelStart = undefined;
      // No saved pair in time: apply the defaults now; `read` swaps when it settles.
      if (outcome === "timeout") await apply();
    },
    async setScheme(next) {
      if (disposed) return;
      scheme = next;
      schemeEvents += 1;
      publish();
      const swap = apply();
      track(refreshPrefs());
      await swap;
    },
    async setPrefs(next) {
      if (disposed) return;
      prefsEpoch += 1;
      takePrefs(next, "settings screen");
      await apply();
    },
    setListenerStatus(text) {
      listener = text;
      publish();
    },
    async settled() {
      while (background.size > 0) await Promise.all([...background]);
      if (running) await running;
    },
    async dispose() {
      if (disposed) return;
      disposed = true;
      cancelStart?.();
      if (running) await running;
      const last = applied;
      applied = null;
      if (last) {
        try {
          await last.remove();
        } catch {
          // The plugin is going away; the host drops what is left.
        }
      }
      listeners.clear();
    },
  };
}
