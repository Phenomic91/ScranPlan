import type { ExtractedRecipe } from '@/ai/tasks/extract-recipe';
import type { RecipeContent } from '@/domain/import/recipe-from-schema';
import { defaultShortName, step, UNITS, type Ingredient, type Unit } from '@/domain/recipes/recipe';

const DEFAULT_SERVES = 4;
const MAX_SERVES = 48;
/** Timers outside this range are almost certainly misreadings. */
const TIMER_SECONDS = { min: 10, max: 4 * 60 * 60 };

/** Holds AI's answer to the app's rules, which the output schema can't fully enforce. */
export function tidyExtracted(extracted: ExtractedRecipe): RecipeContent {
  const name = extracted.name.trim() || 'Imported recipe';
  return {
    name,
    shortName: extracted.shortName.trim() || defaultShortName(name),
    minutes: Math.max(0, Math.round(extracted.minutes)),
    serves: Math.min(MAX_SERVES, Math.max(1, Math.round(extracted.serves) || DEFAULT_SERVES)),
    vegetarian: extracted.vegetarian,
    blurb: extracted.blurb.trim(),
    oven: extracted.oven,
    ingredients: extracted.ingredients.filter((item) => item.name.trim()).map(tidyIngredient),
    steps: extracted.steps
      .filter((item) => item.text.trim())
      .map((item, index) =>
        step(
          item.title.trim() || `Step ${index + 1}`,
          item.text.trim(),
          tidyTimer(item.timerSeconds),
        ),
      ),
    note: extracted.note.trim(),
  };
}

/** A unit the app can't scale ("cup", "handful") goes back into the name. */
function tidyIngredient(item: ExtractedRecipe['ingredients'][number]): Ingredient {
  const amount = item.amount !== null && item.amount > 0 ? item.amount : null;
  const name = item.name.trim();
  if (isUnit(item.unit)) return { amount, unit: item.unit, name };
  return { amount, unit: '', name: `${item.unit.trim()} ${name}`.trim() };
}

function tidyTimer(seconds: number | null): number | undefined {
  if (seconds === null) return undefined;
  const whole = Math.round(seconds);
  return whole >= TIMER_SECONDS.min && whole <= TIMER_SECONDS.max ? whole : undefined;
}

function isUnit(unit: string): unit is Unit {
  return (UNITS as readonly string[]).includes(unit);
}
