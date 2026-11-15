export type Appearance = "light" | "dark";

/** The eight fields `client.addTheme` takes. Every color is a 6-digit hex string. */
export interface PaletteColors {
  background: string;
  foreground: string;
  raised: string;
  control: string;
  border: string;
  accent: string;
  mutedForeground: string;
  ring: string;
}

export interface Palette {
  id: string;
  name: string;
  /** Upstream color scheme, used to group options. */
  scheme: string;
  appearance: Appearance;
  colors: PaletteColors;
}

/** The single theme id the plugin registers. It never changes: the user's selection is stored under it. */
export const THEME_ID = "auto";
export const THEME_NAME = "Theme Switcher";

export const DEFAULT_LIGHT_ID = "catppuccin-latte";
export const DEFAULT_DARK_ID = "catppuccin-mocha";

// Sources: Catppuccin palette v1.8.0, morhetz/gruvbox, altercation/solarized,
// folke/tokyonight.nvim (extras), navarasu/onedark.nvim + Atom One, @primer/primitives 11.10.0,
// sdras/night-owl-vscode-theme, rose-pine/rose-pine-palette. Mapping rules: SPEC.md section 5.
// The only derived values are the two Solarized `control`/`border` colors.
export const PALETTES: readonly Palette[] = [
  {
    id: "catppuccin-latte",
    name: "Catppuccin Latte",
    scheme: "Catppuccin",
    appearance: "light",
    colors: {
      background: "#eff1f5",
      foreground: "#4c4f69",
      raised: "#ccd0da",
      control: "#bcc0cc",
      border: "#bcc0cc",
      accent: "#8839ef",
      mutedForeground: "#6c6f85",
      ring: "#9ca0b0",
    },
  },
  {
    id: "catppuccin-frappe",
    name: "Catppuccin Frappé",
    scheme: "Catppuccin",
    appearance: "dark",
    colors: {
      background: "#303446",
      foreground: "#c6d0f5",
      raised: "#414559",
      control: "#51576d",
      border: "#51576d",
      accent: "#ca9ee6",
      mutedForeground: "#a5adce",
      ring: "#737994",
    },
  },
  {
    id: "catppuccin-macchiato",
    name: "Catppuccin Macchiato",
    scheme: "Catppuccin",
    appearance: "dark",
    colors: {
      background: "#24273a",
      foreground: "#cad3f5",
      raised: "#363a4f",
      control: "#494d64",
      border: "#494d64",
      accent: "#c6a0f6",
      mutedForeground: "#a5adcb",
      ring: "#6e738d",
    },
  },
  {
    id: "catppuccin-mocha",
    name: "Catppuccin Mocha",
    scheme: "Catppuccin",
    appearance: "dark",
    colors: {
      background: "#1e1e2e",
      foreground: "#cdd6f4",
      raised: "#313244",
      control: "#45475a",
      border: "#45475a",
      accent: "#cba6f7",
      mutedForeground: "#a6adc8",
      ring: "#6c7086",
    },
  },
  {
    id: "gruvbox-dark-hard",
    name: "Gruvbox Dark Hard",
    scheme: "Gruvbox",
    appearance: "dark",
    colors: {
      background: "#1d2021",
      foreground: "#ebdbb2",
      raised: "#3c3836",
      control: "#504945",
      border: "#504945",
      accent: "#83a598",
      mutedForeground: "#bdae93",
      ring: "#928374",
    },
  },
  {
    id: "gruvbox-dark-medium",
    name: "Gruvbox Dark Medium",
    scheme: "Gruvbox",
    appearance: "dark",
    colors: {
      background: "#282828",
      foreground: "#ebdbb2",
      raised: "#3c3836",
      control: "#504945",
      border: "#504945",
      accent: "#83a598",
      mutedForeground: "#bdae93",
      ring: "#928374",
    },
  },
  {
    id: "gruvbox-dark-soft",
    name: "Gruvbox Dark Soft",
    scheme: "Gruvbox",
    appearance: "dark",
    colors: {
      background: "#32302f",
      foreground: "#ebdbb2",
      raised: "#3c3836",
      control: "#504945",
      border: "#504945",
      accent: "#83a598",
      mutedForeground: "#bdae93",
      ring: "#928374",
    },
  },
  {
    id: "gruvbox-light-hard",
    name: "Gruvbox Light Hard",
    scheme: "Gruvbox",
    appearance: "light",
    colors: {
      background: "#f9f5d7",
      foreground: "#3c3836",
      raised: "#ebdbb2",
      control: "#d5c4a1",
      border: "#d5c4a1",
      accent: "#076678",
      mutedForeground: "#665c54",
      ring: "#928374",
    },
  },
  {
    id: "gruvbox-light-medium",
    name: "Gruvbox Light Medium",
    scheme: "Gruvbox",
    appearance: "light",
    colors: {
      background: "#fbf1c7",
      foreground: "#3c3836",
      raised: "#ebdbb2",
      control: "#d5c4a1",
      border: "#d5c4a1",
      accent: "#076678",
      mutedForeground: "#665c54",
      ring: "#928374",
    },
  },
  {
    id: "gruvbox-light-soft",
    name: "Gruvbox Light Soft",
    scheme: "Gruvbox",
    appearance: "light",
    colors: {
      background: "#f2e5bc",
      foreground: "#3c3836",
      raised: "#ebdbb2",
      control: "#d5c4a1",
      border: "#d5c4a1",
      accent: "#076678",
      mutedForeground: "#665c54",
      ring: "#928374",
    },
  },
  {
    id: "solarized-light",
    name: "Solarized Light",
    scheme: "Solarized",
    appearance: "light",
    colors: {
      background: "#fdf6e3",
      foreground: "#586e75",
      raised: "#eee8d5",
      control: "#d3d3c5",
      border: "#d3d3c5",
      accent: "#268bd2",
      mutedForeground: "#657b83",
      ring: "#93a1a1",
    },
  },
  {
    id: "solarized-dark",
    name: "Solarized Dark",
    scheme: "Solarized",
    appearance: "dark",
    colors: {
      background: "#002b36",
      foreground: "#93a1a1",
      raised: "#073642",
      control: "#1f4751",
      border: "#1f4751",
      accent: "#268bd2",
      mutedForeground: "#839496",
      ring: "#586e75",
    },
  },
  {
    id: "tokyo-night-day",
    name: "Tokyo Night Day",
    scheme: "Tokyo Night",
    appearance: "light",
    colors: {
      background: "#e1e2e7",
      foreground: "#3760bf",
      raised: "#d0d5e3",
      control: "#c4c8da",
      border: "#a8aecb",
      accent: "#2e7de9",
      mutedForeground: "#6172b0",
      ring: "#68709a",
    },
  },
  {
    id: "tokyo-night",
    name: "Tokyo Night",
    scheme: "Tokyo Night",
    appearance: "dark",
    colors: {
      background: "#1a1b26",
      foreground: "#c0caf5",
      raised: "#292e42",
      control: "#3b4261",
      border: "#3b4261",
      accent: "#7aa2f7",
      mutedForeground: "#a9b1d6",
      ring: "#737aa2",
    },
  },
  {
    id: "tokyo-night-storm",
    name: "Tokyo Night Storm",
    scheme: "Tokyo Night",
    appearance: "dark",
    colors: {
      background: "#24283b",
      foreground: "#c0caf5",
      raised: "#292e42",
      control: "#3b4261",
      border: "#3b4261",
      accent: "#7aa2f7",
      mutedForeground: "#a9b1d6",
      ring: "#737aa2",
    },
  },
  {
    id: "tokyo-night-moon",
    name: "Tokyo Night Moon",
    scheme: "Tokyo Night",
    appearance: "dark",
    colors: {
      background: "#222436",
      foreground: "#c8d3f5",
      raised: "#2f334d",
      control: "#3b4261",
      border: "#3b4261",
      accent: "#82aaff",
      mutedForeground: "#828bb8",
      ring: "#737aa2",
    },
  },
  {
    id: "one-light",
    name: "One Light",
    scheme: "One",
    appearance: "light",
    colors: {
      background: "#fafafa",
      foreground: "#383a42",
      raised: "#f0f0f0",
      control: "#e6e6e6",
      border: "#e6e6e6",
      accent: "#4078f2",
      mutedForeground: "#696c77",
      ring: "#a0a1a7",
    },
  },
  {
    id: "one-dark",
    name: "One Dark",
    scheme: "One",
    appearance: "dark",
    colors: {
      background: "#282c34",
      foreground: "#abb2bf",
      raised: "#31353f",
      control: "#393f4a",
      border: "#393f4a",
      accent: "#61afef",
      mutedForeground: "#828997",
      ring: "#5c6370",
    },
  },
  {
    id: "github-light",
    name: "GitHub Light",
    scheme: "GitHub",
    appearance: "light",
    colors: {
      background: "#ffffff",
      foreground: "#1f2328",
      raised: "#f6f8fa",
      control: "#e6eaef",
      border: "#d1d9e0",
      accent: "#0969da",
      mutedForeground: "#59636e",
      ring: "#818b98",
    },
  },
  {
    id: "github-dark",
    name: "GitHub Dark",
    scheme: "GitHub",
    appearance: "dark",
    colors: {
      background: "#0d1117",
      foreground: "#f0f6fc",
      raised: "#151b23",
      control: "#212830",
      border: "#3d444d",
      accent: "#4493f8",
      mutedForeground: "#9198a1",
      ring: "#656c76",
    },
  },
  {
    id: "github-dark-dimmed",
    name: "GitHub Dark Dimmed",
    scheme: "GitHub",
    appearance: "dark",
    colors: {
      background: "#212830",
      foreground: "#d1d7e0",
      raised: "#262c36",
      control: "#2a313c",
      border: "#3d444d",
      accent: "#478be6",
      mutedForeground: "#9198a1",
      ring: "#656c76",
    },
  },
  {
    id: "light-owl",
    name: "Light Owl",
    scheme: "Night Owl",
    appearance: "light",
    colors: {
      background: "#fbfbfb",
      foreground: "#403f53",
      raised: "#f6f6f6",
      control: "#f0f0f0",
      border: "#d9d9d9",
      accent: "#4876d6",
      mutedForeground: "#697098",
      ring: "#93a1a1",
    },
  },
  {
    id: "night-owl",
    name: "Night Owl",
    scheme: "Night Owl",
    appearance: "dark",
    colors: {
      background: "#011627",
      foreground: "#d6deeb",
      raised: "#0b253a",
      control: "#1d3b53",
      border: "#1d3b53",
      accent: "#82aaff",
      mutedForeground: "#89a4bb",
      ring: "#5f7e97",
    },
  },
  {
    id: "rose-pine-dawn",
    name: "Rosé Pine Dawn",
    scheme: "Rosé Pine",
    appearance: "light",
    colors: {
      background: "#faf4ed",
      foreground: "#575279",
      raised: "#f2e9e1",
      control: "#dfdad9",
      border: "#cecacd",
      accent: "#286983",
      mutedForeground: "#797593",
      ring: "#9893a5",
    },
  },
  {
    id: "rose-pine",
    name: "Rosé Pine",
    scheme: "Rosé Pine",
    appearance: "dark",
    colors: {
      background: "#191724",
      foreground: "#e0def4",
      raised: "#1f1d2e",
      control: "#26233a",
      border: "#403d52",
      accent: "#c4a7e7",
      mutedForeground: "#908caa",
      ring: "#6e6a86",
    },
  },
  {
    id: "rose-pine-moon",
    name: "Rosé Pine Moon",
    scheme: "Rosé Pine",
    appearance: "dark",
    colors: {
      background: "#232136",
      foreground: "#e0def4",
      raised: "#2a273f",
      control: "#393552",
      border: "#44415a",
      accent: "#c4a7e7",
      mutedForeground: "#908caa",
      ring: "#6e6a86",
    },
  },
];

const byId = new Map(PALETTES.map((palette) => [palette.id, palette]));

export function findPalette(id: string): Palette | undefined {
  return byId.get(id);
}

export function requirePalette(id: string): Palette {
  const palette = byId.get(id);
  if (!palette) throw new Error(`Unknown palette: ${id}`);
  return palette;
}

export function palettesFor(appearance: Appearance): readonly Palette[] {
  return PALETTES.filter((palette) => palette.appearance === appearance);
}

/**
 * The palette a slot uses for a stored id. An id that is unknown, or belongs to the other
 * appearance, resolves to the slot default and says so in `note`.
 */
export function resolvePalette(slot: Appearance, id: string): { palette: Palette; note: string | null } {
  const palette = findPalette(id);
  if (palette && palette.appearance === slot) return { palette, note: null };
  const fallback = requirePalette(slot === "light" ? DEFAULT_LIGHT_ID : DEFAULT_DARK_ID);
  const why = palette ? `is a ${palette.appearance} palette` : "is unknown";
  return { palette: fallback, note: `Stored ${slot} palette "${id}" ${why}; using ${fallback.name}.` };
}
