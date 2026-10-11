import { FAN_OFFSET, formatGasMark, GAS_MARKS } from '@/domain/convert/oven';
import type { OvenSetting } from '@/domain/recipes/recipe';

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

  celsius ??= fan !== null ? fan + FAN_OFFSET : gasToCelsius(gas);
  if (celsius === null || celsius < 90 || celsius > 300) return null;
  return {
    celsius,
    fanCelsius: fan ?? celsius - FAN_OFFSET,
    gasMark: gas ?? celsiusToGas(celsius),
  };
}

function fahrenheitToCelsius(fahrenheit: number): number {
  return Math.round(((fahrenheit - 32) * 5) / 9 / 10) * 10;
}

const VULGAR: Record<string, number> = { '¼': 0.25, '½': 0.5 };

function gasToCelsius(mark: string | null): number | null {
  if (mark === null) return null;
  const value = /^(\d*)([¼½])?$/.exec(mark);
  const number = Number(value?.[1] || 0) + (VULGAR[value?.[2] ?? ''] ?? 0);
  return GAS_MARKS.find((row) => row.mark === number)?.celsius ?? null;
}

function celsiusToGas(celsius: number): string {
  const nearest = GAS_MARKS.reduce((best, row) =>
    Math.abs(row.celsius - celsius) < Math.abs(best.celsius - celsius) ? row : best,
  );
  return formatGasMark(nearest.mark);
}
