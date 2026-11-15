import assert from "node:assert/strict";
import { test } from "node:test";
import { requirePalette } from "../shared/palettes.ts";
import type { ThemePrefs } from "../shared/theme-prefs.ts";
import { createController, type Scheme, type ThemeRegistration } from "./controller.ts";

const LATTE = requirePalette("catppuccin-latte");
const MOCHA = requirePalette("catppuccin-mocha");

interface FakeHost {
  calls: string[];
  live: Map<string, ThemeRegistration>;
  failNextAdd: boolean;
  asyncRemove: boolean;
  addTheme(theme: ThemeRegistration): () => void | Promise<void>;
}

/** Throws `Duplicate theme` for a live id, like the host does; records every call in order. */
function createFakeHost(): FakeHost {
  const host: FakeHost = {
    calls: [],
    live: new Map(),
    failNextAdd: false,
    asyncRemove: false,
    addTheme(theme) {
      if (host.failNextAdd) {
        host.failNextAdd = false;
        throw new Error("boom");
      }
      if (host.live.has(theme.id)) throw new Error(`Duplicate theme: ${theme.id}`);
      host.live.set(theme.id, theme);
      host.calls.push(`add ${theme.id} ${theme.appearance} ${theme.colors.background}`);
      return () => {
        host.live.delete(theme.id);
        host.calls.push(`remove ${theme.id}`);
        return host.asyncRemove ? Promise.resolve() : undefined;
      };
    },
  };
  return host;
}

function setup(scheme: Scheme, readPrefs?: () => Promise<ThemePrefs>) {
  const fake = createFakeHost();
  const controller = createController({ host: fake, scheme, readPrefs });
  return { fake, controller };
}

const sameBackground = (palette: { colors: { background: string } }) => palette.colors.background;

test("start registers exactly one theme for the start-up scheme", async () => {
  for (const [scheme, palette] of [["light", LATTE], ["dark", MOCHA]] as const) {
    const { fake, controller } = setup(scheme);
    await controller.start(50);
    assert.deepEqual(fake.calls, [`add auto ${palette.appearance} ${sameBackground(palette)}`]);
    assert.equal(controller.getState().applied?.paletteId, palette.id);
    await controller.dispose();
  }
});

test("a scheme change removes the theme and adds the same id with the other palette's colors and appearance", async () => {
  const { fake, controller } = setup("light");
  await controller.start(50);
  await controller.setScheme("dark");
  assert.deepEqual(fake.calls, [
    `add auto light ${LATTE.colors.background}`,
    "remove auto",
    `add auto dark ${MOCHA.colors.background}`,
  ]);
  assert.equal(controller.getState().lastSwap?.ok, true);
  await controller.dispose();
});

test("a repeated event for the same scheme adds nothing", async () => {
  const { fake, controller } = setup("dark");
  await controller.start(50);
  await controller.setScheme("dark");
  await controller.setScheme("dark");
  assert.equal(fake.calls.length, 1);
  assert.equal(controller.getState().schemeEvents, 2);
  await controller.dispose();
});

test("rapid alternating events end on the last scheme without a duplicate error", async () => {
  for (const asyncRemove of [false, true]) {
    const { fake, controller } = setup("light");
    fake.asyncRemove = asyncRemove;
    await controller.start(50);
    const pending: Promise<void>[] = [];
    for (let index = 0; index < 20; index++) pending.push(controller.setScheme(index % 2 === 0 ? "dark" : "light"));
    await Promise.all(pending);
    assert.equal(controller.getState().applied?.paletteId, LATTE.id);
    assert.equal(controller.getState().lastSwap?.ok, true);
    assert.equal(fake.live.size, 1);
    await controller.dispose();
  }
});

test("a prefs change swaps when it targets the active slot and not otherwise", async () => {
  const { fake, controller } = setup("dark");
  await controller.start(50);
  await controller.setPrefs({ lightPaletteId: "gruvbox-light-hard", darkPaletteId: "catppuccin-mocha" });
  assert.equal(fake.calls.length, 1, "the light slot is inactive");

  await controller.setPrefs({ lightPaletteId: "gruvbox-light-hard", darkPaletteId: "tokyo-night-storm" });
  assert.equal(controller.getState().applied?.paletteId, "tokyo-night-storm");

  await controller.setScheme("light");
  assert.equal(controller.getState().applied?.paletteId, "gruvbox-light-hard");
  await controller.dispose();
});

test("an unknown or wrong-slot stored id falls back to the slot default and is reported", async () => {
  const { controller } = setup("light");
  await controller.start(50);
  await controller.setPrefs({ lightPaletteId: "catppuccin-mocha", darkPaletteId: "removed-palette" });
  const state = controller.getState();
  assert.equal(state.applied?.paletteId, LATTE.id);
  assert.equal(state.notes.length, 2);
  await controller.dispose();
});

