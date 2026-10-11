import { parseIngredientLine } from './ingredient-line';

describe('parseIngredientLine', () => {
  it.each([
    ['2 tbsp olive oil', 2, 'tbsp', 'olive oil'],
    ['½ tsp chilli flakes', 0.5, 'tsp', 'chilli flakes'],
    ['1½ tsp ground cumin', 1.5, 'tsp', 'ground cumin'],
    ['400g/14oz chopped tomatoes', 400, 'g', 'chopped tomatoes'],
    ['500g/1lb 2oz turkey mince', 500, 'g', 'turkey mince'],
    ['100g (3½oz) butter', 100, 'g', 'butter'],
    ['250ml/9fl oz double cream', 250, 'ml', 'double cream'],
    ['750ml/1¼ pints hot stock', 750, 'ml', 'hot stock'],
    ['1 litre chicken stock', 1000, 'ml', 'chicken stock'],
    ['1kg potatoes', 1, 'kg', 'potatoes'],
    ['2 heaped tbsp mayonnaise', 2, 'tbsp', 'mayonnaise'],
    ['3 garlic cloves, crushed', 3, '', 'garlic cloves, crushed'],
    ['1 large onion, sliced', 1, '', 'large onion, sliced'],
    ['2–4 spring onions, thinly sliced', 2, '', 'spring onions, thinly sliced'],
    ['1 x 400g tin chopped tomatoes', 1, '', '400g tin chopped tomatoes'],
    ['1 tbsp. extra-virgin olive oil', 1, 'tbsp', 'extra-virgin olive oil'],
    ['1 1/2 c. chicken broth', 360, 'ml', 'chicken broth'],
    ['1/2 c. heavy cream', 120, 'ml', 'heavy cream'],
    ['1/2 oz. Parmesan, grated', 14, 'g', 'Parmesan, grated'],
    ['1 lb chicken thighs', 454, 'g', 'chicken thighs'],
    ['4 (6- to 8-oz.) chicken breasts', 4, '', 'chicken breasts (6- to 8-oz.)'],
    ['2 tbsp of honey', 2, 'tbsp', 'honey'],
  ])('reads "%s"', (line, amount, unit, name) => {
    expect(parseIngredientLine(line)).toEqual({ amount, unit, name });
  });

  it.each(['salt and freshly ground black pepper', 'Kosher salt', 'a pinch of sugar'])(
    'keeps "%s" as a name with no amount',
    (line) => {
      expect(parseIngredientLine(line)).toEqual({ amount: null, unit: '', name: line });
    },
  );

  it('does not read words starting with a unit letter as units', () => {
    expect(parseIngredientLine('2 cloves garlic')).toEqual({
      amount: 2,
      unit: '',
      name: 'cloves garlic',
    });
    expect(parseIngredientLine('1 lemon')).toEqual({ amount: 1, unit: '', name: 'lemon' });
    expect(parseIngredientLine('2 tomatoes')).toEqual({ amount: 2, unit: '', name: 'tomatoes' });
  });
});
