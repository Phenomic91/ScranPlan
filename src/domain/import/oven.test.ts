import { findOvenSetting } from './oven';

describe('findOvenSetting', () => {
  it.each([
    ['Heat the oven to 220C/200C fan/gas 7.', { celsius: 220, fanCelsius: 200, gasMark: '7' }],
    ['Preheat the oven to 210C/190C Fan/Gas 6½.', { celsius: 210, fanCelsius: 190, gasMark: '6½' }],
    [
      'Heat the oven to 200°C (180°C fan, gas 6) while you chop.',
      { celsius: 200, fanCelsius: 180, gasMark: '6' },
    ],
    ['Heat the oven to fan 180C.', { celsius: 200, fanCelsius: 180, gasMark: '6' }],
    ['Preheat the oven to 400°F.', { celsius: 200, fanCelsius: 180, gasMark: '6' }],
    ['Put in the oven at gas mark 4.', { celsius: 180, fanCelsius: 160, gasMark: '4' }],
  ])('reads "%s"', (text, expected) => {
    expect(findOvenSetting([text])).toEqual(expected);
  });

  it('ignores air fryer temperatures', () => {
    expect(findOvenSetting(['Preheat the air fryer to 200C/400F.'])).toBeNull();
  });

  it('ignores temperatures in sentences that are not about the oven', () => {
    expect(findOvenSetting(['Cook until it registers 75C in the middle.'])).toBeNull();
  });

  it('finds the oven in a later step', () => {
    expect(
      findOvenSetting(['Chop the veg.', 'Fry for 2 mins. Heat the oven to 190C/170C fan/gas 5.']),
    ).toEqual({ celsius: 190, fanCelsius: 170, gasMark: '5' });
  });
});
