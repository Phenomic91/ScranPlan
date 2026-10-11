import * as AppleAuthentication from 'expo-apple-authentication';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, StyleSheet, useColorScheme } from 'react-native';

import { sendSignInLink, signInWithApple } from '@/features/auth/sign-in';
import { supabase } from '@/lib/supabase';
import { Button } from '@/ui/button';
import { MessageScreen } from '@/ui/message-screen';
import { Screen } from '@/ui/screen';
import { Text } from '@/ui/text';
import { TextField } from '@/ui/text-field';
import { radius } from '@/ui/theme';

const appleSignInEnabled = Platform.OS === 'ios' && !!Constants.expoConfig?.ios?.usesAppleSignIn;

export default function SignInScreen() {
  const dark = useColorScheme() === 'dark';
  const [email, setEmail] = useState('');
  const [linkSent, setLinkSent] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!supabase) {
    return (
      <MessageScreen
        title="Sign-in isn't set up"
        body="This build has no Supabase project. See .env.example."
      />
    );
  }

  /** Runs a sign-in step, closing the screen once the user is signed in. */
  const attempt = async (signInStep: () => Promise<boolean>) => {
    setBusy(true);
    try {
      if (await signInStep()) router.back();
    } catch (error) {
      Alert.alert("Couldn't sign in", error instanceof Error ? error.message : undefined);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Text muted>Sign in to keep your recipes in sync across your devices.</Text>

      {appleSignInEnabled ? (
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
          buttonStyle={
            dark
              ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
              : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
          }
          cornerRadius={radius.md}
          style={styles.appleButton}
          onPress={() => attempt(signInWithApple)}
        />
      ) : null}

      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        editable={!linkSent}
      />
      {linkSent ? (
        <>
          <Text>Check your email and tap the sign-in link on this device.</Text>
          <Button
            label="Use a different email"
            variant="secondary"
            onPress={() => setLinkSent(false)}
          />
        </>
      ) : (
        <Button
          label="Email me a sign-in link"
          busy={busy}
          disabled={!email.includes('@')}
          onPress={() =>
            attempt(async () => {
              await sendSignInLink(email.trim());
              setLinkSent(true);
              return false;
            })
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  appleButton: { height: 48 },
});
