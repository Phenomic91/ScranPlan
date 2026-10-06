import type { ExpoConfig } from 'expo/config';

// Builds run locally (Xcode / Android Studio) from `npx expo prebuild`.
// No EAS or Expo account is used, so bump buildNumber/versionCode by hand per release.
const config: ExpoConfig = {
  name: 'ScranPlan',
  slug: 'scranplan',
  version: '0.1.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'scranplan',
  userInterfaceStyle: 'automatic',
  ios: {
    bundleIdentifier: 'com.scranplan.app',
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

export default config;
