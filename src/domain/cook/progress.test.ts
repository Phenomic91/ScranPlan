import { clearTicks, firstUndoneStep, NEW_PROGRESS, parseProgress, toggleIndex } from './progress';

const sizes = { ingredients: 4, steps: 3 };

describe('toggleIndex', () => {
  it('adds and removes an index', () => {
    expect(toggleIndex([1], 2)).toEqual([1, 2]);
    expect(toggleIndex([1, 2], 1)).toEqual([2]);
  });
});

describe('clearTicks', () => {
  it('goes back to the first step but keeps the servings', () => {
    const progress = { serves: 4, step: 2, tickedIngredients: [0], doneSteps: [0, 1] };
    expect(clearTicks(progress)).toEqual({ ...NEW_PROGRESS, serves: 4 });
  });
});

describe('firstUndoneStep', () => {
  it('finds the first step not done', () => {
    expect(firstUndoneStep([0, 2], 4)).toBe(1);
  });

  it('stays on the last step when every step is done', () => {
    expect(firstUndoneStep([0, 1, 2], 3)).toBe(2);
  });
});

describe('parseProgress', () => {
  it('starts fresh when nothing is saved or the data is broken', () => {
    expect(parseProgress(null, sizes)).toEqual(NEW_PROGRESS);
    expect(parseProgress('not json', sizes)).toEqual(NEW_PROGRESS);
  });

  it('reads saved progress', () => {
    const saved = { serves: 3, step: 1, tickedIngredients: [0, 3], doneSteps: [0] };
    expect(parseProgress(JSON.stringify(saved), sizes)).toEqual(saved);
  });

  it('drops ticks and steps the recipe no longer has', () => {
    const saved = JSON.stringify({
      serves: 0,
      step: 7,
      tickedIngredients: [1, 9, 'x'],
      doneSteps: [5],
    });
    expect(parseProgress(saved, sizes)).toEqual({
      serves: null,
      step: 2,
      tickedIngredients: [1],
      doneSteps: [],
    });
  });
});
