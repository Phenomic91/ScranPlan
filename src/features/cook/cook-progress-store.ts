import Storage from 'expo-sqlite/kv-store';
import { useCallback, useSyncExternalStore } from 'react';

import { parseProgress, type CookProgress } from '@/domain/cook/progress';
import type { Recipe } from '@/domain/recipes/recipe';

// Progress is per device (ticks on your phone shouldn't tick your partner's), so it
// lives in the on-device key-value store rather than a synced table. The recipe
// page, cook view and ingredient sheet all read it, so changes are broadcast.
const cache = new Map<string, CookProgress>();
const listeners = new Set<() => void>();

const storageKey = (recipeId: string) => `cook-progress:${recipeId}`;

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function read(recipe: Recipe): CookProgress {
  let progress = cache.get(recipe.id);
  if (!progress) {
    progress = parseProgress(Storage.getItemSync(storageKey(recipe.id)), {
      ingredients: recipe.ingredients.length,
      steps: recipe.steps.length,
    });
    cache.set(recipe.id, progress);
  }
  return progress;
}

function write(recipeId: string, progress: CookProgress) {
  cache.set(recipeId, progress);
  listeners.forEach((listener) => listener());
  Storage.setItem(storageKey(recipeId), JSON.stringify(progress)).catch((error) =>
    console.warn('Could not save cooking progress', error),
  );
}

/** The cook's progress through a recipe, and a way to change it. */
export function useCookProgress(
  recipe: Recipe,
): [CookProgress, (change: (progress: CookProgress) => CookProgress) => void] {
  const progress = useSyncExternalStore(subscribe, () => read(recipe));
  const update = useCallback(
    (change: (progress: CookProgress) => CookProgress) => write(recipe.id, change(read(recipe))),
    [recipe],
  );
  return [progress, update];
}
