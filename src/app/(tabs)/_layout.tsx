import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { NextTimerStrip } from '@/features/timers/next-timer-strip';
import { useTimers } from '@/features/timers/timers-store';
import { useColors } from '@/ui/theme';

export default function TabsLayout() {
  const colors = useColors();
  const timerCount = useTimers().length;
  return (
    <NativeTabs tintColor={colors.accent}>
      {timerCount > 0 ? (
        <NativeTabs.BottomAccessory>
          <NextTimerStrip />
        </NativeTabs.BottomAccessory>
      ) : null}
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Recipes</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="fork.knife" md="restaurant" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="timers">
        <NativeTabs.Trigger.Label>Timers</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="timer" md="timer" />
        <NativeTabs.Trigger.Badge hidden={timerCount === 0}>
          {String(timerCount)}
        </NativeTabs.Trigger.Badge>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="gearshape" md="settings" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
