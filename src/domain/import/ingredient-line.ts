import type { Ingredient, Unit } from '@/domain/recipes/recipe';

const VULGAR_FRACTIONS: Record<string, number> = {
  '½': 1 / 2,
  '⅓': 1 / 3,
  '⅔': 2 / 3,
  '¼': 1 / 4,
  '¾': 3 / 4,
  '⅕': 1 / 5,
  '⅛': 1 / 8,
};

// Mixed numbers and fractions come first, so "1 1/2" and "1/2" aren't read as "1".
const NUMBER = String.raw`(?:\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:[.,]\d+)?(?:\s*[½⅓⅔¼¾⅕⅛])?|[½⅓⅔¼¾⅕⅛])`;

/** A leading amount, optionally a range ("2–3", "2 to 3"), whose lower end is kept. */
const LEADING_AMOUNT = new RegExp(String.raw`^(${NUMBER})(?:\s*(?:-|–|to)\s*${NUMBER})?\s*`);

type UnitRule = { pattern: RegExp; unit: Unit; factor: number };

// Longest spellings first, so "tbsp" is not read as "t" and "fl oz" not as "fl".
// Imperial and US units become metric, as the app only scales metric units.
const UNIT_RULES: UnitRule[] = [
  { pattern: /^(?:tablespoons?|tbsps?|tbs|tbl)\b\.?/i, unit: 'tbsp', factor: 1 },
  { pattern: /^(?:teaspoons?|tsps?)\b\.?/i, unit: 'tsp', factor: 1 },
  { pattern: /^(?:kilograms?|kilos?|kgs?)\b\.?/i, unit: 'kg', factor: 1 },
  { pattern: /^(?:grams?|grammes?|gr|g)\b\.?/i, unit: 'g', factor: 1 },
  { pattern: /^(?:millilitres?|milliliters?|mls?)\b\.?/i, unit: 'ml', factor: 1 },
  { pattern: /^(?:centilitres?|centiliters?|cl)\b\.?/i, unit: 'ml', factor: 10 },
  { pattern: /^(?:litres?|liters?|ltrs?|l)\b\.?/i, unit: 'ml', factor: 1000 },
  { pattern: /^(?:fluid ounces?|fl\.? ?oz)\b\.?/i, unit: 'ml', factor: 28.4 },
  { pattern: /^(?:ounces?|oz)\b\.?/i, unit: 'g', factor: 28.35 },
  { pattern: /^(?:pounds?|lbs?)\b\.?/i, unit: 'g', factor: 453.6 },
  { pattern: /^(?:cups?|c)\b\.?/i, unit: 'ml', factor: 240 },
  { pattern: /^pints?\b\.?/i, unit: 'ml', factor: 568 },
];

/** "heaped tbsp" and "level tsp" are read as plain spoons. */
const SPOON_SIZE = /^(?:heaped|heaping|rounded|level)\s+(?=t)/i;

/** The repeat in other units that UK sites print after the amount: "/14oz", "(3½oz)", "/1lb 2oz". */
const SECOND_MEASURE = new RegExp(
  String.raw`^(?:\/\s*|\(\s*)${NUMBER}(?:\s*(?:-|–|to)\s*${NUMBER})?\s*(?:fl\.? ?oz|oz|lbs?|pints?|ml|g|kg|cups?|in)\b\.?(?:\s*${NUMBER}\s*oz\b)?\s*\)?`,
  'i',
);

/**
 * Reads one ingredient line from a recipe site ("400g/14oz chopped tomatoes",
 * "1 tbsp. olive oil", "salt, to taste") into an amount, unit and name.
 * Lines it can't read keep their wording as the name, with no amount.
 */
export function parseIngredientLine(line: string): Ingredient {
  const text = line.replace(/\s+/g, ' ').trim();
  const amountMatch = LEADING_AMOUNT.exec(text);
  if (!amountMatch?.[1]) return { amount: null, unit: '', name: text };

  const amount = parseNumber(amountMatch[1]);
  let rest = text.slice(amountMatch[0].length);

  // "1 x 400g tin tomatoes" is one tin.
  if (/^x\s/i.test(rest)) return counted(amount, rest.slice(2), text);

  rest = rest.replace(SPOON_SIZE, '');
  const rule = UNIT_RULES.find(({ pattern }) => pattern.test(rest));
  if (!rule) return counted(amount, rest, text);

  rest = rest.replace(rule.pattern, '').trim().replace(SECOND_MEASURE, '').trim();
  rest = rest.replace(/^of\s+/i, '');
  // Converted amounts are rounded; nobody weighs 14.175 g of parmesan.
  const metric = rule.factor === 1 ? amount : Math.round(amount * rule.factor);
  return { amount: metric, unit: rule.unit, name: cleanName(rest) || text };
}

function counted(amount: number, rest: string, original: string): Ingredient {
  return { amount, unit: '', name: cleanName(rest) || original };
}

/** Moves a leading size note to the end: "(6- to 8-oz.) chicken breasts" → "chicken breasts (6- to 8-oz.)". */
function cleanName(rest: string): string {
  const name = rest.replace(/^[,\s]+/, '').trim();
  const leadingNote = /^\(([^)]*)\)\s*(.+)$/.exec(name);
  return leadingNote ? `${leadingNote[2]} (${leadingNote[1]})` : name;
}

function parseNumber(text: string): number {
  const compact = text.replace(',', '.').trim();
  const mixed = /^(\d+)\s+(\d+)\/(\d+)$/.exec(compact);
  if (mixed) return Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]);
  const fraction = /^(\d+)\/(\d+)$/.exec(compact);
  if (fraction) return Number(fraction[1]) / Number(fraction[2]);
  const vulgar = /^(\d*(?:\.\d+)?)\s*([½⅓⅔¼¾⅕⅛])$/.exec(compact);
  if (vulgar?.[2]) return Number(vulgar[1] || 0) + (VULGAR_FRACTIONS[vulgar[2]] ?? 0);
  return Number(compact);
}
