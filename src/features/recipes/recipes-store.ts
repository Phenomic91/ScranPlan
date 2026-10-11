import * as Crypto from 'expo-crypto';
import { and, asc, eq, isNull } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { db } from '@/db/client';
import { recipes } from '@/db/schema';
import type { Recipe } from '@/domain/recipes/recipe';
import { STARTER_RECIPES } from '@/domain/recipes/starter-recipes';
import { requestSync } from '@/sync/request-sync';

export type RecipeDraft = Omit<Recipe, 'id'>;

const activeRecipes = db
  .select()
  .from(recipes)
  .where(isNull(recipes.deletedAt))
  .orderBy(asc(recipes.name));

/** The user's own recipes (newest data from the device), followed by the starter set. */
export function useRecipes(): { mine: Recipe[]; starters: readonly Recipe[] } {
  const { data } = useLiveQuery(activeRecipes);
  return { mine: data.map(toRecipe), starters: STARTER_RECIPES };
}

export function useRecipe(id: string): Recipe | undefined {
  const starter = STARTER_RECIPES.find((recipe) => recipe.id === id);
  const { data } = useLiveQuery(
    db
      .select()
      .from(recipes)
      .where(and(eq(recipes.id, id), isNull(recipes.deletedAt))),
    [id],
  );
  return starter ?? (data[0] ? toRecipe(data[0]) : undefined);
}

export function isStarterRecipe(id: string): boolean {
  return id.startsWith('starter-');
}

export async function addRecipe(draft: RecipeDraft): Promise<string> {
  const id = Crypto.randomUUID();
  const now = new Date().toISOString();
  await db
    .insert(recipes)
    .values({ ...draft, id, createdAt: now, clientUpdatedAt: now, dirty: true });
  requestSync();
  return id;
}

/** Soft-deletes, so the deletion reaches the user's other devices. */
export async function deleteRecipe(id: string): Promise<void> {
  const now = new Date().toISOString();
  await db
    .update(recipes)
    .set({ deletedAt: now, clientUpdatedAt: now, dirty: true })
    .where(eq(recipes.id, id));
  requestSync();
}

function toRecipe(row: typeof recipes.$inferSelect): Recipe {
  const { createdAt, clientUpdatedAt, deletedAt, dirty, source, ...recipe } = row;
  return { ...recipe, oven: recipe.oven ?? null, source: source ?? undefined };
}
