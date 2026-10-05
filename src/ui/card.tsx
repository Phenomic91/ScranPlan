import { StyleSheet, View, type ViewProps } from 'react-native';

import { radius, spacing, useColors } from './theme';

export function Card({ style, ...rest }: ViewProps) {
  const colors = useColors();
  return (
    <View
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, style]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
});
