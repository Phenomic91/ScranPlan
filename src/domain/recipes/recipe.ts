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
});
export type Recipe = z.infer<typeof recipeSchema>;

export function ingredient(amount: number | null, unit: Unit, name: string): Ingredient {
  return { amount, unit, name };
}

export function step(title: string, text: string, timerSeconds?: number): Step {
  return timerSeconds === undefined ? { title, text } : { title, text, timerSeconds };
}
