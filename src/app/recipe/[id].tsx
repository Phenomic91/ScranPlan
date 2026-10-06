import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Alert, StyleSheet, View } from 'react-native';

import { formatOvenSetting } from '@/domain/convert/oven';
import type { Recipe } from '@/domain/recipes/recipe';
import { useCookProgress } from '@/features/cook/cook-progress-store';
import { ingredientText, scaledIngredients } from '@/features/cook/scaled-ingredients';
import { StepTimerChip } from '@/features/cook/step-timer-chip';
import { recipeSummary } from '@/features/recipes/recipe-card';
import { deleteRecipe, isStarterRecipe, useRecipe } from '@/features/recipes/recipes-store';
import { Button } from '@/ui/button';
import { Card } from '@/ui/card';
import { Chip, ChipRow } from '@/ui/chip';
import { MessageScreen } from '@/ui/message-screen';
import { Screen } from '@/ui/screen';
import { Text } from '@/ui/text';
import { spacing } from '@/ui/theme';

export default function RecipeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const recipe = useRecipe(id);
  return recipe ? <RecipeDetail recipe={recipe} /> : <MessageScreen title="Recipe not found" />;
}

function RecipeDetail({ recipe }: { recipe: Recipe }) {
  // Servings are shared with cook mode, so the amounts there match.
  const [progress, update] = useCookProgress(recipe);
  const cooking = progress.serves ?? recipe.serves;
  const setServes = (serves: number) => update((current) => ({ ...current, serves }));

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
      {recipe.oven ? (
        <ChipRow>
          <Chip label={`Oven ${formatOvenSetting(recipe.oven)}`} />
        </ChipRow>
      ) : null}
      {recipe.steps.length > 0 ? (
        <Button
          label="Cook"
          onPress={() => router.push({ pathname: '/cook/[id]', params: { id: recipe.id } })}
        />
      ) : null}

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
        {scaledIngredients(recipe, cooking).map((line, index) => (
          <Text key={index}>{ingredientText(line)}</Text>
        ))}
      </Card>

      <Card>
        <Text variant="heading">Method</Text>
        {recipe.steps.map((step, index) => (
          <View key={index} style={styles.step}>
            <Text variant="caption" muted>
              {step.title}
            </Text>
            <Text>{step.text}</Text>
            <StepTimerChip recipe={recipe} step={step} />
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
