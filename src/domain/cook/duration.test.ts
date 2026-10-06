import { formatStepDuration } from './duration';

it.each([
  [30, '30 sec'],
  [89, '89 sec'],
  [90, '2 min'],
  [360, '6 min'],
  [780, '13 min'],
])('formats %p seconds as %p', (seconds, expected) => {
  expect(formatStepDuration(seconds)).toBe(expected);
});
