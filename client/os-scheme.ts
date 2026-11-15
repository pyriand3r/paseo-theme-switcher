// The only module that touches `Appearance`. A namespace import keeps a missing export an
// `undefined` property access that is caught and reported, instead of a link error that would stop
// the whole plugin from loading (what the probe showed for unverified `react-native` exports).
import * as ReactNative from "react-native";
import type { Scheme } from "./controller.ts";

export interface SchemeSubscription {
  remove(): void;
  /** Why attaching failed, or null. */
  error: string | null;
}

export interface SchemeSource {
  get(): Scheme;
  subscribe(listener: (scheme: Scheme) => void): SchemeSubscription;
}

function normalize(value: unknown): Scheme {
  return value === "light" || value === "dark" ? value : null;
}

function errorText(error: unknown): string {
  return error instanceof Error ? `${error.name}: ${error.message}` : String(error);
}

export const osSchemeSource: SchemeSource = {
  get() {
    try {
      return normalize(ReactNative.Appearance.getColorScheme());
    } catch {
      return null;
    }
  },
  subscribe(listener) {
    try {
      const subscription = ReactNative.Appearance.addChangeListener((preferences) =>
        listener(normalize(preferences.colorScheme)),
      );
      return { remove: () => subscription.remove(), error: null };
    } catch (error) {
      return { remove: () => {}, error: errorText(error) };
    }
  },
};
