import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { Text } from './text';
import { radius, spacing, useColors } from './theme';

type TextFieldProps = TextInputProps & { label: string };

export function TextField({ label, style, ...inputProps }: TextFieldProps) {
  const colors = useColors();
  return (
    <View style={styles.field}>
      <Text variant="caption" muted>
        {label}
      </Text>
      <TextInput
        placeholderTextColor={colors.textMuted}
        style={[
          styles.input,
          { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border },
          inputProps.multiline && styles.multiline,
          style,
        ]}
        {...inputProps}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: 16,
  },
  // Capped so long pastes scroll inside the box and the caret stays above the keyboard.
  multiline: {
    minHeight: 120,
    maxHeight: 220,
    paddingVertical: spacing.md,
    textAlignVertical: 'top',
  },
});
