import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { formatClock } from '@/domain/timers/timer';
import { Button } from '@/ui/button';
import { Card } from '@/ui/card';
import { Text } from '@/ui/text';
import { TextField } from '@/ui/text-field';
import { radius, spacing, useColors } from '@/ui/theme';

import { startTimer } from './timers-store';

const PRESET_MINUTES = [1, 3, 5, 10, 15, 20];

export function NewTimerCard() {
  const colors = useColors();
  const [label, setLabel] = useState('');
  const [minutes, setMinutes] = useState('');
  const [seconds, setSeconds] = useState('');

  async function start(totalSeconds: number, defaultLabel: string) {
    const name = label.trim() || defaultLabel;
    setLabel('');
    setMinutes('');
    setSeconds('');
    await startTimer(name, totalSeconds);
  }

  function startCustom() {
    const total = toWholeNumber(minutes) * 60 + toWholeNumber(seconds);
    if (total <= 0) {
      Alert.alert('Enter minutes or seconds first.');
      return;
    }
    void start(total, `${formatClock(total * 1000)} timer`);
  }

  return (
    <Card>
      <View style={styles.presets}>
        {PRESET_MINUTES.map((preset) => (
          <Pressable
            key={preset}
            accessibilityRole="button"
            accessibilityLabel={`Start a ${preset} minute timer`}
            onPress={() => start(preset * 60, `${preset} min timer`)}
            style={({ pressed }) => [
              styles.preset,
              { backgroundColor: colors.surfaceMuted, borderColor: colors.border },
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.presetText}>{preset} min</Text>
          </Pressable>
        ))}
      </View>
      <TextField
        label="Label"
        placeholder="Optional, e.g. Pasta"
        value={label}
        onChangeText={setLabel}
        returnKeyType="done"
      />
      <View style={styles.custom}>
        <View style={styles.number}>
          <TextField
            label="Minutes"
            placeholder="0"
            keyboardType="number-pad"
            maxLength={3}
            value={minutes}
            onChangeText={setMinutes}
          />
        </View>
        <View style={styles.number}>
          <TextField
            label="Seconds"
            placeholder="0"
            keyboardType="number-pad"
            maxLength={2}
            value={seconds}
            onChangeText={setSeconds}
          />
        </View>
        <View style={styles.number}>
          <Button label="Start" onPress={startCustom} />
        </View>
      </View>
    </Card>
  );
}

function toWholeNumber(text: string): number {
  const value = Number.parseInt(text, 10);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

const styles = StyleSheet.create({
  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  preset: {
    minHeight: 44,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderRadius: radius.pill,
    justifyContent: 'center',
  },
  presetText: { fontWeight: '500', fontVariant: ['tabular-nums'] },
  pressed: { opacity: 0.7 },
  custom: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm },
  number: { flex: 1 },
});
