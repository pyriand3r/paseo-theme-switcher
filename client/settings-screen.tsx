import type { PluginSurfaceProps } from "@getpaseo/plugin/client";
import { useSettings } from "@getpaseo/plugin/client";
import {
  SettingsAction,
  SettingsCard,
  SettingsSection,
  SettingsSelect,
} from "@getpaseo/plugin/client/ui";
import { useEffect, useSyncExternalStore } from "react";
import { View } from "react-native";
import { palettesFor, resolvePalette } from "../shared/palettes.ts";
import { themePrefs } from "../shared/theme-prefs.ts";
import type { Controller } from "./controller.ts";
import { PalettePreview } from "./palette-preview.tsx";
import { Readout } from "./readout.tsx";

const LIGHT_OPTIONS = palettesFor("light").map((palette) => ({ label: palette.name, value: palette.id }));
const DARK_OPTIONS = palettesFor("dark").map((palette) => ({ label: palette.name, value: palette.id }));

/** The screen is created per entry run so it shares that run's controller. */
export function createSettingsScreen(controller: Controller) {
  return function ThemeSwitcherScreen({ theme, layout }: PluginSurfaceProps) {
    const state = useSyncExternalStore(controller.subscribe, controller.getState);
    const settings = useSettings(themePrefs);

    // Forward every document state to the controller: it covers this screen's own saves and saves
    // made from another client while the screen is open.
    const ready = settings.status === "ready" ? settings : null;
    const readyRevision = ready?.revision;
    useEffect(() => {
      if (ready) void controller.setPrefs(ready.values);
    }, [readyRevision]);

    const common = { theme, layout };
    const light = resolvePalette("light", state.prefs.lightPaletteId).palette;
    const dark = resolvePalette("dark", state.prefs.darkPaletteId).palette;

    const selected = state.applied
      ? state.applied.background.toLowerCase() === theme.colors.surface0.toLowerCase()
      : false;
    const selectedText = !state.applied
      ? "No palette applied yet"
      : selected
        ? "yes"
        : "no. Select Theme Switcher in Settings, Appearance; the plugin cannot do that for you.";

    return (
      <View style={{ gap: layout.compact ? 16 : 24 }}>
        <SettingsSection title="Palettes">
          <SettingsCard>
            {settings.status === "loading" && (
              <Readout {...common} label="Saved palettes" value="Loading..." />
            )}
            {(settings.status === "invalid" || settings.status === "error") && (
              <Readout {...common} label="Saved palettes" value={settings.error} danger />
            )}
            {settings.status === "invalid" && (
              <SettingsAction
                label="Reset to defaults"
                hint="Replaces the stored document with Catppuccin Latte and Mocha."
                actionLabel="Reset"
                disabled={settings.saving}
                onPress={() => void settings.reset()}
              />
            )}
            {ready && (
              <SettingsSelect
                label="Light mode palette"
                hint="Applied while the OS is in light mode."
                value={resolvePalette("light", ready.values.lightPaletteId).palette.id}
                options={LIGHT_OPTIONS}
                disabled={ready.saving}
                onValueChange={(lightPaletteId) =>
                  void ready.save({ ...ready.values, lightPaletteId }, ready.revision)
                }
              />
            )}
            {ready && (
              <SettingsSelect
                label="Dark mode palette"
                hint="Applied while the OS is in dark mode."
                value={resolvePalette("dark", ready.values.darkPaletteId).palette.id}
                options={DARK_OPTIONS}
                disabled={ready.saving}
                onValueChange={(darkPaletteId) =>
                  void ready.save({ ...ready.values, darkPaletteId }, ready.revision)
                }
              />
            )}
            {settings.saveError !== null && (
              <Readout {...common} label="Could not save" value={settings.saveError} danger />
            )}
            {settings.saveError !== null && (
              <SettingsAction
                label="Reload saved palettes"
                hint="Discards the failed change and reads the current values."
                actionLabel="Reload"
                onPress={() => void settings.reload()}
              />
            )}
          </SettingsCard>
        </SettingsSection>

        <SettingsSection title="Preview">
          <SettingsCard>
            <PalettePreview {...common} label="Light mode" palette={light} />
            <PalettePreview {...common} label="Dark mode" palette={dark} />
          </SettingsCard>
        </SettingsSection>

        <SettingsSection title="Status">
          <SettingsCard>
            <Readout
              {...common}
              label="OS mode"
              value={`${state.scheme ?? "unknown"}, ${state.schemeEvents} change event(s) since start`}
            />
            <Readout {...common} label="Applied palette" value={state.applied?.name ?? "none"} />
            <Readout {...common} label="Theme Switcher selected" value={selectedText} danger={state.applied !== null && !selected} />
            <Readout
              {...common}
              label="Last swap"
              value={
                state.lastSwap
                  ? `${new Date(state.lastSwap.at).toLocaleTimeString()}  ${state.lastSwap.ok ? "ok" : "failed"}: ${state.lastSwap.text}`
                  : "none yet"
              }
              danger={state.lastSwap !== null && !state.lastSwap.ok}
            />
            <Readout {...common} label="Saved palettes read from" value={state.prefsSource} />
            <Readout {...common} label="OS mode listener" value={state.listener} danger={state.listener !== "attached"} />
            {state.notes.length > 0 && (
              <Readout {...common} label="Notes" value={state.notes.join("\n")} danger />
            )}
          </SettingsCard>
        </SettingsSection>
      </View>
    );
  };
}
