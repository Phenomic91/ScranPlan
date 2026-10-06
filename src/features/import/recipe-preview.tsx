import { StyleSheet, View } from 'react-native';

import { formatAmount } from '@/domain/recipes/quantities';
import { recipeSummary } from '@/features/recipes/recipe-card';
import type { RecipeDraft } from '@/features/recipes/recipes-store';
import { Card } from '@/ui/card';
import { Text } from '@/ui/text';
import { TextField } from '@/ui/text-field';
import { radius, spacing, useColors } from '@/ui/theme';

import { SourceLine } from './source-line';

type RecipePreviewProps = {
  draft: RecipeDraft;
  onRename: (name: string) => void;
};

/** The "Check the recipe" view: everything that will be saved, laid out to read through. */
export function RecipePreview({ draft, onRename }: RecipePreviewProps) {
  const colors = useColors();
  const oven = draft.oven;

  return (
    <>
      <Text variant="title">Check the recipe</Text>
      <Text muted>Read it through, rename it if you like, then save it.</Text>
      {draft.source ? <SourceLine source={draft.source} /> : null}

      <TextField label="Name" value={draft.name} onChangeText={onRename} />
      <Text variant="caption" muted>
        {[
          recipeSummary(draft),
          oven ? `oven ${oven.celsius}°C, ${oven.fanCelsius}°C fan, gas ${oven.gasMark}` : null,
        ]
          .filter(Boolean)
          .join(' · ')}
      </Text>
      {draft.blurb ? <Text muted>{draft.blurb}</Text> : null}

      <Card>
        <Text variant="heading">Ingredients</Text>
        {draft.ingredients.map((item, index) => {
          const amount = formatAmount(item.amount, item.unit);
          return <Text key={index}>{amount ? `${amount} ${item.name}` : item.name}</Text>;
        })}
      </Card>

      <Card>
        <Text variant="heading">Method</Text>
        {draft.steps.map((step, index) => (
          <View key={index} style={styles.step}>
            <Text variant="caption" muted>
              {step.title}
            </Text>
            <Text>{step.text}</Text>
            {step.timerSeconds ? (
              <Text
                variant="caption"
                style={[styles.chip, { backgroundColor: colors.accentSoft, color: colors.accent }]}
              >
                Timer {formatTimer(step.timerSeconds)}
              </Text>
            ) : null}
          </View>
        ))}
      </Card>

      {draft.note ? <Text muted>{draft.note}</Text> : null}
    </>
  );
}

function formatTimer(seconds: number): string {
  return seconds < 90 ? `${seconds} sec` : `${Math.round(seconds / 60)} min`;
}

const styles = StyleSheet.create({
  step: { gap: spacing.xs, marginTop: spacing.sm },
  chip: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
});
