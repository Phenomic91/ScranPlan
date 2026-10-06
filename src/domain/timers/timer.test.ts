import {
  addMinute,
  createTimer,
  formatClock,
  formatDuration,
  isDone,
  nextTimer,
  pause,
  progress,
  remainingMs,
  resume,
} from './timer';

const START = 1_000_000;
const pasta = createTimer('pasta', 'Pasta', 600, START);

describe('timer', () => {
  it('counts down from its end time', () => {
    expect(remainingMs(pasta, START + 60_000)).toBe(540_000);
    expect(progress(pasta, START + 300_000)).toBe(0.5);
    expect(isDone(pasta, START + 599_999)).toBe(false);
    expect(isDone(pasta, START + 600_000)).toBe(true);
    expect(remainingMs(pasta, START + 700_000)).toBe(0);
  });

  it('holds its time while paused and carries on when resumed', () => {
    const paused = pause(pasta, START + 60_000);
    expect(remainingMs(paused, START + 900_000)).toBe(540_000);
    expect(isDone(paused, START + 900_000)).toBe(false);

    const resumed = resume(paused, START + 900_000);
    expect(resumed.pausedAt).toBeNull();
    expect(remainingMs(resumed, START + 900_000)).toBe(540_000);
  });

  it('does not pause a finished timer', () => {
    const done = START + 600_000;
    expect(pause(pasta, done)).toBe(pasta);
  });

  it('adds a minute to a running or paused timer', () => {
    expect(remainingMs(addMinute(pasta, START), START)).toBe(660_000);
    const paused = pause(pasta, START);
    expect(remainingMs(addMinute(paused, START + 5_000), START + 5_000)).toBe(660_000);
    expect(addMinute(pasta, START).durationMs).toBe(660_000);
  });

  it('restarts a finished timer with one minute to go', () => {
    const later = START + 700_000;
    const again = addMinute(pasta, later);
    expect(remainingMs(again, later)).toBe(60_000);
    expect(progress(again, later)).toBe(0);
  });
});

describe('nextTimer', () => {
  const rice = createTimer('rice', 'Rice', 300, START);
  const sauce = pause(createTimer('sauce', 'Sauce', 120, START), START);

  it('shows a finished timer first', () => {
    expect(nextTimer([pasta, rice, sauce], START + 400_000)?.id).toBe('rice');
  });

  it('otherwise shows the one due soonest, ignoring paused ones', () => {
    expect(nextTimer([pasta, sauce, rice], START)?.id).toBe('rice');
  });

  it('falls back to a paused timer', () => {
    expect(nextTimer([sauce], START)?.id).toBe('sauce');
    expect(nextTimer([], START)).toBeUndefined();
  });
});

describe('formatClock', () => {
  it.each([
    [0, '00:00'],
    [1, '00:01'],
    [59_001, '01:00'],
    [600_000, '10:00'],
    [3_723_000, '1:02:03'],
  ])('formats %p ms as %p', (ms, expected) => {
    expect(formatClock(ms)).toBe(expected);
  });
});

describe('formatDuration', () => {
  it.each([
    [45, '45 sec'],
    [90, '2 min'],
    [720, '12 min'],
    [3600, '1 hr'],
    [5400, '1 hr 30 min'],
  ])('formats %p seconds as %p', (seconds, expected) => {
    expect(formatDuration(seconds)).toBe(expected);
  });
});
