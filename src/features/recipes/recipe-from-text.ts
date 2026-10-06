import { runAiTask, AiUnavailableError } from '@/ai/router';
import { parseIngredients } from '@/ai/tasks/parse-ingredients';
import { ingredient, step, type Ingredient } from '@/domain/recipes/recipe';

import type { RecipeDraft } from './recipes-store';

export type RecipeForm = {
  name: string;
  serves: string;
  minutes: string;
  /** One ingredient per line, as typed or pasted. */
  ingredients: string;
  /** One step per line. */
  method: string;
};

/**
 * Builds a recipe from the new-recipe form. AI reads the ingredient lines into
 * amounts and units so they can scale; without AI they are kept as plain text.
 */
export async function recipeFromForm(form: RecipeForm): Promise<RecipeDraft> {
  const name = form.name.trim();
  return {
    name,
    shortName: name.split(/\s+/).slice(0, 2).join(' '),
    serves: positiveInteger(form.serves, 2),
    minutes: positiveInteger(form.minutes, 30),
    vegetarian: false,
    blurb: '',
    oven: null,
    ingredients: await readIngredients(lines(form.ingredients)),
    steps: lines(form.method).map((text, index) => step(`Step ${index + 1}`, text)),
    note: '',
  };
}

async function readIngredients(ingredientLines: string[]): Promise<Ingredient[]> {
  if (ingredientLines.length === 0) return [];
  try {
    const { output } = await runAiTask(parseIngredients, ingredientLines);
    return output.ingredients;
  } catch (error) {
    if (!(error instanceof AiUnavailableError)) throw error;
    return ingredientLines.map((line) => ingredient(null, '', line));
  }
}

function lines(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function positiveInteger(text: string, fallback: number): number {
  const value = Number.parseInt(text, 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}