test("a failed add restores the previous palette and records the error", async () => {
  const { fake, controller } = setup("light");
  await controller.start(50);
  fake.failNextAdd = true;
  await controller.setScheme("dark");
  const state = controller.getState();
  assert.equal(state.lastSwap?.ok, false);
  assert.match(state.lastSwap?.text ?? "", /boom/);
  assert.match(state.lastSwap?.text ?? "", /restored Catppuccin Latte/);
  assert.equal(state.applied?.paletteId, LATTE.id);
  assert.equal(fake.live.size, 1);
  await controller.dispose();
});

test("an unknown OS scheme keeps the applied palette", async () => {
  const { fake, controller } = setup("dark");
  await controller.start(50);
  await controller.setScheme(null);
  assert.equal(fake.calls.length, 1);
  assert.equal(controller.getState().applied?.paletteId, MOCHA.id);
  await controller.dispose();
});

test("an unknown scheme at start uses the light slot", async () => {
  const { controller } = setup(null);
  await controller.start(50);
  assert.equal(controller.getState().applied?.paletteId, LATTE.id);
  await controller.dispose();
});

test("dispose removes the theme once and later calls do nothing", async () => {
  const { fake, controller } = setup("light");
  await controller.start(50);
  await controller.dispose();
  await controller.dispose();
  assert.equal(fake.live.size, 0);
  assert.equal(fake.calls.filter((call) => call === "remove auto").length, 1);

  await controller.setScheme("dark");
  await controller.setPrefs({ lightPaletteId: "gruvbox-light-hard", darkPaletteId: "catppuccin-mocha" });
  assert.equal(fake.live.size, 0);
});

test("dispose during a pending swap does not leave a theme behind", async () => {
  const { fake, controller } = setup("light");
  fake.asyncRemove = true;
  await controller.start(50);
  const swap = controller.setScheme("dark");
  await controller.dispose();
  await swap;
  assert.equal(fake.live.size, 0);
});

test("start applies the saved pair read from the daemon", async () => {
  const saved: ThemePrefs = { lightPaletteId: "solarized-light", darkPaletteId: "night-owl" };
  const { fake, controller } = setup("dark", async () => saved);
  await controller.start(50);
  assert.deepEqual(fake.calls, ["add auto dark #011627"], "one registration, no default flash");
  assert.equal(controller.getState().prefsSource, "saved on the daemon");
  await controller.dispose();
});

test("start applies the defaults when the read is too slow, then swaps when it arrives", async () => {
  let deliver: (prefs: ThemePrefs) => void = () => {};
  const slow = new Promise<ThemePrefs>((resolve) => {
    deliver = resolve;
  });
  const { fake, controller } = setup("dark", () => slow);
  await controller.start(0);
  assert.deepEqual(fake.calls, [`add auto dark ${MOCHA.colors.background}`]);

  deliver({ lightPaletteId: "catppuccin-latte", darkPaletteId: "rose-pine" });
  await controller.settled();
  assert.equal(controller.getState().applied?.paletteId, "rose-pine");
  assert.equal(fake.live.size, 1);
  await controller.dispose();
});

test("start applies the defaults when the read fails and says why", async () => {
  const { controller } = setup("dark", () => Promise.reject(new Error("no handler")));
  await controller.start(50);
  const state = controller.getState();
  assert.equal(state.applied?.paletteId, MOCHA.id);
  assert.match(state.prefsSource, /read failed.*no handler/);
  await controller.dispose();
});

test("an OS change re-reads the saved pair, so a change from another client reaches this one", async () => {
  let saved: ThemePrefs = { lightPaletteId: "catppuccin-latte", darkPaletteId: "catppuccin-mocha" };
  const { controller } = setup("light", async () => saved);
  await controller.start(50);

  saved = { lightPaletteId: "github-light", darkPaletteId: "github-dark" };
  await controller.setScheme("dark");
  await controller.settled();
  assert.equal(controller.getState().applied?.paletteId, "github-dark");
  await controller.dispose();
});

test("a read that started before an explicit change does not overwrite it", async () => {
  let deliver: (prefs: ThemePrefs) => void = () => {};
  const stale = new Promise<ThemePrefs>((resolve) => {
    deliver = resolve;
  });
  const { controller } = setup("dark", () => stale);
  const starting = controller.start(500);
  await controller.setPrefs({ lightPaletteId: "catppuccin-latte", darkPaletteId: "gruvbox-dark-soft" });
  deliver({ lightPaletteId: "catppuccin-latte", darkPaletteId: "catppuccin-frappe" });
  await starting;
  assert.equal(controller.getState().applied?.paletteId, "gruvbox-dark-soft");
  await controller.dispose();
});

test("subscribers hear about swaps and stop after unsubscribing", async () => {
  const { controller } = setup("light");
  let heard = 0;
  const unsubscribe = controller.subscribe(() => {
    heard += 1;
  });
  await controller.start(50);
  assert.ok(heard > 0);
  const before = heard;
  unsubscribe();
  await controller.setScheme("dark");
  assert.equal(heard, before);
  await controller.dispose();
});
