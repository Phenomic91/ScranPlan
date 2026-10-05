import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';

import { db } from '@/db/client';
import { supabase } from '@/lib/supabase';
import { clearPullCursors } from '@/sync/cursors';

function requireSupabase() {
  if (!supabase) throw new Error('Sign-in needs a Supabase project. See .env.example.');
  return supabase;
}

/** Emails the user a one-time sign-in code. */
export async function sendEmailCode(email: string): Promise<void> {
  const { error } = await requireSupabase().auth.signInWithOtp({ email });
  if (error) throw error;
}

export async function verifyEmailCode(email: string, code: string): Promise<void> {
  const { error } = await requireSupabase().auth.verifyOtp({ email, token: code, type: 'email' });
  if (error) throw error;
}

/** Native Sign in with Apple (iOS only). Resolves false if the user cancels. */
export async function signInWithApple(): Promise<boolean> {
  const client = requireSupabase();

  // Apple receives the hashed nonce; Supabase checks it against the raw one.
  const rawNonce = Crypto.randomUUID();
  const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);

  let credential: AppleAuthentication.AppleAuthenticationCredential;
  try {
    credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ERR_REQUEST_CANCELED') {
      return false;
    }
    throw error;
  }

  if (!credential.identityToken) throw new Error('Apple did not return an identity token.');

  const { error } = await client.auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken,
    nonce: rawNonce,
  });
  if (error) throw error;

  // Apple only shares the user's name on their first sign-in, so keep it.
  const { givenName, familyName } = credential.fullName ?? {};
  const fullName = [givenName, familyName].filter(Boolean).join(' ');
  if (fullName) await client.auth.updateUser({ data: { full_name: fullName } });

  return true;
}

/** Signs out. Recipes stay on the phone; the next sign-in pulls the account's data afresh. */
export async function signOut(): Promise<void> {
  const { error } = await requireSupabase().auth.signOut();
  if (error) throw error;
  await clearPullCursors(db);
}
