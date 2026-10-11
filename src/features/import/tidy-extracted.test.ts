import type { ExtractedRecipe } from '@/ai/tasks/extract-recipe';

import { tidyExtracted } from './tidy-extracted';

const BASE: ExtractedRecipe = {
  name: ' Soup ',
  shortName: '',
  minutes: 19.6,
  serves: 0,
  vegetarian: true,
  inferred: false,
  blurb: '',
  oven: null,
  ingredients: [],
  steps: [],
  note: '',
};

describe('tidyExtracted', () => {
  it('fills in and rounds what the model left loose', () => {
    expect(tidyExtracted(BASE)).toMatchObject({
      name: 'Soup',
      shortName: 'Soup',
      minutes: 20,
      serves: 4,
    });
  });

  it('keeps units the app scales and folds others into the name', () => {
    const { ingredients } = tidyExtracted({
      ...BASE,
      ingredients: [
        { amount: 2, unit: 'tbsp', name: 'oil' },
        { amount: 1, unit: 'handful', name: 'basil' },
        { amount: 0, unit: '', name: 'salt' },
        { amount: 1, unit: '', name: ' ' },
      ],
    });
    expect(ingredients).toEqual([
      { amount: 2, unit: 'tbsp', name: 'oil' },
      { amount: 1, unit: '', name: 'handful basil' },
      { amount: null, unit: '', name: 'salt' },
    ]);
  });

  it('drops timers that are too short or too long, and titles untitled steps', () => {
    const { steps } = tidyExtracted({
      ...BASE,
      steps: [
        { title: '', text: 'Stir.', timerSeconds: 5 },
        { title: 'Simmer', text: 'Simmer gently.', timerSeconds: 600 },
        { title: 'Prove', text: 'Leave overnight.', timerSeconds: 36_000 },
      ],
    });
    expect(steps).toEqual([
      { title: 'Step 1', text: 'Stir.' },
      { title: 'Simmer', text: 'Simmer gently.', timerSeconds: 600 },
      { title: 'Prove', text: 'Leave overnight.' },
    ]);
  });
});
