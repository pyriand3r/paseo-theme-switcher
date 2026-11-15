import { settingsRpc } from "@getpaseo/plugin";
import type { PluginClientContext } from "@getpaseo/plugin/client";
import { type ThemePrefs, themePrefs, themePrefsSchema } from "../shared/theme-prefs.ts";

const readDocument = settingsRpc(themePrefs.id).read;

/**
 * Reads the saved pair from the entry, where `useSettings` cannot run. Rejects when the daemon
 * cannot read it or the stored document is invalid; the controller then keeps its current pair.
 */
export async function readSavedPrefs(client: Pick<PluginClientContext, "rpc">): Promise<ThemePrefs> {
  const result = await client.rpc(readDocument, {});
  if (result.status !== "ready") throw new Error(`stored document is invalid: ${result.error}`);
  return themePrefsSchema.parse(result.values);
}
