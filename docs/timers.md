# Timers

Kitchen timers that keep running with the app closed, show a countdown on the lock screen and
in the Dynamic Island, and sound an alarm when they end.

## Using timers from other screens

Everything goes through `src/features/timers/timers-store.ts`:

| Call                                 | What it does                                                                        |
| ------------------------------------ | ----------------------------------------------------------------------------------- |
| `startTimer(label, seconds)`         | Starts a timer and returns its id. Asks for notification permission the first time. |
| `pauseTimer(id)` / `resumeTimer(id)` | Pause and carry on.                                                                 |
| `addTimerMinute(id)`                 | Adds a minute; a finished timer starts again with one minute to go.                 |
| `removeTimer(id)`                    | Stops and removes it, with its alarm and countdown.                                 |
| `useTimers()`                        | Every timer, oldest first, live.                                                    |

`NextTimerStrip` (`src/features/timers/next-timer-strip.tsx`) is the one-line "next timer due"
strip; the tabs show it above the tab bar, and cook mode can show it too.

Label step timers `<recipe short name> · <step title>`, for example `Pasta · Simmer the sauce`.
`parseStepSeconds` in `src/domain/timers/step-time.ts` reads a time from step text when a step
has no `timerSeconds`.

## How it works

- A timer is stored as the time it ends (`src/domain/timers/timer.ts`), in the device-only
  `timers` table. It is not synced: a timer belongs to the phone it rings on.
- Each running timer has one scheduled local notification (`expo-notifications`) with the alarm
  sound in `assets/sounds/timer-done.wav`. Pause, resume and +1 min reschedule it.
- Each timer has one Live Activity (`expo-widgets`, layout in `timer-activity.tsx`). iOS draws
  the countdown itself, stopping at 0:00. The activity's `staleDate` is the end time, which is
  how it shows "Done" without the app; iOS picks when to redraw, so that can lag the alarm by
  up to a minute. A paused timer shows fixed text, because iOS ignores the pause time on a live
  countdown.
- When the app opens or comes to the front, finished countdowns leave the lock screen and any
  countdown without a timer is ended (`tidyTimers`).

## Free Apple account

Everything here signs with a free personal team: local notifications need no entitlement,
Live Activities need none, and App Groups (used by the widget extension) are allowed. Two
things wait for the paid Apple Developer Program:

- **Time Sensitive alerts**, which break through Focus. The alarm asks for them, but without
  the entitlement iOS delivers it as a normal notification.
- **Ringing through silent mode** needs AlarmKit, which is planned for later.

`app.config.ts` removes the push entitlement that `expo-notifications` adds, because a free
account can't sign it and timers don't use push.
