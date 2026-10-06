import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { formatAmount, scaleIngredient } from '@/domain/recipes/quantities';
import { SourceLine } from '@/features/import/source-line';
import { recipeSummary } from '@/features/recipes/recipe-card';
import { deleteRecipe, isStarterRecipe, useRecipe } from '@/features/recipes/recipes-store';
import { Button } from '@/ui/button';
import { Card } from '@/ui/card';
import { MessageScreen } from '@/ui/message-screen';
import { Screen } from '@/ui/screen';
import { Text } from '@/ui/text';
import { spacing } from '@/ui/theme';

export default function RecipeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const recipe = useRecipe(id);
  const [serves, setServes] = useState<number | null>(null);

  if (!recipe) return <MessageScreen title="Recipe not found" />;
  const cooking = serves ?? recipe.serves;

  const confirmDelete = () =>
    Alert.alert(`Delete ${recipe.name}?`, 'It will be removed from all your devices.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteRecipe(recipe.id);
          router.back();
        },
      },
    ]);

  return (
    <Screen>
      <Stack.Screen options={{ title: recipe.shortName }} />
      <Text variant="title">{recipe.name}</Text>
      <Text variant="caption" muted>
        {recipeSummary(recipe)}
      </Text>
      {recipe.blurb ? <Text muted>{recipe.blurb}</Text> : null}
      {recipe.source ? <SourceLine source={recipe.source} /> : null}

      <Card>
        <View style={styles.servesRow}>
          <Text variant="heading">Ingredients</Text>
          <View style={styles.stepper}>
            <Button
              label="−"
              variant="secondary"
              disabled={cooking <= 1}
              onPress={() => setServes(cooking - 1)}
            />
            <Text>Serves {cooking}</Text>
            <Button label="+" variant="secondary" onPress={() => setServes(cooking + 1)} />
          </View>
        </View>
        {recipe.ingredients.map((item, index) => {
          const scaled = scaleIngredient(item, recipe.serves, cooking);
          const amount = formatAmount(scaled.amount, scaled.unit);
          return <Text key={index}>{amount ? `${amount} ${scaled.name}` : scaled.name}</Text>;
        })}
      </Card>

      <Card>
        <Text variant="heading">Method</Text>
        {recipe.steps.map((step, index) => (
          <View key={index} style={styles.step}>
            <Text variant="caption" muted>
              {step.title}
            </Text>
            <Text>{step.text}</Text>
          </View>
        ))}
      </Card>

      {recipe.note ? <Text muted>{recipe.note}</Text> : null}

      {isStarterRecipe(recipe.id) ? null : (
        <Button label="Delete recipe" variant="secondary" onPress={confirmDelete} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  servesRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  step: { gap: spacing.xs, marginTop: spacing.sm },
});
