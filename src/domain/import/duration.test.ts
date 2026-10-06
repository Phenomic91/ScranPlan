import { parseIsoDuration } from './duration';

describe('parseIsoDuration', () => {
  it.each([
    ['PT25M', 25],
    ['PT1H30M', 90],
    ['P0DT0H20M', 20],
    ['PT90M', 90],
    ['PT45S', 1],
    ['PT0S', 0],
    ['P1D', 1440],
  ])('reads %s as %i minutes', (text, minutes) => {
    expect(parseIsoDuration(text)).toBe(minutes);
  });

  it.each(['', '25 mins', 'P', 'PT', undefined, 25])('returns null for %p', (value) => {
    expect(parseIsoDuration(value)).toBeNull();
  });
});
