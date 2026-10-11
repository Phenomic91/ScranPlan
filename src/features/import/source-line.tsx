import * as WebBrowser from 'expo-web-browser';
import { StyleSheet, View } from 'react-native';

import type { RecipeSource } from '@/domain/recipes/recipe';
import { Text } from '@/ui/text';
import { spacing, useColors } from '@/ui/theme';

/** "From BBC Good Food, open original", plus a warning when AI filled gaps. */
export function SourceLine({ source }: { source: RecipeSource }) {
  const colors = useColors();
  const { url } = source;

  return (
    <View style={styles.container}>
      {url ? (
        <Text variant="caption" muted>
          From {source.siteName ?? new URL(url).hostname}
          {source.author ? ` (${source.author})` : ''},{' '}
          <Text
            variant="caption"
            accessibilityRole="link"
            style={{ color: colors.accent }}
            onPress={() => WebBrowser.openBrowserAsync(url)}
          >
            open original
          </Text>
        </Text>
      ) : null}
      {source.inferred ? (
        <Text variant="caption" style={{ color: colors.danger }}>
          AI filled in parts of this recipe, such as the method or servings. Check it before you
          cook.
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
});
