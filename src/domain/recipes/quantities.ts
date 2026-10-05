import type { Ingredient, Unit } from './recipe';

const FRACTIONS: Record<number, string> = { 0: '', 0.25: '¼', 0.5: '½', 0.75: '¾' };

/** Scales an ingredient from the recipe's servings to the servings being cooked. */
export function scaleIngredient(
  item: Ingredient,
  fromServes: number,
  toServes: number,
): Ingredient {
  if (item.amount === null) return item;
  return { ...item, amount: (item.amount * toServes) / fromServes };
}

/**
 * Formats an amount the way a UK recipe would print it: weights and volumes
 * rounded to sensible steps, spoons and counted items to the nearest quarter.
 * Returns '' when the ingredient has no amount.
 */
export function formatAmount(amount: number | null, unit: Unit): string {
  if (amount === null) return '';

  let value = amount;
  let shownUnit: Unit = unit;
  if (shownUnit === 'tsp' && value >= 3) {
    value /= 3;
    shownUnit = 'tbsp';
  }
  if (shownUnit === 'g' && value >= 1000) {
    value /= 1000;
    shownUnit = 'kg';
  }

  if (shownUnit === 'g' || shownUnit === 'ml') {
    const rounded = value >= 50 ? Math.round(value / 5) * 5 : Math.round(value);
    return `${rounded} ${shownUnit}`;
  }
  if (shownUnit === 'kg') {
    return `${Math.round(value * 10) / 10} kg`;
  }

  const quarters = Math.max(0.25, Math.round(value * 4) / 4);
  const whole = Math.floor(quarters);
  const fraction = FRACTIONS[quarters - whole] ?? '';
  const number = `${whole || ''}${fraction}`;
  return shownUnit ? `${number} ${shownUnit}` : number;
}
