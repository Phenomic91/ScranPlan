import 'expo-sqlite/localStorage/install';

import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_KEY;

/**
 * The Supabase client, or null when the app is built without a Supabase project
 * (see .env.example). Without one the app still works, just local-only.
 */
export const supabase =
  url && publishableKey
    ? createClient(url, publishableKey, {
        auth: {
          storage: localStorage,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
          // Sign-in links carry a one-time code that only this device can redeem.
          flowType: 'pkce',
        },
      })
    : null;
