import { convertOven, formatOvenSetting } from './oven';

describe('convertOven', () => {
  it('converts conventional °C to fan, °F and gas', () => {
    expect(convertOven(200, 'celsius')).toEqual([
      { value: '180', label: '°C fan' },
      { value: '≈ 400', label: '°F' },
      { value: '6', label: 'Gas mark' },
    ]);
  });

  it('adds 20°C to a fan temperature for conventional ovens', () => {
    expect(convertOven(180, 'fan')[0]).toEqual({ value: '200', label: '°C conventional' });
  });

  it('uses the chart for gas marks, including fractions', () => {
    expect(convertOven(0.5, 'gas')).toEqual([
      { value: '130', label: '°C conventional' },
      { value: '110', label: '°C fan' },
      { value: '≈ 250', label: '°F' },
    ]);
  });

  it('finds the nearest gas mark for °F', () => {
    expect(convertOven(350, 'fahrenheit')).toEqual([
      { value: '177', label: '°C conventional' },
      { value: '157', label: '°C fan' },
      { value: '4', label: 'Gas mark' },
    ]);
  });

  it('says when a temperature is off the gas scale', () => {
    expect(convertOven(80, 'celsius')).toContainEqual({
      value: 'Off the scale',
      label: 'Gas mark',
    });
  });
});

describe('formatOvenSetting', () => {
  it('prints conventional, fan and gas', () => {
    expect(formatOvenSetting({ celsius: 200, fanCelsius: 180, gasMark: '6' })).toBe(
      '200°C · 180°C fan · gas 6',
    );
  });

  it('leaves gas out when there is none', () => {
    expect(formatOvenSetting({ celsius: 200, fanCelsius: 180, gasMark: '' })).toBe(
      '200°C · 180°C fan',
    );
  });
});
