import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useColorScheme } from 'react-native';

import { DatabaseGate } from '@/db/database-gate';
import { AuthProvider } from '@/features/auth/auth-provider';
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
        <AuthProvider>
          <SyncProvider>
            <Stack>
              {/* The title is the back button label on pushed screens; without it, "(tabs)" shows. */}
              <Stack.Screen name="(tabs)" options={{ headerShown: false, title: 'Recipes' }} />
              <Stack.Screen name="recipe/[id]" options={{ title: '' }} />
              <Stack.Screen
                name="recipe/new"
                options={{ title: 'New recipe', presentation: 'modal' }}
              />
              <Stack.Screen
                name="import"
                options={{ title: 'Import a recipe', presentation: 'modal' }}
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
