import { defaultShortName, step, type Recipe } from '@/domain/recipes/recipe';

import { parseIngredientLine } from './ingredient-line';
import { findOvenSetting } from './oven';
import { readServings, type SchemaRecipe } from './schema-recipe';

/** A recipe's content, before it has an id or a source. */
export type RecipeContent = Omit<Recipe, 'id' | 'source'>;

/** Used when a site gives no servings; most recipe sites write for four. */
const DEFAULT_SERVES = 4;

/**
 * Turns a site's recipe data into a ScranPlan recipe by fixed rules, with no
 * AI: steps are numbered rather than titled, and timers are left for cook
 * mode to read from the step text.
 */
export function recipeFromSchema(schema: SchemaRecipe): RecipeContent {
  return {
    name: schema.name,
    shortName: defaultShortName(schema.name),
    minutes: schema.totalMinutes ?? 0,
    serves: readServings(schema.servings) ?? DEFAULT_SERVES,
    vegetarian: schema.dietHints.some((hint) => /(?<!non-?\s?)\b(vegetarian|vegan)/i.test(hint)),
    blurb: firstSentence(schema.description),
    oven: findOvenSetting(schema.steps),
    ingredients: schema.ingredients.map(parseIngredientLine),
    steps: schema.steps.map((text, index) => step(`Step ${index + 1}`, text)),
    note: '',
  };
}

/**
 * Lays the recipe data out as plain text for AI to tidy into ScranPlan's
 * format. Far shorter than the page, so it is quicker and cheaper to read.
 */
export function schemaRecipeAsText(schema: SchemaRecipe): string {
  return [
    `Title: ${schema.name}`,
    schema.description && `Description: ${schema.description}`,
    schema.servings && `Serves: ${schema.servings}`,
    schema.totalMinutes && `Total time: ${schema.totalMinutes} minutes`,
    'Ingredients:',
    ...schema.ingredients.map((line) => `- ${line}`),
    'Method:',
    ...schema.steps.map((text, index) => `${index + 1}. ${text}`),
  ]
    .filter(Boolean)
    .join('\n');
}

function firstSentence(text: string): string {
  const sentence = /^.*?[.!?](?=\s|$)/.exec(text.trim())?.[0] ?? text.trim();
  return sentence.length > 160 ? `${sentence.slice(0, 157).trimEnd()}…` : sentence;
}
