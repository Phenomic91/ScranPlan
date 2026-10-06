import { StyleSheet, View } from 'react-native';

import { Text } from './text';
import { spacing, useColors } from './theme';

/** Full-screen message for states such as a failed start-up. */
export function MessageScreen({ title, body }: { title: string; body?: string }) {
  const colors = useColors();
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text variant="heading">{title}</Text>
      {body ? <Text muted>{body}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: spacing.xl, gap: spacing.sm },
});
