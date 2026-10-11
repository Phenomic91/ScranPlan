import { Linking } from 'react-native';

import { useAlarmsBlocked, useNow } from '@/features/timers/hooks';
import { NewTimerCard } from '@/features/timers/new-timer-card';
import { TimerCard } from '@/features/timers/timer-card';
import { useTimers } from '@/features/timers/timers-store';
import { Button } from '@/ui/button';
import { Card } from '@/ui/card';
import { Screen } from '@/ui/screen';
import { Text } from '@/ui/text';

export default function TimersScreen() {
  const timers = useTimers();
  const now = useNow(timers.length > 0);
  const alarmsBlocked = useAlarmsBlocked();

  return (
    <Screen title="Timers">
      <Text muted>Run as many as you need. They keep going on the lock screen.</Text>

      {alarmsBlocked ? (
        <Card>
          <Text>
            Alarms are off, so you won&apos;t hear a timer end. Turn on notifications for ScranPlan.
          </Text>
          <Button
            label="Open Settings"
            variant="secondary"
            onPress={() => Linking.openSettings()}
          />
        </Card>
      ) : null}

      <NewTimerCard />

      {timers.length === 0 ? (
        <Text muted>No timers yet. Pick a time above, or start one from a recipe step.</Text>
      ) : (
        timers.map((timer) => <TimerCard key={timer.id} timer={timer} now={now} />)
      )}

      <Text variant="caption" muted>
        Alarms follow your ringer, so check your iPhone isn&apos;t on silent.
      </Text>
    </Screen>
  );
}
