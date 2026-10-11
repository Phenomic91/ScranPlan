import { useKeepAwake } from 'expo-keep-awake';
import { router, Stack } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ingredientsForStep } from '@/domain/cook/step-ingredients';
import type { Recipe } from '@/domain/recipes/recipe';
import { Button } from '@/ui/button';
import { Chip, ChipRow } from '@/ui/chip';
import { MessageScreen } from '@/ui/message-screen';
import { Text } from '@/ui/text';
import { radius, spacing, useColors } from '@/ui/theme';

import { useCookProgress } from './cook-progress-store';
import { ingredientText, scaledIngredients } from './scaled-ingredients';
import { StepTimerChip } from './step-timer-chip';
import { useReadAloud } from './use-read-aloud';

/** Full-screen cooking: one step at a time, in big text, with the screen kept on. */
export function CookView({ recipe }: { recipe: Recipe }) {
  useKeepAwake();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [progress, update] = useCookProgress(recipe);

  const index = progress.step;
  const step = recipe.steps[index];
  const { reading, toggleReading } = useReadAloud(step ? `${step.title}. ${step.text}` : '');

  if (!step) return <MessageScreen title="This recipe has no method yet" />;

  const isLast = index === recipe.steps.length - 1;
  const lines = scaledIngredients(recipe, progress.serves ?? recipe.serves);
  const needed = ingredientsForStep(recipe, index).map((i) => lines[i]!);

  const goBack = () => update((current) => ({ ...current, step: index - 1 }));
  const goNext = () => {
    update((current) => ({
      ...current,
      step: isLast ? index : index + 1,
      doneSteps: current.doneSteps.includes(index)
        ? current.doneSteps
        : [...current.doneSteps, index],
    }));
    if (isLast) router.back();
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: `Step ${index + 1} of ${recipe.steps.length}` }} />
      <Stack.Toolbar placement="left">
        <Stack.Toolbar.Button icon="xmark" accessibilityLabel="Close" onPress={router.back} />
      </Stack.Toolbar>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button
          icon="checklist"
          accessibilityLabel="Ingredients and steps"
          onPress={() =>
            router.push({ pathname: '/cook/[id]/ingredients', params: { id: recipe.id } })
          }
        />
      </Stack.Toolbar>

      <ScrollView contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
        <ProgressBar done={index + 1} total={recipe.steps.length} />
        <Text variant="title">{step.title}</Text>
        <Text style={styles.stepText}>{step.text}</Text>

        <ChipRow>
          <StepTimerChip recipe={recipe} step={step} />
          <Chip
            label={reading ? 'Reading aloud' : 'Read aloud'}
            selected={reading}
            onPress={toggleReading}
          />
        </ChipRow>

        {needed.length > 0 ? (
          <View style={[styles.needed, { backgroundColor: colors.surface }]}>
            <Text variant="caption" muted>
              For this step
            </Text>
            {needed.map((line, i) => (
              <Text key={i}>{ingredientText(line)}</Text>
            ))}
          </View>
        ) : null}
      </ScrollView>

      <View
        style={[
          styles.footer,
          { paddingBottom: insets.bottom + spacing.md, borderColor: colors.border },
        ]}
      >
        <View style={styles.footerButton}>
          <Button label="Back" variant="secondary" disabled={index === 0} onPress={goBack} />
        </View>
        <View style={styles.footerButton}>
          <Button label={isLast ? 'Finish' : 'Next'} onPress={goNext} />
        </View>
      </View>
    </View>
  );
}

function ProgressBar({ done, total }: { done: number; total: number }) {
  const colors = useColors();
  return (
    <View style={[styles.track, { backgroundColor: colors.surfaceMuted }]}>
      <View
        style={[styles.fill, { backgroundColor: colors.accent, width: `${(done / total) * 100}%` }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.lg },
  stepText: { fontSize: 26, lineHeight: 36 },
  needed: { borderRadius: radius.lg, padding: spacing.lg, gap: spacing.xs },
  track: { height: 6, borderRadius: radius.pill, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.pill },
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerButton: { flex: 1 },
});
