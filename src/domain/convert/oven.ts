import type { OvenSetting } from '../recipes/recipe';
import type { ConversionRow } from './format';

export type OvenScale = 'celsius' | 'fan' | 'fahrenheit' | 'gas';

export const OVEN_SCALES: readonly { id: OvenScale; label: string }[] = [
  { id: 'celsius', label: '°C conventional' },
  { id: 'fan', label: '°C fan' },
  { id: 'fahrenheit', label: '°F' },
  { id: 'gas', label: 'Gas mark' },
];

export type GasMark = { mark: number; celsius: number; fahrenheit: number };

/** The usual UK chart. Fan ovens run about 20°C hotter, so fan = celsius − 20. */
export const GAS_MARKS: readonly GasMark[] = [
  { mark: 0.25, celsius: 110, fahrenheit: 225 },
  { mark: 0.5, celsius: 130, fahrenheit: 250 },
  { mark: 1, celsius: 140, fahrenheit: 275 },
  { mark: 2, celsius: 150, fahrenheit: 300 },
  { mark: 3, celsius: 170, fahrenheit: 325 },
  { mark: 4, celsius: 180, fahrenheit: 350 },
  { mark: 5, celsius: 190, fahrenheit: 375 },
  { mark: 6, celsius: 200, fahrenheit: 400 },
  { mark: 7, celsius: 220, fahrenheit: 425 },
  { mark: 8, celsius: 230, fahrenheit: 450 },
  { mark: 9, celsius: 240, fahrenheit: 475 },
];

export const FAN_OFFSET = 20;

export function formatGasMark(mark: number): string {
  if (mark === 0.25) return '¼';
  if (mark === 0.5) return '½';
  return String(mark);
}

/** "200°C · 180°C fan · gas 6", as printed on the recipe page. */
export function formatOvenSetting(oven: OvenSetting): string {
  const parts = [`${oven.celsius}°C`, `${oven.fanCelsius}°C fan`];
  if (oven.gasMark) parts.push(`gas ${oven.gasMark}`);
  return parts.join(' · ');
}

/** Converts an oven temperature on one scale into the other three. */
export function convertOven(value: number, from: OvenScale): ConversionRow[] {
  let celsius: number;
  let chartFahrenheit: number | null = null;
  if (from === 'celsius') celsius = value;
  else if (from === 'fan') celsius = value + FAN_OFFSET;
  else if (from === 'fahrenheit') celsius = ((value - 32) * 5) / 9;
  else {
    const gas = nearest(value, (row) => row.mark);
    celsius = gas.celsius;
    chartFahrenheit = gas.fahrenheit;
  }

  const rows: ConversionRow[] = [];
  if (from !== 'celsius') {
    rows.push({ value: String(Math.round(celsius)), label: '°C conventional' });
  }
  if (from !== 'fan') {
    rows.push({ value: String(Math.round(celsius - FAN_OFFSET)), label: '°C fan' });
  }
  if (from !== 'fahrenheit') {
    // Oven dials step in 25°F, so round to the nearest step.
    const fahrenheit = chartFahrenheit ?? Math.round(((celsius * 9) / 5 + 32) / 25) * 25;
    rows.push({ value: `≈ ${fahrenheit}`, label: '°F' });
  }
  if (from !== 'gas') {
    const offScale = celsius < 105 || celsius > 245;
    const gas = formatGasMark(nearest(celsius, (row) => row.celsius).mark);
    rows.push({ value: offScale ? 'Off the scale' : gas, label: 'Gas mark' });
  }
  return rows;
}

function nearest(value: number, by: (row: GasMark) => number): GasMark {
  return GAS_MARKS.reduce((best, row) =>
    Math.abs(by(row) - value) < Math.abs(by(best) - value) ? row : best,
  );
}
