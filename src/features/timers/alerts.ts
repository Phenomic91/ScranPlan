import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { isDone, type Timer } from '@/domain/timers/timer';

import { timerActivity, type TimerActivityProps } from './timer-activity';

/** The native things that announce one timer, saved with it so they can be changed later. */
export type AlertIds = { notificationId: string | null; activityId: string | null };

// Live Activities are iOS only. Android would show an ongoing notification instead (on hold).
const liveActivities = Platform.OS === 'ios';

const ALARM_SOUND = 'timer-done.wav';

/** Show and sound timer alarms even while the app is open. */
export function setUpTimerAlarms(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

/** Asks once, the first time a timer starts. */
export async function ensureAlarmPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted || !current.canAskAgain) return current.granted;
  const asked = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowSound: true },
  });
  return asked.granted;
}

/**
 * Brings a timer's alarm and lock-screen countdown in line with the timer: the alarm is
 * rescheduled for the current end time (or cancelled while paused), and the countdown is
 * updated, or started if it has gone.
 */
export async function showTimerAlerts(timer: Timer, ids: AlertIds, now: number): Promise<AlertIds> {
  await withdrawAlarm(ids.notificationId);
  const running = timer.pausedAt === null && !isDone(timer, now);
  const notificationId = running ? await scheduleAlarm(timer) : null;
  const activityId = await showCountdown(timer, ids.activityId);
  return { notificationId, activityId };
}

export async function clearTimerAlerts(ids: AlertIds): Promise<void> {
  await withdrawAlarm(ids.notificationId);
  await endCountdown(ids.activityId);
}

export async function endCountdown(activityId: string | null): Promise<void> {
  if (!liveActivities || !activityId) return;
  const activity = findActivity(activityId);
  await activity?.end('immediate');
}

/** Ends countdowns left on the lock screen that no longer belong to a timer. */
export async function endOrphanedCountdowns(keep: ReadonlySet<string>): Promise<void> {
  if (!liveActivities) return;
  const leftovers = timerActivity.getInstances().filter((activity) => !keep.has(activity.getId()));
  await Promise.all(leftovers.map((activity) => activity.end('immediate')));
}

async function scheduleAlarm(timer: Timer): Promise<string> {
  return Notifications.scheduleNotificationAsync({
    content: {
      title: timer.label,
      body: "Time's up.",
      sound: ALARM_SOUND,
      // Breaks through Focus. Needs an entitlement that only the paid Apple Developer
      // Program can sign; without it iOS delivers the alarm as a normal notification.
      interruptionLevel: 'timeSensitive',
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: timer.endsAt },
  });
}

/** Cancels the alarm if it's still to come, or clears it off the lock screen if it has gone off. */
async function withdrawAlarm(notificationId: string | null): Promise<void> {
  if (!notificationId) return;
  await Notifications.cancelScheduledNotificationAsync(notificationId);
  await Notifications.dismissNotificationAsync(notificationId);
}

async function showCountdown(timer: Timer, activityId: string | null): Promise<string | null> {
  if (!liveActivities) return null;
  const props: TimerActivityProps = {
    label: timer.label,
    startedAt: timer.endsAt - timer.durationMs,
    endsAt: timer.endsAt,
    pausedAt: timer.pausedAt,
  };
  // Past this date the activity shows "Done" by itself, even with the app closed.
  const staleDate = timer.pausedAt === null ? new Date(timer.endsAt) : undefined;

  const existing = activityId ? findActivity(activityId) : undefined;
  if (existing) {
    await existing.update(props, staleDate);
    return activityId;
  }
  try {
    return timerActivity.start(props, 'scranplan://timers', staleDate).getId();
  } catch {
    // Live Activities are switched off in Settings, or the phone is too old for them.
    return null;
  }
}

function findActivity(activityId: string) {
  return timerActivity.getInstances().find((activity) => activity.getId() === activityId);
}
