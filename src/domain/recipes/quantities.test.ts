import { formatAmount, scaleIngredient } from './quantities';
import { ingredient } from './recipe';

describe('formatAmount', () => {
  it.each([
    [300, 'g', '300 g'],
    [37, 'g', '37 g'],
    [152, 'g', '150 g'],
    [1500, 'g', '1.5 kg'],
    [200, 'ml', '200 ml'],
    [1.5, 'tbsp', '1½ tbsp'],
    [6, 'tsp', '2 tbsp'],
    [0.5, 'tsp', '½ tsp'],
    [0.1, 'tsp', '¼ tsp'],
    [3, '', '3'],
    [0.75, '', '¾'],
  ] as const)('formats %p %p as %p', (amount, unit, expected) => {
    expect(formatAmount(amount, unit)).toBe(expected);
  });

  it('returns an empty string when there is no amount', () => {
    expect(formatAmount(null, '')).toBe('');
  });
});

describe('scaleIngredient', () => {
  it('scales the amount by servings', () => {
    expect(scaleIngredient(ingredient(300, 'g', 'chicken'), 2, 3).amount).toBe(450);
  });

  it('leaves unquantified ingredients alone', () => {
    const salt = ingredient(null, '', 'salt, to taste');
    expect(scaleIngredient(salt, 2, 4)).toBe(salt);
  });
});
