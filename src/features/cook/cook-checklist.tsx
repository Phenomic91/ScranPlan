import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { clearTicks, firstUndoneStep, toggleIndex } from '@/domain/cook/progress';
import type { Recipe } from '@/domain/recipes/recipe';
import { Button } from '@/ui/button';
import { Text } from '@/ui/text';
import { spacing } from '@/ui/theme';

import { useCookProgress } from './cook-progress-store';
import { scaledIngredients } from './scaled-ingredients';
import { TickRow } from './tick-row';

/** The cook-mode sheet: tick off ingredients and steps, or jump to a step. */
export function CookChecklist({ recipe }: { recipe: Recipe }) {
  const [progress, update] = useCookProgress(recipe);
  const serves = progress.serves ?? recipe.serves;
  const lines = scaledIngredients(recipe, serves);
  const tickedCount = progress.tickedIngredients.length;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.actions}>
        {recipe.steps.length > 0 ? (
          <Button
            label={`Go to step ${firstUndoneStep(progress.doneSteps, recipe.steps.length) + 1}`}
            variant="secondary"
            onPress={() => {
              update((current) => ({
                ...current,
                step: firstUndoneStep(current.doneSteps, recipe.steps.length),
              }));
              router.back();
            }}
          />
        ) : null}
        <Button label="Clear ticks" variant="secondary" onPress={() => update(clearTicks)} />
      </View>
      <View style={styles.heading}>
        <Text variant="heading">Ingredients</Text>
        <Text variant="caption" muted>
          Serves {serves} · {tickedCount} of {lines.length} ticked
        </Text>
      </View>
      <View>
        {lines.map((line, index) => (
          <TickRow
            key={index}
            checked={progress.tickedIngredients.includes(index)}
            onToggle={() =>
              update((current) => ({
                ...current,
                tickedIngredients: toggleIndex(current.tickedIngredients, index),
              }))
            }
            lead={line.amount}
            label={line.name}
          />
        ))}
      </View>

      <Text variant="heading">Steps</Text>
      <View>
        {recipe.steps.map((step, index) => (
          <TickRow
            key={index}
            checked={progress.doneSteps.includes(index)}
            onToggle={() =>
              update((current) => ({
                ...current,
                doneSteps: toggleIndex(current.doneSteps, index),
              }))
            }
            lead={String(index + 1)}
            label={step.title}
          />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md },
  heading: { gap: spacing.xs },
  actions: { gap: spacing.sm },
});
