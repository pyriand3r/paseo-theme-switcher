import type { PluginServerContext } from "@getpaseo/plugin/server";
import { themePrefs } from "./shared/theme-prefs.ts";

export default function contribute(server: PluginServerContext) {
  // The daemon stores the document and serves its read, write and reset RPCs once it is registered.
  server.registerSettings(themePrefs);
  return () => {};
}
