import type { AiRoute } from '../task';

/**
 * Apple's on-device model (iOS 26+, Apple Intelligence phones). Free, private
 * and offline, but small: only tasks marked `fitsOnDevice` are sent here.
 *
 * Not wired up yet. The plan is @react-native-ai/apple, which needs a check
 * that it builds with React Native 0.86 on a Mac first. Android's Gemini Nano
 * comes later. Until then the router moves straight on to Claude.
 */
export const onDeviceRoute: AiRoute = {
  id: 'on-device',
  isAvailable: async () => false,
  complete: async () => {
    throw new Error('On-device AI is not available yet.');
  },
};
