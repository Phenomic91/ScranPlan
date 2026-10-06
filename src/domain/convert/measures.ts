import { formatNumber, type ConversionRow } from './format';

export type MeasureUnit = {
  id: string;
  label: string;
  /** How many of the base unit (g or ml) one of this unit holds. */
  size: number;
};

export const WEIGHT_UNITS: readonly MeasureUnit[] = [
  { id: 'g', label: 'g', size: 1 },
  { id: 'kg', label: 'kg', size: 1000 },
  { id: 'oz', label: 'oz', size: 28.3495 },
  { id: 'lb', label: 'lb', size: 453.592 },
];

// UK measures: a US cup (237 ml) and US pint differ, hence the labels.
export const VOLUME_UNITS: readonly MeasureUnit[] = [
  { id: 'ml', label: 'ml', size: 1 },
  { id: 'l', label: 'litres', size: 1000 },
  { id: 'tsp', label: 'tsp', size: 5 },
  { id: 'tbsp', label: 'tbsp', size: 15 },
  { id: 'cup', label: 'cup (250 ml)', size: 250 },
  { id: 'floz', label: 'fl oz (UK)', size: 28.4131 },
  { id: 'pint', label: 'pint (UK)', size: 568.261 },
];

/** Converts an amount in one unit into every other unit of the same kind. */
export function convertMeasure(
  value: number,
  fromId: string,
  units: readonly MeasureUnit[],
): ConversionRow[] {
  const from = units.find((unit) => unit.id === fromId);
  if (!from) return [];
  const base = value * from.size;
  return units
    .filter((unit) => unit !== from)
    .map((unit) => ({ value: formatNumber(base / unit.size), label: unit.label }));
}
