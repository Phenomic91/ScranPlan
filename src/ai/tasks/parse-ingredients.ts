import { z } from 'zod';

import { ingredientSchema, UNITS } from '@/domain/recipes/recipe';

import type { AiTask } from '../task';

const outputSchema = z.object({ ingredients: z.array(ingredientSchema) });

/** Turns free-text ingredient lines ("2 tbsp olive oil") into structured ingredients. */
export const parseIngredients: AiTask<string[], z.infer<typeof outputSchema>> = {
  name: 'parse-ingredients',
  instructions: [
    'You read ingredient lines from UK recipes and return them as structured data.',
    `Use only these units: ${UNITS.filter(Boolean).join(', ')}. Use an empty unit for counted items (2 eggs) or items with no amount.`,
    'Convert other units to the closest of these (1 cup flour is about 125 g; 1 oz is 28 g; a pinch is 0.25 tsp).',
    'Give amount as a number, or null when there is none ("salt to taste").',
    'Keep the name short and lower case, without the amount or unit ("olive oil", "red onion, finely chopped").',
    'Return one ingredient per line, in the same order.',
  ].join('\n'),
  prompt: (lines) => lines.join('\n'),
  output: outputSchema,
  maxTokens: 4000,
  fitsOnDevice: true,
};
