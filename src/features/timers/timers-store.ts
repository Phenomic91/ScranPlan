import { and, asc, eq, isNotNull, isNull, min } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import * as Crypto from 'expo-crypto';
import { useEffect } from 'react';
import { AppState } from 'react-native';

import { db } from '@/db/client';
import { timers } from '@/db/schema';
import { addMinute, createTimer, isDone, pause, resume, type Timer } from '@/domain/timers/timer';

import {
  clearTimerAlerts,
  endCountdown,
  endOrphanedCountdowns,
  ensureAlarmPermission,
  setUpTimerAlarms,
  showTimerAlerts,
} from './alerts';

/*
 * The timer engine. Timers live in the on-device database; every change also moves the timer's
 * alarm and lock-screen countdown to match. Cook mode starts step timers with `startTimer`.
 */

type TimerRow = typeof timers.$inferSelect;

const allTimers = db.select().from(timers).orderBy(asc(timers.createdAt));

/** Every timer, oldest first, kept up to date as timers change. */
export function useTimers(): Timer[] {
  const { data } = useLiveQuery(allTimers);
  return data.map(toTimer);
}

/** Starts a timer and returns its id. `label` is shown on the lock screen and in the alarm. */
export async function startTimer(label: string, seconds: number): Promise<string> {
  await ensureAlarmPermission();
  const now = Date.now();
  const timer = createTimer(Crypto.randomUUID(), label, seconds, now);
  const ids = await showTimerAlerts(timer, { notificationId: null, activityId: null }, now);
  await db.insert(timers).values({ ...timer, ...ids, createdAt: now });
  return timer.id;
}

export function pauseTimer(id: string): Promise<void> {
  return changeTimer(id, pause);
}

export function resumeTimer(id: string): Promise<void> {
  return changeTimer(id, resume);
}

/** Adds a minute, or restarts a finished timer for one more minute. */
export function addTimerMinute(id: string): Promise<void> {
  return changeTimer(id, addMinute);
}

export async function removeTimer(id: string): Promise<void> {
  const row = await findRow(id);
  if (!row) return;
  await db.delete(timers).where(eq(timers.id, id));
  await clearTimerAlerts(row);
}

/**
 * Clears finished countdowns off the lock screen once the app is open to show them, and any
 * countdown whose timer is gone. Run when the app starts or comes back to the foreground.
 */
export async function tidyTimers(): Promise<void> {
  const now = Date.now();
  const rows = await db.select().from(timers);
  const finished = rows.filter((row) => row.activityId && isDone(toTimer(row), now));
  for (const row of finished) {
    await endCountdown(row.activityId);
    await db.update(timers).set({ activityId: null }).where(eq(timers.id, row.id));
  }
  const live = rows
    .filter((row) => !finished.includes(row))
    .flatMap((row) => (row.activityId ? [row.activityId] : []));
  await endOrphanedCountdowns(new Set(live));
}

/**
 * Keeps alarms and lock-screen countdowns tidy while the app runs. Render once, inside the
 * database gate.
 */
export function TimerHousekeeping(): null {
  useEffect(() => {
    setUpTimerAlarms();
    runTidy();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') runTidy();
    });
    return () => subscription.remove();
  }, []);

  // When a timer finishes with the app open, its countdown leaves the lock screen straight away.
  const { data } = useLiveQuery(nextCountdownEnd);
  const nextEnd = data[0]?.endsAt ?? null;
  useEffect(() => {
    if (nextEnd === null) return;
    const wait = setTimeout(runTidy, Math.max(0, nextEnd - Date.now()));
    return () => clearTimeout(wait);
  }, [nextEnd]);

  return null;
}

const nextCountdownEnd = db
  .select({ endsAt: min(timers.endsAt) })
  .from(timers)
  .where(and(isNull(timers.pausedAt), isNotNull(timers.activityId)));

function runTidy() {
  tidyTimers().catch((error: unknown) => console.warn("Couldn't tidy timers", error));
}

async function changeTimer(id: string, change: (timer: Timer, now: number) => Timer) {
  const row = await findRow(id);
  if (!row) return;
  const now = Date.now();
  const timer = change(toTimer(row), now);
  const ids = await showTimerAlerts(timer, row, now);
  await db
    .update(timers)
    .set({ ...timer, ...ids })
    .where(eq(timers.id, id));
}

async function findRow(id: string): Promise<TimerRow | undefined> {
  const [row] = await db.select().from(timers).where(eq(timers.id, id));
  return row;
}

function toTimer(row: TimerRow): Timer {
  const { id, label, durationMs, endsAt, pausedAt } = row;
  return { id, label, durationMs, endsAt, pausedAt };
}
