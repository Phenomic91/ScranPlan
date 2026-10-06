import { z } from 'zod';

/** Units the app scales and converts. Counted things (eggs, onions) use ''. */
export const UNITS = ['', 'g', 'kg', 'ml', 'tsp', 'tbsp'] as const;
export type Unit = (typeof UNITS)[number];

export const ingredientSchema = z.object({
  /** null when the recipe gives no quantity ("salt, to taste"). */
  amount: z.number().positive().nullable(),
  unit: z.enum(UNITS),
  name: z.string().min(1),
});
export type Ingredient = z.infer<typeof ingredientSchema>;

export const stepSchema = z.object({
  title: z.string().min(1),
  text: z.string().min(1),
  /** Set when the step has a fixed cooking or waiting time. */
  timerSeconds: z.number().int().positive().optional(),
});
export type Step = z.infer<typeof stepSchema>;

export const ovenSettingSchema = z.object({
  celsius: z.number(),
  fanCelsius: z.number(),
  gasMark: z.string(),
});
export type OvenSetting = z.infer<typeof ovenSettingSchema>;

/** Where an imported recipe came from. Recipes typed into the app have none. */
export const recipeSourceSchema = z.object({
  /** The page it was imported from; null for pasted text. */
  url: z.string().nullable(),
  siteName: z.string().nullable(),
  author: z.string().nullable(),
  importedAt: z.string(),
  /** True when AI filled gaps the original left, such as a missing method or servings. */
  inferred: z.boolean(),
});
export type RecipeSource = z.infer<typeof recipeSourceSchema>;

export const recipeSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  /** One or two words, used to label timers. */
  shortName: z.string(),
  minutes: z.number().int().nonnegative(),
  serves: z.number().int().positive(),
  vegetarian: z.boolean(),
  blurb: z.string(),
  oven: ovenSettingSchema.nullable(),
  ingredients: z.array(ingredientSchema),
  steps: z.array(stepSchema),
  note: z.string(),
  source: recipeSourceSchema.optional(),
});
export type Recipe = z.infer<typeof recipeSchema>;

/** The first two words of the name, used until the user picks a better short name. */
export function defaultShortName(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).join(' ');
}

export function ingredient(amount: number | null, unit: Unit, name: string): Ingredient {
  return { amount, unit, name };
}

export function step(title: string, text: string, timerSeconds?: number): Step {
  return timerSeconds === undefined ? { title, text } : { title, text, timerSeconds };
}
