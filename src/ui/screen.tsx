import type { ReactNode } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from './text';
import { spacing, useColors } from './theme';

type ScreenProps = {
  /** Shown as a large title on screens that have no navigation header (the tab roots). */
  title?: string;
  children: ReactNode;
};

/** Scrollable page body with the app background and standard padding. */
export function Screen({ title, children }: ScreenProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[
        styles.content,
        title ? { paddingTop: insets.top + spacing.lg } : null,
      ]}
      contentInsetAdjustmentBehavior={title ? 'never' : 'automatic'}
      keyboardShouldPersistTaps="handled"
      // Scrolls a focused text box above the keyboard instead of typing blind behind it.
      automaticallyAdjustKeyboardInsets
      keyboardDismissMode="interactive"
    >
      {title ? <Text variant="title">{title}</Text> : null}
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md },
});
