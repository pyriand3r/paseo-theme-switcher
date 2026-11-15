import type { PluginHostProps } from "@getpaseo/plugin/client";
import { useMemo } from "react";
import { Text, View } from "react-native";
import type { Palette } from "../shared/palettes.ts";

interface PalettePreviewProps {
  theme: PluginHostProps["theme"];
  layout: PluginHostProps["layout"];
  label: string;
  palette: Palette;
}

/**
 * The palette's name and five swatches. The swatches paint the catalog's colors on purpose: they
 * preview palette data, not plugin chrome. All text stays on `theme.colors`.
 */
export function PalettePreview({ theme, layout, label, palette }: PalettePreviewProps) {
  const styles = useMemo(
    () => ({
      root: {
        paddingVertical: layout.compact ? 10 : 12,
        paddingHorizontal: layout.compact ? 12 : 16,
        gap: 8,
      },
      label: { color: theme.colors.foregroundMuted, fontSize: 12 },
      name: { color: theme.colors.foreground, fontSize: 14 },
      swatches: { flexDirection: "row" as const, gap: 6 },
      swatch: {
        width: layout.compact ? 28 : 36,
        height: layout.compact ? 28 : 36,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: theme.colors.border,
      },
    }),
    [theme, layout.compact],
  );
  const { background, raised, control, accent, foreground } = palette.colors;
  return (
    <View style={styles.root}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.name}>{palette.name}</Text>
      <View style={styles.swatches} accessibilityLabel={`${palette.name} colors`}>
        {[background, raised, control, accent, foreground].map((color, index) => (
          <View key={index} style={[styles.swatch, { backgroundColor: color }]} />
        ))}
      </View>
    </View>
  );
}
