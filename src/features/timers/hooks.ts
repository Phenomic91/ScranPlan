import * as Notifications from 'expo-notifications';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

/** The current time, updated several times a second while `ticking`. */
export function useNow(ticking: boolean): number {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    if (!ticking) return;
    const tick = () => setNow(Date.now());
    // Catch up at once: `now` may be from long before the first timer started.
    const first = setTimeout(tick, 0);
    const interval = setInterval(tick, 250);
    return () => {
      clearTimeout(first);
      clearInterval(interval);
    };
  }, [ticking]);
  return now;
}

/**
 * True once the user has said no to notifications, so the Timers tab can say alarms are off.
 * Checked again whenever the app comes back from Settings.
 */
export function useAlarmsBlocked(): boolean {
  const [blocked, setBlocked] = useState(false);
  useEffect(() => {
    const check = () =>
      Notifications.getPermissionsAsync().then((permission) =>
        setBlocked(!permission.granted && !permission.canAskAgain),
      );
    check();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') check();
    });
    return () => subscription.remove();
  }, []);
  return blocked;
}
