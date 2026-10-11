import { readFileSync } from 'fs';
import { join } from 'path';

import { readJsonLdBlocks, readMetaContent } from './html';
import { recipeFromSchema, schemaRecipeAsText } from './recipe-from-schema';
import { findSchemaRecipe } from './schema-recipe';

function page(name: string): string {
  return readFileSync(join(__dirname, 'fixtures', `${name}.html`), 'utf8');
}

function schemaFrom(name: string) {
  const recipe = findSchemaRecipe(readJsonLdBlocks(page(name)));
  if (!recipe) throw new Error(`No recipe found in ${name}`);
  return recipe;
}

describe('BBC Good Food (single Recipe object, HowToSteps)', () => {
  const schema = schemaFrom('bbc-good-food');

  it('reads the recipe data', () => {
    expect(schema).toMatchObject({
      name: 'Lemon herb bean salad',
      author: 'Sam Example',
      publisher: 'Good Food',
      servings: '4',
      totalMinutes: 25,
    });
    expect(schema.ingredients).toHaveLength(6);
    expect(schema.steps).toHaveLength(2);
  });

  it('becomes a recipe without AI', () => {
    const recipe = recipeFromSchema(schema);
    expect(recipe).toMatchObject({
      serves: 4,
      minutes: 25,
      vegetarian: true,
      blurb: 'A bright, filling salad that keeps well in the fridge.',
      oven: { celsius: 200, fanCelsius: 180, gasMark: '6' },
    });
    expect(recipe.ingredients[2]).toEqual({
      amount: 400,
      unit: 'g',
      name: 'can cannellini beans drained',
    });
    expect(recipe.steps[0]?.title).toBe('Step 1');
  });

  it('finds the site name', () => {
    expect(readMetaContent(page('bbc-good-food'), 'og:site_name')).toBe('Good Food');
  });
});

describe('BBC Food (@graph, steps as strings, HTML in the description)', () => {
  const schema = schemaFrom('bbc-food');

  it('reads the recipe data', () => {
    expect(schema).toMatchObject({
      name: 'Quick chicken and pea risotto',
      author: 'Alex Example',
      servings: 'Serves 2',
      totalMinutes: 30,
    });
    expect(schema.description).not.toMatch(/<a|\r/);
    expect(schema.steps).toHaveLength(3);
  });

  it('becomes a recipe without AI', () => {
    const recipe = recipeFromSchema(schema);
    expect(recipe).toMatchObject({ serves: 2, minutes: 30, vegetarian: false, oven: null });
    expect(recipe.ingredients[2]).toEqual({
      amount: 250,
      unit: 'g',
      name: 'chicken thighs, diced',
    });
    expect(recipe.ingredients[4]).toEqual({ amount: 750, unit: 'ml', name: 'hot chicken stock' });
  });

  it('prefers the page name "BBC Food" over the publisher "BBC"', () => {
    expect(readMetaContent(page('bbc-food'), 'og:site_name')).toBe('BBC Food');
  });
});

describe('Delish (array of blocks, US units)', () => {
  const schema = schemaFrom('delish');

  it('reads the recipe data', () => {
    expect(schema).toMatchObject({
      name: 'Skillet Lemon Chicken',
      author: 'Jo Example',
      servings: '4 serving(s)',
      totalMinutes: 45,
    });
  });

  it('converts US units', () => {
    const recipe = recipeFromSchema(schema);
    expect(recipe.serves).toBe(4);
    expect(recipe.ingredients[3]).toEqual({ amount: 360, unit: 'ml', name: 'chicken broth' });
    expect(recipe.ingredients[5]).toEqual({
      amount: 14,
      unit: 'g',
      name: 'Parmesan, finely grated (about 1/4 cup)',
    });
  });
});

describe('Kitchen Sanctuary (Yoast @graph, WP Recipe Maker sections)', () => {
  const schema = schemaFrom('kitchen-sanctuary');

  it('resolves the author by @id and decodes entities', () => {
    expect(schema.author).toBe('Pat Example');
    expect(schema.description).toBe(
      'Sticky honey garlic chicken made in the air fryer & ready in 25 minutes. Perfect with rice.',
    );
  });

  it('flattens method sections into steps', () => {
    expect(schema.steps).toEqual([
      'Preheat the air fryer to 200C/400F.',
      'Toss the chicken in the cornflour, then air fry for 12 minutes, shaking halfway.',
      "Warm the honey, garlic & soy sauce in a pan for 2 minutes, then toss with the chicken and sprinkle with sesame seeds. Don't let it boil dry.",
    ]);
  });

  it('becomes a recipe without AI, and does not mistake the air fryer for an oven', () => {
    const recipe = recipeFromSchema(schema);
    expect(recipe).toMatchObject({ serves: 4, minutes: 25, oven: null });
  });

  it('lays the data out as text for AI', () => {
    const text = schemaRecipeAsText(schema);
    expect(text).toContain('Title: Air Fryer Honey Garlic Chicken');
    expect(text).toContain('- 3 tbsp honey');
    expect(text).toContain('2. Toss the chicken');
  });
});

describe('pages without recipe data', () => {
  it('returns null', () => {
    const html =
      '<html><head><script type="application/ld+json">{"@type":"WebPage","name":"Hi"}</script></head></html>';
    expect(findSchemaRecipe(readJsonLdBlocks(html))).toBeNull();
  });

  it('skips broken JSON-LD and still finds a good block', () => {
    const html = [
      '<script type="application/ld+json">{ not json</script>',
      '<script type="application/ld+json">{"@type":["Recipe"],"name":"Toast","recipeIngredient":["2 slices bread"]}</script>',
    ].join('');
    expect(findSchemaRecipe(readJsonLdBlocks(html))?.name).toBe('Toast');
  });
});
