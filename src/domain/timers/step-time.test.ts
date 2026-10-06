import { parseStepSeconds } from './step-time';

describe('parseStepSeconds', () => {
  it.each([
    ['Simmer for 10 minutes.', 600],
    ['Roast for 10–12 minutes until golden.', 600],
    ['Bake for 25-30 mins.', 1500],
    ['Cook for 3 to 4 minutes a side.', 180],
    ['Leave for 30 seconds.', 30],
    ['Rest for 1 hour.', 3600],
    ['Braise for 1½ hours.', 5400],
    ['Braise for 1.5 hours.', 5400],
    ['Slow cook for 2 hrs.', 7200],
    ['Roast for 1 hour 20 minutes.', 4800],
    ['Roast for 1 hr and 20 mins.', 4800],
    ['Leave for half an hour.', 1800],
    ['Simmer for an hour and a half.', 5400],
    ['Stir for a minute.', 60],
    ['Simmer for five minutes.', 300],
    ['Fry the garlic for 30 seconds, then simmer for 8 minutes.', 480],
  ] as const)('reads %p as %p seconds', (text, expected) => {
    expect(parseStepSeconds(text)).toBe(expected);
  });

  it.each([
    'Season to taste.',
    'Heat the oven to 200°C (180°C fan, gas 6).',
    'Add 2 mint leaves.',
    'Serve with 4 hot dogs.',
  ])('finds no time in %p', (text) => {
    expect(parseStepSeconds(text)).toBeNull();
  });
});
