import { formatNumber } from './format';
import { convertMeasure, VOLUME_UNITS, WEIGHT_UNITS } from './measures';

describe('formatNumber', () => {
  it.each([
    [0.25, '0.25'],
    [8.818, '8.82'],
    [12.5, '12.5'],
    [250, '250'],
    [1000.4, '1000'],
    [2, '2'],
  ])('formats %p as %p', (value, expected) => {
    expect(formatNumber(value)).toBe(expected);
  });

  it('shows a dash for numbers that cannot be shown', () => {
    expect(formatNumber(Infinity)).toBe('—');
  });
});

describe('convertMeasure', () => {
  it('converts grams to every other weight', () => {
    expect(convertMeasure(250, 'g', WEIGHT_UNITS)).toEqual([
      { value: '0.25', label: 'kg' },
      { value: '8.82', label: 'oz' },
      { value: '0.55', label: 'lb' },
    ]);
  });

  it('converts spoons using UK sizes', () => {
    const rows = convertMeasure(1, 'tbsp', VOLUME_UNITS);
    expect(rows).toContainEqual({ value: '15', label: 'ml' });
    expect(rows).toContainEqual({ value: '3', label: 'tsp' });
  });

  it('returns nothing for an unknown unit', () => {
    expect(convertMeasure(1, 'stone', WEIGHT_UNITS)).toEqual([]);
  });
});
