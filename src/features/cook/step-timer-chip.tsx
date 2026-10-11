import { useEffect, useState } from 'react';

import type { Recipe, Step } from '@/domain/recipes/recipe';
import { parseStepSeconds } from '@/domain/timers/step-time';
import { formatDuration } from '@/domain/timers/timer';
import { startTimer } from '@/features/timers/timers-store';
import { Chip } from '@/ui/chip';

type StepTimerChipProps = { recipe: Recipe; step: Step };

/**
 * "Start 12 min timer" on steps with a time, set on the step or read from its text. The timer is
 * labelled "<short name> · <step title>".
 */
export function StepTimerChip({ recipe, step }: StepTimerChipProps) {
  const [started, setStarted] = useState(false);

  // Says "Timer started" briefly, so a second tap doesn't start a duplicate by accident.
  useEffect(() => {
    if (!started) return;
    const reset = setTimeout(() => setStarted(false), 1500);
    return () => clearTimeout(reset);
  }, [started]);

  const seconds = step.timerSeconds ?? parseStepSeconds(step.text);
  if (!seconds) return null;

  const duration = formatDuration(seconds);
  return (
    <Chip
      label={started ? 'Timer started' : `Start ${duration} timer`}
      selected={started}
      accessibilityLabel={`Start a ${duration} timer for ${step.title}`}
      onPress={() => {
        if (started) return;
        setStarted(true);
        void startTimer(`${recipe.shortName || recipe.name} · ${step.title}`, seconds);
      }}
    />
  );
}
