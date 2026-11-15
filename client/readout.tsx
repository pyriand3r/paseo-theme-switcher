import type { PluginHostProps } from "@getpaseo/plugin/client";
import { useMemo } from "react";
import { Text, View } from "react-native";

interface ReadoutProps {
  theme: PluginHostProps["theme"];
  layout: PluginHostProps["layout"];
  label: string;
  value: string;
  danger?: boolean;
}

/** A labelled, selectable text value. Meant as a direct child of a `SettingsCard`. */
export function Readout({ theme, layout, label, value, danger = false }: ReadoutProps) {
  const styles = useMemo(
    () => ({
      root: {
        paddingVertical: layout.compact ? 10 : 12,
        paddingHorizontal: layout.compact ? 12 : 16,
        gap: 2,
      },
      label: { color: theme.colors.foregroundMuted, fontSize: 12 },
      value: { color: danger ? theme.colors.statusDanger : theme.colors.foreground, fontSize: 14 },
    }),
    [theme, layout.compact, danger],
  );
  return (
    <View style={styles.root}>
      <Text style={styles.label}>{label}</Text>
      <Text selectable style={styles.value}>
        {value}
      </Text>
    </View>
  );
}
