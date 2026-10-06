import type { ExpoConfig } from 'expo/config';
import { withEntitlementsPlist, type ConfigPlugin } from 'expo/config-plugins';

// Builds run locally (Xcode / Android Studio) from `npx expo prebuild`.
// No EAS or Expo account is used, so bump buildNumber/versionCode by hand per release.

const bundleIdentifier = 'com.scranplan.app';

// expo-notifications adds the push entitlement, which a free Apple account can't sign. Timer
// alarms are local notifications and don't need it. Remove this once there is a server push.
const withoutPushEntitlement: ConfigPlugin = (config) =>
  withEntitlementsPlist(config, (config) => {
    delete config.modResults['aps-environment'];
    return config;
  });

const config: ExpoConfig = {
  name: 'ScranPlan',
  slug: 'scranplan',
  version: '0.1.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'scranplan',
  userInterfaceStyle: 'automatic',
  ios: {
    bundleIdentifier,
    buildNumber: '1',
    icon: './assets/expo.icon',
    usesAppleSignIn: true,
  },
  android: {
    package: 'com.scranplan.app',
    versionCode: 1,
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  plugins: [
    'expo-router',
    'expo-sqlite',
    'expo-secure-store',
    'expo-apple-authentication',
    ['expo-notifications', { sounds: ['./assets/sounds/timer-done.wav'] }],
    // Lock-screen timer countdowns (Live Activities). The App Group lets the app and the
    // widget extension share data; free Apple accounts can sign it.
    [
      'expo-widgets',
      {
        bundleIdentifier: `${bundleIdentifier}.ExpoWidgetsTarget`,
        groupIdentifier: `group.${bundleIdentifier}`,
      },
    ],
    // Apps built with the iOS 27 SDK must use the scene lifecycle (default from SDK 58).
    ['expo-build-properties', { ios: { enableSceneSupport: true } }],
    [
      'expo-splash-screen',
      {
        backgroundColor: '#17694A',
        image: './assets/images/splash-icon.png',
        imageWidth: 76,
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
};

export default withoutPushEntitlement(config);
