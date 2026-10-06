import { HStack, Image, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import {
  activityBackgroundTint,
  font,
  foregroundStyle,
  frame,
  lineLimit,
  monospacedDigit,
  multilineTextAlignment,
  padding,
} from '@expo/ui/swift-ui/modifiers';
import { createLiveActivity, type LiveActivityEnvironment } from 'expo-widgets';

/** Times are milliseconds since the epoch, because props travel to the widget as JSON. */
export type TimerActivityProps = {
  label: string;
  /** The end time less the full length. iOS's countdown needs a start as well as an end. */
  startedAt: number;
  endsAt: number;
  pausedAt: number | null;
};

/**
 * The lock-screen and Dynamic Island countdown for one timer. iOS draws the countdown itself,
 * so it keeps ticking with the app closed. The activity is started with `staleDate` set to the
 * end time, which is how it knows to show "Done" without the app.
 *
 * This runs in the widget extension's own runtime: everything it uses must be inside the
 * function (see the 'widget' directive in the expo-widgets docs). The colours are fixed rather
 * than following light and dark mode, because the lock screen and Dynamic Island are dark and
 * `environment.colorScheme` always reads light in the simulator.
 */
const TimerActivity = (props: TimerActivityProps, environment: LiveActivityEnvironment) => {
  'widget';
  const text = '#E8F0EB';
  const muted = '#96A99E';
  const accent = '#5BD6A0';
  const alarm = '#F2B84B';
  const paused = props.pausedAt !== null;
  const done = !paused && environment.isStale === true;

  // iOS ignores the pause time on a live countdown, so a paused timer shows fixed text instead.
  const pausedClock = () => {
    const total = Math.max(0, Math.ceil((props.endsAt - (props.pausedAt ?? 0)) / 1000));
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = String(total % 60).padStart(2, '0');
    return hours > 0
      ? `${hours}:${String(minutes).padStart(2, '0')}:${seconds}`
      : `${minutes}:${seconds}`;
  };

  const clock = (size: number, width?: number) => {
    const style = [
      font({ size, weight: 'semibold', design: 'rounded' }),
      monospacedDigit(),
      multilineTextAlignment('trailing'),
      // A countdown Text otherwise takes all the width it can get.
      ...(width ? [frame({ width })] : []),
    ];
    if (done) return <Text modifiers={[...style, foregroundStyle(alarm)]}>Done</Text>;
    if (paused) return <Text modifiers={[...style, foregroundStyle(muted)]}>{pausedClock()}</Text>;
    return (
      <Text
        timerInterval={{ lower: new Date(props.startedAt), upper: new Date(props.endsAt) }}
        countsDown
        modifiers={[...style, foregroundStyle(accent)]}
      />
    );
  };

  const caption = [font({ textStyle: 'subheadline' }), foregroundStyle(muted)];
  const status = done ? (
    <Text modifiers={[font({ textStyle: 'subheadline' }), foregroundStyle(alarm)]}>
      {"Time's up"}
    </Text>
  ) : paused ? (
    <Text modifiers={caption}>Paused</Text>
  ) : (
    <HStack spacing={4}>
      <Text modifiers={caption}>Ends at</Text>
      <Text date={new Date(props.endsAt)} dateStyle="time" modifiers={caption} />
    </HStack>
  );

  const label = (
    <Text modifiers={[font({ textStyle: 'headline' }), foregroundStyle(text), lineLimit(1)]}>
      {props.label}
    </Text>
  );

  const icon = <Image systemName={done ? 'bell.fill' : 'timer'} color={done ? alarm : accent} />;

  return {
    banner: (
      <HStack modifiers={[padding({ all: 16 }), activityBackgroundTint('#16201B')]}>
        <VStack alignment="leading" spacing={2}>
          {label}
          {status}
        </VStack>
        <Spacer />
        {clock(40)}
      </HStack>
    ),
    compactLeading: icon,
    compactTrailing: clock(15, 56),
    minimal: icon,
    expandedLeading: (
      <VStack alignment="leading" spacing={2} modifiers={[padding({ leading: 8 })]}>
        {label}
        {status}
      </VStack>
    ),
    expandedTrailing: <VStack modifiers={[padding({ trailing: 8 })]}>{clock(32, 120)}</VStack>,
  };
};

export const timerActivity = createLiveActivity('TimerActivity', TimerActivity);
