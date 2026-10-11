/** Where the cook is in a recipe. Kept on the device only, never synced. */
export type CookProgress = {
  /** Servings chosen on the recipe page; null means the recipe's own. */
  serves: number | null;
  /** The step showing in cook mode. */
  step: number;
  tickedIngredients: number[];
  doneSteps: number[];
};

export const NEW_PROGRESS: CookProgress = {
  serves: null,
  step: 0,
  tickedIngredients: [],
  doneSteps: [],
};

export function toggleIndex(list: readonly number[], index: number): number[] {
  return list.includes(index) ? list.filter((item) => item !== index) : [...list, index];
}

export function clearTicks(progress: CookProgress): CookProgress {
  return { ...progress, step: 0, tickedIngredients: [], doneSteps: [] };
}

/** The first step not yet done, or the last step when every step is done. */
export function firstUndoneStep(doneSteps: readonly number[], stepCount: number): number {
  for (let index = 0; index < stepCount; index++) {
    if (!doneSteps.includes(index)) return index;
  }
  return Math.max(stepCount - 1, 0);
}

/**
 * Reads saved progress, dropping anything that no longer fits the recipe (it may
 * have been edited on another device since) or that isn't the expected shape.
 */
export function parseProgress(
  saved: string | null,
  sizes: { ingredients: number; steps: number },
): CookProgress {
  if (!saved) return NEW_PROGRESS;
  let value: Partial<CookProgress>;
  try {
    value = JSON.parse(saved);
  } catch {
    return NEW_PROGRESS;
  }
  const indexes = (list: unknown, size: number) =>
    Array.isArray(list)
      ? list.filter((item): item is number => Number.isInteger(item) && item >= 0 && item < size)
      : [];
  const step = Number.isInteger(value.step) ? (value.step as number) : 0;
  const serves =
    Number.isInteger(value.serves) && (value.serves as number) > 0 ? value.serves! : null;
  return {
    serves,
    step: Math.min(Math.max(step, 0), Math.max(sizes.steps - 1, 0)),
    tickedIngredients: indexes(value.tickedIngredients, sizes.ingredients),
    doneSteps: indexes(value.doneSteps, sizes.steps),
  };
}
