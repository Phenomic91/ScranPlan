import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from './text';
import { radius, spacing, useColors } from './theme';

type ChipProps = {
  label: string;
  /** Without onPress the chip is a plain label. */
  onPress?: () => void;
  selected?: boolean;
  accessibilityLabel?: string;
};

/** A small rounded label, or a toggle when it has onPress. */
export function Chip({ label, onPress, selected = false, accessibilityLabel }: ChipProps) {
  const colors = useColors();
  const look = [
    styles.chip,
    selected
      ? { backgroundColor: colors.text, borderColor: colors.text }
      : { backgroundColor: colors.surfaceMuted, borderColor: colors.surfaceMuted },
  ];
  const text = (
    <Text variant="caption" style={{ color: selected ? colors.background : colors.text }}>
      {label}
    </Text>
  );

  if (!onPress) return <View style={look}>{text}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={accessibilityLabel}
      hitSlop={spacing.xs}
      onPress={onPress}
      style={({ pressed }) => [look, styles.pressable, pressed && styles.pressed]}
    >
      {text}
    </Pressable>
  );
}

/** Lays chips out in a wrapping row. */
export function ChipRow({ children }: { children: ReactNode }) {
  return <View style={styles.row}>{children}</View>;
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
    justifyContent: 'center',
    minHeight: 36,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  pressable: { paddingHorizontal: spacing.lg },
  pressed: { opacity: 0.7 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
