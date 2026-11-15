import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DEFAULT_DARK_ID,
  DEFAULT_LIGHT_ID,
  findPalette,
  PALETTES,
  palettesFor,
  resolvePalette,
} from "./palettes.ts";

const FIELDS = ["background", "foreground", "raised", "control", "border", "accent", "mutedForeground", "ring"] as const;

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((start) => {
    const channel = Number.parseInt(hex.slice(start, start + 2), 16) / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [lighter, darker] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (lighter + 0.05) / (darker + 0.05);
}

test("the catalog has 26 palettes, 10 light and 16 dark", () => {
  assert.equal(PALETTES.length, 26);
  assert.equal(palettesFor("light").length, 10);
  assert.equal(palettesFor("dark").length, 16);
});

test("each scheme has the palettes the spec lists", () => {
  const perScheme = Object.fromEntries(
    [...new Set(PALETTES.map((palette) => palette.scheme))].map((scheme) => [
      scheme,
      PALETTES.filter((palette) => palette.scheme === scheme).length,
    ]),
  );
  assert.deepEqual(perScheme, {
    Catppuccin: 4,
    Gruvbox: 6,
    Solarized: 2,
    "Tokyo Night": 4,
    One: 2,
    GitHub: 3,
    "Night Owl": 2,
    "Rosé Pine": 3,
  });
});

test("ids are unique and valid plugin ids", () => {
  const ids = PALETTES.map((palette) => palette.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ids) assert.match(id, /^[a-z][a-z0-9-]*$/);
});

test("every palette has all eight colors as 6-digit hex", () => {
  for (const palette of PALETTES) {
    assert.deepEqual(Object.keys(palette.colors).sort(), [...FIELDS].sort(), palette.id);
    for (const field of FIELDS) assert.match(palette.colors[field], /^#[0-9a-f]{6}$/, `${palette.id}.${field}`);
  }
});

test("appearance matches the colors: light has a lighter background than text, dark the reverse", () => {
  for (const palette of PALETTES) {
    const background = luminance(palette.colors.background);
    const text = luminance(palette.colors.foreground);
    assert.ok(palette.appearance === "light" ? background > text : background < text, palette.id);
  }
});

test("text stays readable on the background", () => {
  for (const palette of PALETTES) {
    const ratio = contrast(palette.colors.foreground, palette.colors.background);
    assert.ok(ratio >= 4, `${palette.id} text contrast ${ratio.toFixed(2)}`);
  }
});

test("the defaults exist in the slot they default", () => {
  assert.equal(findPalette(DEFAULT_LIGHT_ID)?.appearance, "light");
  assert.equal(findPalette(DEFAULT_DARK_ID)?.appearance, "dark");
});

test("resolvePalette keeps a valid choice and falls back, with a note, for an unknown or wrong-slot id", () => {
  assert.deepEqual(resolvePalette("dark", "gruvbox-dark-hard").note, null);
  assert.equal(resolvePalette("dark", "gruvbox-dark-hard").palette.id, "gruvbox-dark-hard");

  const unknown = resolvePalette("light", "no-such-palette");
  assert.equal(unknown.palette.id, DEFAULT_LIGHT_ID);
  assert.match(unknown.note ?? "", /unknown/);

  const wrongSlot = resolvePalette("light", "catppuccin-mocha");
  assert.equal(wrongSlot.palette.id, DEFAULT_LIGHT_ID);
  assert.match(wrongSlot.note ?? "", /dark palette/);
});
