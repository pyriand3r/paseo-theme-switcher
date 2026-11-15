import { defineSettings } from "@getpaseo/plugin";
import { z } from "zod";
import { DEFAULT_DARK_ID, DEFAULT_LIGHT_ID } from "./palettes.ts";

// Ids are plain strings, not an enum: a later catalog change must not turn stored data invalid.
// The controller resolves unknown ids to the slot default at runtime.
export const themePrefsSchema = z.object({
  lightPaletteId: z.string().default(DEFAULT_LIGHT_ID),
  darkPaletteId: z.string().default(DEFAULT_DARK_ID),
});

export type ThemePrefs = z.output<typeof themePrefsSchema>;

export const themePrefs = defineSettings({
  id: "theme-prefs",
  // Host scope: the pair is shared by every client of one daemon, and each client applies it to its
  // own OS mode. Paseo 0.15.4 rejects `scope: "device"` ("Only host-scoped settings are supported")
  // and the plugin fails to load, so it stays "host" until the minimum Paseo version supports it.
  scope: "host",
  version: 1,
  schema: themePrefsSchema,
});
