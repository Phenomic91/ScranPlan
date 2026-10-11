import { formatStepDuration } from '@/domain/cook/duration';
import type { Recipe, Step } from '@/domain/recipes/recipe';
import { Chip } from '@/ui/chip';

type StepTimerChipProps = { recipe: Recipe; step: Step };

/**
 * "12 min" on steps with a fixed time. The timers piece makes this start a timer
 * labelled "<short name> · <step title>"; until then it only shows the time.
 */
export function StepTimerChip({ step }: StepTimerChipProps) {
  if (!step.timerSeconds) return null;
  return <Chip label={formatStepDuration(step.timerSeconds)} />;
}
