/** A converted value shown as one row: "8.82" next to "oz". */
export type ConversionRow = { value: string; label: string };

/**
 * Formats a converted number with fewer decimals as it grows (2, then 1, then 0)
 * and no trailing zeros, so 0.25, 12.5 and 250 all read naturally.
 */
export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return '—';
  const size = Math.abs(value);
  const decimals = size >= 100 ? 0 : size >= 10 ? 1 : 2;
  const text = value.toFixed(decimals);
  return text.includes('.') ? text.replace(/0+$/, '').replace(/\.$/, '') : text;
}
