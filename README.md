# Theme Switcher

A Paseo plugin that applies a light palette while the OS is in light mode and a dark palette while it
is in dark mode, and swaps live when the OS mode changes. You pick the two palettes from 26
built-in ones.

| Scheme | Palettes |
| --- | --- |
| Catppuccin | Latte; Frappé, Macchiato, Mocha |
| Gruvbox | Light Hard, Medium, Soft; Dark Hard, Medium, Soft |
| Solarized | Light; Dark |
| Tokyo Night | Day; Night, Storm, Moon |
| One | Light; Dark |
| GitHub | Light; Dark, Dark Dimmed |
| Night Owl | Light Owl; Night Owl |
| Rosé Pine | Dawn; Main, Moon |

## Install

```bash
paseo plugin install github:pyriand3r/paseo-theme-switcher
paseo plugin ls        # theme-switcher should be "running"
```

Or from a local checkout: `paseo plugin install /absolute/path/to/paseo-theme-switcher`.

Plugins must be enabled on the daemon (Settings, Plugins, "Enable plugins"). Requires Paseo 0.15.4 or newer.

## Use

1. Open **Settings, Appearance** on each client (desktop, browser, every phone) and select
   **Theme Switcher** as the Paseo theme. Paseo has no API for a plugin to select a theme, so this one-time step is
   yours, once per client.
2. Open **Settings, Plugins**, the plugin row's "..." menu, **Theme Switcher**.
3. Pick a **Light mode palette** and a **Dark mode palette**. Changes apply and save immediately.
4. Switch the OS between light and dark mode. The palette follows while Paseo keeps running.

Defaults are Catppuccin Latte (light) and Catppuccin Mocha (dark). The screen also has a
**Preview** of both choices and a **Status** section: OS mode, applied palette, whether Theme
Switcher is the selected theme, the last swap, and where the saved palettes were read from.

If nothing changes when the OS mode changes, check Status: "Theme Switcher selected" must say
`yes`, and "OS mode listener" must say `attached`.

## Available palettes

The light slot offers the 10 light palettes, the dark slot the 16 dark ones.

| Scheme | Light | Dark |
| --- | --- | --- |
| Catppuccin | Latte | Frappé, Macchiato, Mocha |
| Gruvbox | Light Hard, Light Medium, Light Soft | Dark Hard, Dark Medium, Dark Soft |
| Solarized | Solarized Light | Solarized Dark |
| Tokyo Night | Tokyo Night Day | Tokyo Night, Storm, Moon |
| One | One Light | One Dark |
| GitHub | GitHub Light | GitHub Dark, GitHub Dark Dimmed |
| Night Owl | Light Owl | Night Owl |
| Rosé Pine | Rosé Pine Dawn | Rosé Pine, Rosé Pine Moon |

Hex values and the mapping from each upstream scheme: `../SPEC.md`, section 5.

## How it works

The plugin registers one theme with the fixed id `auto`. On an OS mode change it removes that theme
and registers it again with the other palette's colors and `appearance`; Paseo keeps your selection
because the id never changes. The palette pair is stored in a host-scoped settings document, so it
is shared by every client of one daemon, and each client applies it to its own OS mode.

## Limits

- You must select Theme Switcher in Appearance yourself, per client. A plugin cannot activate a theme.
- It cannot switch between themes installed from other plugins or Paseo's built-in themes; the
  palettes are bundled.
- The palette pair is per daemon, not per device. `scope: "device"` is rejected by Paseo 0.15.4.
- The OS mode is read from React Native's `Appearance`. Confirmed on the web client and, by the
  author, on macOS and on Linux (CachyOS, Hyprland, Noctalia); iOS and Android are not yet confirmed (see the platform table below).
- On a fresh start the host paints its own theme for about 130 ms before the plugin's palette
  appears. That happens before any plugin code can run.

## Development

```bash
npm install
npm run typecheck   # app config, then app + tests with Node types
npm test            # node --test, no extra dependencies (Node with native TypeScript stripping)
paseo plugin install github:pyriand3r/paseo-theme-switcher
paseo plugin reload theme-switcher     # after source edits
```

Source imports use `.ts` extensions (`allowImportingTsExtensions`) so the node test runner can load
the same files the bundler does.

`shared/palettes.ts` is the catalog. A palette is `{ id, name, scheme, appearance, colors }` with the
eight fields `addTheme` takes. Adding one means adding an entry there and updating the counts in
`shared/palettes.test.ts`.

## Verification results (Paseo 0.15.4, web client, headless Chromium, emulated OS scheme)

| Check | Result |
| --- | --- |
| `npm run typecheck`, `npm test` | pass, 25 tests |
| `paseo plugin ls` | `running`, no error; two reloads and a disable/enable cycle clean |
| **G1** swap with the opposite `appearance` re-derives every token live | **pass.** After light to dark and dark to light swaps, the set of computed colors on a settings page is identical to Catppuccin's own native Mocha and Latte registration (same OS scheme) |
| **G2** `Appearance` events on other platforms | web: pass (emulated). macOS desktop and Linux desktop (CachyOS, Hyprland, Noctalia): work (reported by the author, not re-run here). iOS, Android: not tested |
| **G3** entry reads the saved pair | **pass with route 1**, `client.rpc(settingsRpc("theme-prefs").read, {})`. After a reload the saved palette is the first one painted, without opening the settings screen and with no flash of the defaults |
| **G4** frame without the selected theme during a swap | none seen: 286 sampled frames over 40 swaps contained only the two palettes' exact colors |
| A1 theme listed, inactive until selected | pass |
| A2 live swap on OS change | pass (Mocha `#1e1e2e` to Latte `#eff1f5` and back) |
| A3 all 26 palettes apply | pass: each one applied, the screen reported "selected: yes", and a DOM element was painted with its `background` |
| A4 persistence across reload | pass |
| A5 stale-revision save | pass: two tabs saving at once; the loser shows "Settings changed on another client. Reload before saving again." and a working Reload action |
| A6 plugin disabled | pass: falls back to the default dark theme, no error screen |
| A7 compact and wide layout | wide (1280 px) with Mocha, Tokyo Night Storm, Solarized Light and One Light; compact (390 px) with Rosé Pine Moon. The weak-contrast palettes in SPEC 5.3 were not each reviewed by eye |
| M1, M2 real OS switch on Electron, iOS, Android | macOS desktop reported working; the rest **not run** |

## Platform results

| Platform | OS mode read | Live swap on OS change | Notes |
| --- | --- | --- | --- |
| Web (headless Chromium, emulated scheme) | yes | yes | tested by script |
| macOS desktop | yes | yes | reported by the author |
| Linux desktop (CachyOS, Hyprland, Noctalia) | yes | yes | reported by the author |
| iOS | not tested | not tested | |
| Android | not tested | not tested | |
