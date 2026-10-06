import { ingredient, step, type Recipe } from '../recipes/recipe';
import { ingredientsForStep } from './step-ingredients';

const recipe: Recipe = {
  id: 'test',
  name: 'Chickpea curry',
  shortName: 'Curry',
  minutes: 20,
  serves: 2,
  vegetarian: true,
  blurb: '',
  oven: null,
  ingredients: [
    ingredient(1, 'tbsp', 'vegetable oil'),
    ingredient(1, 'tsp', 'sesame oil'),
    ingredient(2, '', 'garlic cloves, crushed'),
    ingredient(1, '', 'tin chopped tomatoes (400 g)'),
    ingredient(2, 'tbsp', 'medium curry paste'),
    ingredient(3, '', 'eggs, beaten'),
  ],
  steps: [
    step('Fry', 'Heat the vegetable oil and add the garlic.'),
    step('Simmer', 'Add the tomatoes and the paste.'),
    step('Finish', 'Stir in the eggs, drizzle with oil and serve the curry.'),
  ],
  note: '',
};

const names = (stepIndex: number) =>
  ingredientsForStep(recipe, stepIndex).map((index) => recipe.ingredients[index]!.name);

describe('ingredientsForStep', () => {
  it('matches the full name and words only one ingredient uses', () => {
    expect(names(0)).toEqual(['vegetable oil', 'garlic cloves, crushed']);
  });

  it('matches plurals and ignores tin sizes and descriptions', () => {
    expect(names(1)).toEqual(['tin chopped tomatoes (400 g)', 'medium curry paste']);
  });

  it('ignores words two ingredients share, and dish names', () => {
    expect(names(2)).toEqual(['eggs, beaten']);
  });

  it('returns nothing for a step that does not exist', () => {
    expect(ingredientsForStep(recipe, 9)).toEqual([]);
  });
});
