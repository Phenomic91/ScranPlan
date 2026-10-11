import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/ui/text';
import { radius, spacing, useColors } from '@/ui/theme';

type TickRowProps = {
  checked: boolean;
  onToggle: () => void;
  /** Bold, fixed-width lead text such as an amount or step number. */
  lead?: string;
  label: string;
};

/** A row with a tick box, used for ingredients and steps. Ticked rows are struck through. */
export function TickRow({ checked, onToggle, lead, label }: TickRowProps) {
  const colors = useColors();
  const textStyle = checked ? styles.ticked : null;

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      onPress={onToggle}
      style={({ pressed }) => [
        styles.row,
        { borderColor: colors.border },
        pressed && styles.pressed,
      ]}
    >
      <View
        style={[
          styles.box,
          checked
            ? { backgroundColor: colors.accent, borderColor: colors.accent }
            : { borderColor: colors.textMuted },
        ]}
      >
        {checked ? (
          <SymbolView
            name={{ ios: 'checkmark', android: 'check' }}
            size={14}
            weight="bold"
            tintColor={colors.onAccent}
          />
        ) : null}
      </View>
      {lead ? (
        <Text muted={checked} style={[styles.lead, textStyle]}>
          {lead}
        </Text>
      ) : null}
      <Text muted={checked} style={[styles.label, textStyle]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 52,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  box: {
    width: 24,
    height: 24,
    borderRadius: radius.sm - 1,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lead: { width: 72, fontWeight: '600', fontVariant: ['tabular-nums'] },
  label: { flex: 1 },
  ticked: { textDecorationLine: 'line-through' },
  pressed: { opacity: 0.7 },
});
