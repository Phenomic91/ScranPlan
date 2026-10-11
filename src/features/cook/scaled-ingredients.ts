import { formatAmount, scaleIngredient } from '@/domain/recipes/quantities';
import type { Recipe } from '@/domain/recipes/recipe';

export type IngredientLine = { amount: string; name: string };

/** The recipe's ingredients as printed for the servings being cooked. */
export function scaledIngredients(recipe: Recipe, serves: number): IngredientLine[] {
  return recipe.ingredients.map((item) => {
    const scaled = scaleIngredient(item, recipe.serves, serves);
    return { amount: formatAmount(scaled.amount, scaled.unit), name: scaled.name };
  });
}

/** "300 g chicken breast", or just the name when there is no amount. */
export function ingredientText({ amount, name }: IngredientLine): string {
  return amount ? `${amount} ${name}` : name;
}
