import type { OvenSetting } from '@/domain/recipes/recipe';

/** Conventional °C for each gas mark. */
const GAS_MARKS: [mark: string, celsius: number][] = [
  ['¼', 110],
  ['½', 130],
  ['1', 140],
  ['2', 150],
  ['3', 170],
  ['4', 180],
  ['5', 190],
  ['6', 200],
  ['6½', 210],
  ['7', 220],
  ['8', 230],
  ['9', 240],
];

const TEMPERATURE = /(\d{2,3})\s*(?:°|º|degrees?)?\s*(C|F)\b(\s*\(?\s*fan)?/gi;
const FAN_FIRST = /\bfan\s*(?:oven\s*)?(\d{2,3})\s*(?:°|º)?\s*C\b/i;
const GAS_MARK = /\bgas(?:\s*mark)?\s*(\d(?:\s*½)?|½|¼)/i;

/**
 * Finds the oven setting in a recipe's method ("Heat the oven to 220C/200C
 * fan/gas 7"). Only sentences that mention the oven count, so an air fryer at
 * 200C is not mistaken for one. Missing figures are worked out from the others.
 */
export function findOvenSetting(steps: string[]): OvenSetting | null {
  for (const sentence of steps.flatMap((step) => step.split(/(?<=[.!?])\s+/))) {
    if (!/\boven\b/i.test(sentence) || /\bair[\s-]?fryer\b/i.test(sentence)) continue;
    const setting = readSetting(sentence);
    if (setting) return setting;
  }
  return null;
}

function readSetting(sentence: string): OvenSetting | null {
  // "fan 180C" first, so its figure isn't also read as the conventional temperature.
  const fanFirst = FAN_FIRST.exec(sentence);
  let fan = fanFirst ? Number(fanFirst[1]) : null;
  let celsius: number | null = null;
  const rest = fanFirst ? sentence.replace(fanFirst[0], '') : sentence;
  for (const [, degrees, scale = 'C', fanWord] of rest.matchAll(TEMPERATURE)) {
    const value =
      scale.toUpperCase() === 'F' ? fahrenheitToCelsius(Number(degrees)) : Number(degrees);
    if (fanWord) fan ??= value;
    else celsius ??= value;
  }
  const gas = GAS_MARK.exec(sentence)?.[1]?.replace(/\s+/g, '') ?? null;

  celsius ??= fan !== null ? fan + 20 : gasToCelsius(gas);
  if (celsius === null || celsius < 90 || celsius > 300) return null;
  return {
    celsius,
    fanCelsius: fan ?? celsius - 20,
    gasMark: gas ?? celsiusToGas(celsius),
  };
}

function fahrenheitToCelsius(fahrenheit: number): number {
  return Math.round(((fahrenheit - 32) * 5) / 9 / 10) * 10;
}

function gasToCelsius(mark: string | null): number | null {
  return GAS_MARKS.find(([gas]) => gas === mark)?.[1] ?? null;
}

function celsiusToGas(celsius: number): string {
  const nearest = GAS_MARKS.reduce((best, entry) =>
    Math.abs(entry[1] - celsius) < Math.abs(best[1] - celsius) ? entry : best,
  );
  return nearest[0];
}
