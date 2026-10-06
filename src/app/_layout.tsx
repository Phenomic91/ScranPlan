import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useColorScheme } from 'react-native';

import { DatabaseGate } from '@/db/database-gate';
import { AuthProvider } from '@/features/auth/auth-provider';
import { TimerHousekeeping } from '@/features/timers/timers-store';
import { SyncProvider } from '@/sync/sync-provider';
import { useColors } from '@/ui/theme';

export default function RootLayout() {
  const colors = useColors();
  const base = useColorScheme() === 'dark' ? DarkTheme : DefaultTheme;
  const theme = {
    ...base,
    colors: { ...base.colors, primary: colors.accent, background: colors.background },
  };

  return (
    <ThemeProvider value={theme}>
      <DatabaseGate>
        <TimerHousekeeping />
        <AuthProvider>
          <SyncProvider>
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="recipe/[id]" options={{ title: '' }} />
              <Stack.Screen
                name="recipe/new"
                options={{ title: 'New recipe', presentation: 'modal' }}
              />
              <Stack.Screen name="sign-in" options={{ title: 'Sign in', presentation: 'modal' }} />
              <Stack.Screen name="auth-callback" options={{ title: 'Signing in' }} />
            </Stack>
          </SyncProvider>
        </AuthProvider>
      </DatabaseGate>
    </ThemeProvider>
  );
}
