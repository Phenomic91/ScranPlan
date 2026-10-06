import { HStack, Image, ProgressView, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import {
  font,
  foregroundStyle,
  frame,
  lineLimit,
  monospacedDigit,
  multilineTextAlignment,
  padding,
  tint,
} from '@expo/ui/swift-ui/modifiers';
import { createLiveActivity, type LiveActivityEnvironment } from 'expo-widgets';

/** Times are milliseconds since the epoch, because props travel to the widget as JSON. */
export type TimerActivityProps = {
  label: string;
  /** The end time less the full length, so the progress bar allows for added minutes. */
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
 * function (see the 'widget' directive in the expo-widgets docs).
 */
const TimerActivity = (props: TimerActivityProps, environment: LiveActivityEnvironment) => {
  'widget';
  const dark = environment.colorScheme === 'dark';
  const accent = dark ? '#5BD6A0' : '#17694A';
  const alarm = dark ? '#F2B84B' : '#9A4A06';
  const paused = props.pausedAt !== null;
  const done = !paused && environment.isStale === true;

  const interval = { lower: new Date(props.startedAt), upper: new Date(props.endsAt) };
  const pauseTime = props.pausedAt === null ? undefined : new Date(props.pausedAt);

  const clock = (size: number, width?: number) =>
    done ? (
      <Text modifiers={[font({ size, weight: 'semibold' }), foregroundStyle(alarm)]}>Done</Text>
    ) : (
      <Text
        timerInterval={interval}
        pauseTime={pauseTime}
        countsDown
        modifiers={[
          font({ size, weight: 'semibold', design: 'rounded' }),
          monospacedDigit(),
          foregroundStyle(accent),
          multilineTextAlignment('trailing'),
          // A timer Text otherwise takes all the width it can get.
          ...(width ? [frame({ width })] : []),
        ]}
      />
    );

  const status = done ? (
    <Text modifiers={[font({ textStyle: 'subheadline' }), foregroundStyle(alarm)]}>
      {"Time's up"}
    </Text>
  ) : paused ? (
    <Text modifiers={[font({ textStyle: 'subheadline' })]}>Paused</Text>
  ) : (
    <HStack spacing={4}>
      <Text modifiers={[font({ textStyle: 'subheadline' })]}>Ends at</Text>
      <Text
        date={new Date(props.endsAt)}
        dateStyle="time"
        modifiers={[font({ textStyle: 'subheadline' })]}
      />
    </HStack>
  );

  const label = (
    <Text modifiers={[font({ textStyle: 'headline' }), lineLimit(1)]}>{props.label}</Text>
  );

  const bar =
    done || paused ? null : <ProgressView timerInterval={interval} modifiers={[tint(accent)]} />;

  const icon = <Image systemName={done ? 'bell.fill' : 'timer'} color={done ? alarm : accent} />;

  return {
    banner: (
      <VStack spacing={8} modifiers={[padding({ all: 16 })]}>
        <HStack>
          <VStack alignment="leading" spacing={2}>
            {label}
            {status}
          </VStack>
          <Spacer />
          {clock(40)}
        </HStack>
        {bar}
      </VStack>
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
    expandedBottom: bar ? <VStack modifiers={[padding({ horizontal: 8 })]}>{bar}</VStack> : null,
  };
};

export const timerActivity = createLiveActivity('TimerActivity', TimerActivity);
