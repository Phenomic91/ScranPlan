import { StyleSheet, View } from 'react-native';

import { formatClock, isDone, progress, remainingMs, type Timer } from '@/domain/timers/timer';
import { Button } from '@/ui/button';
import { Card } from '@/ui/card';
import { Text } from '@/ui/text';
import { radius, spacing, useColors } from '@/ui/theme';

import { addTimerMinute, pauseTimer, removeTimer, resumeTimer } from './timers-store';

export function TimerCard({ timer, now }: { timer: Timer; now: number }) {
  const colors = useColors();
  const done = isDone(timer, now);
  const paused = timer.pausedAt !== null;
  const tone = done ? colors.danger : colors.accent;

  return (
    <Card style={done && { backgroundColor: colors.dangerSoft, borderColor: colors.danger }}>
      <View style={styles.header}>
        <Text style={styles.label}>{timer.label}</Text>
        <Text variant="caption" style={done ? { color: colors.danger } : null} muted={!done}>
          {done ? 'Done' : paused ? 'Paused' : 'Running'}
        </Text>
      </View>
      <Text style={[styles.clock, done && { color: colors.danger }]}>
        {formatClock(remainingMs(timer, now))}
      </Text>
      <View style={[styles.track, { backgroundColor: colors.surfaceMuted }]}>
        <View
          style={[styles.fill, { backgroundColor: tone, width: `${progress(timer, now) * 100}%` }]}
        />
      </View>
      <View style={styles.actions}>
        {done ? (
          <Action label="Dismiss" primary onPress={() => removeTimer(timer.id)} />
        ) : (
          <Action
            label={paused ? 'Resume' : 'Pause'}
            onPress={() => (paused ? resumeTimer(timer.id) : pauseTimer(timer.id))}
          />
        )}
        <Action label="+1 min" onPress={() => addTimerMinute(timer.id)} />
        {done ? null : <Action label="Remove" onPress={() => removeTimer(timer.id)} />}
      </View>
    </Card>
  );
}

function Action({
  label,
  onPress,
  primary,
}: {
  label: string;
  onPress: () => void;
  primary?: boolean;
}) {
  return (
    <View style={styles.action}>
      <Button label={label} variant={primary ? 'primary' : 'secondary'} onPress={onPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  label: { flex: 1, fontWeight: '600' },
  clock: {
    fontSize: 48,
    lineHeight: 52,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
    letterSpacing: -1,
  },
  track: { height: 6, borderRadius: radius.pill, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.pill },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  action: { flex: 1 },
});
