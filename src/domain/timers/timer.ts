/**
 * A kitchen timer, stored as the moment it ends rather than as a ticking count, so it stays
 * right while the app is closed. Times are milliseconds since the epoch.
 */
export type Timer = {
  id: string;
  label: string;
  /** The full length, including any added minutes; used for the progress bar. */
  durationMs: number;
  endsAt: number;
  /** Set while paused. */
  pausedAt: number | null;
};

const MINUTE_MS = 60_000;

export function createTimer(id: string, label: string, seconds: number, now: number): Timer {
  const durationMs = seconds * 1000;
  return { id, label, durationMs, endsAt: now + durationMs, pausedAt: null };
}

/** Never more than the full length, so a slightly stale `now` can't show extra time. */
export function remainingMs(timer: Timer, now: number): number {
  return Math.min(timer.durationMs, Math.max(0, timer.endsAt - (timer.pausedAt ?? now)));
}

export function isDone(timer: Timer, now: number): boolean {
  return timer.pausedAt === null && timer.endsAt <= now;
}

/** How far through the timer is, from 0 to 1. */
export function progress(timer: Timer, now: number): number {
  if (timer.durationMs <= 0) return 1;
  return Math.min(1, Math.max(0, 1 - remainingMs(timer, now) / timer.durationMs));
}

export function pause(timer: Timer, now: number): Timer {
  if (timer.pausedAt !== null || isDone(timer, now)) return timer;
  return { ...timer, pausedAt: now };
}

export function resume(timer: Timer, now: number): Timer {
  if (timer.pausedAt === null) return timer;
  return { ...timer, endsAt: timer.endsAt + (now - timer.pausedAt), pausedAt: null };
}

/** Adds a minute. A finished timer starts again with one minute to go. */
export function addMinute(timer: Timer, now: number): Timer {
  if (isDone(timer, now)) {
    return { ...timer, durationMs: MINUTE_MS, endsAt: now + MINUTE_MS };
  }
  return { ...timer, durationMs: timer.durationMs + MINUTE_MS, endsAt: timer.endsAt + MINUTE_MS };
}

/**
 * The timer to show in a one-line strip: a finished one first, then the one due soonest,
 * then a paused one.
 */
export function nextTimer(timers: readonly Timer[], now: number): Timer | undefined {
  const done = timers.find((timer) => isDone(timer, now));
  if (done) return done;
  const running = timers
    .filter((timer) => timer.pausedAt === null)
    .sort((a, b) => a.endsAt - b.endsAt);
  return running[0] ?? timers[0];
}

/** "04:59", or "1:04:59" for an hour or more. Rounds up, so it never shows 00:00 early. */
export function formatClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
}

/** "45 sec", "12 min", "1 hr 30 min": for buttons such as "Start 12 min timer". */
export function formatDuration(seconds: number): string {
  if (seconds < 90) return `${seconds} sec`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} hr ${rest} min` : `${hours} hr`;
}
