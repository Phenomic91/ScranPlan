import { router } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { formatClock, isDone, nextTimer, remainingMs } from '@/domain/timers/timer';
import { Text } from '@/ui/text';
import { spacing, useColors } from '@/ui/theme';

import { useNow } from './hooks';
import { useTimers } from './timers-store';

/** One line showing the timer due next (or one that has finished). Opens the Timers tab. */
export function NextTimerStrip() {
  const colors = useColors();
  const timers = useTimers();
  const now = useNow(timers.length > 0);
  const timer = nextTimer(timers, now);
  if (!timer) return null;

  const done = isDone(timer, now);
  const others = timers.length - 1;
  const tone = done ? { color: colors.danger } : null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint="Opens your timers"
      onPress={() => router.navigate('/timers')}
      style={styles.strip}
    >
      <Text numberOfLines={1} style={[styles.label, tone]}>
        {timer.label}
      </Text>
      <Text style={[styles.clock, tone]}>
        {done ? 'Done' : formatClock(remainingMs(timer, now))}
      </Text>
      {others > 0 ? (
        <Text variant="caption" muted>
          +{others}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  strip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  label: { flex: 1, fontWeight: '600' },
  clock: { fontSize: 18, fontWeight: '500', fontVariant: ['tabular-nums'] },
});
