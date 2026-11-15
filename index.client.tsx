import type { PluginClientContext } from "@getpaseo/plugin/client";
import { createController } from "./client/controller.ts";
import { osSchemeSource } from "./client/os-scheme.ts";
import { readSavedPrefs } from "./client/saved-prefs.ts";
import { createSettingsScreen } from "./client/settings-screen.tsx";

/** How long the first palette waits for the saved pair before the defaults are applied. */
const SAVED_PREFS_TIMEOUT_MS = 1500;

export default function contribute(client: PluginClientContext) {
  // One controller per entry run: the host re-runs the entry on reload and on connection changes.
  const controller = createController({
    host: client,
    scheme: osSchemeSource.get(),
    readPrefs: () => readSavedPrefs(client),
  });

  const subscription = osSchemeSource.subscribe((scheme) => {
    void controller.setScheme(scheme);
  });
  controller.setListenerStatus(subscription.error ?? "attached");
  void controller.start(SAVED_PREFS_TIMEOUT_MS);

  const removeScreen = client.addSettingsScreen({
    id: "settings",
    title: "Theme Switcher",
    icon: "Palette",
    Component: createSettingsScreen(controller),
  });

  return async () => {
    subscription.remove();
    removeScreen();
    await controller.dispose();
  };
}
