import type { Session } from '@supabase/supabase-js';
import { createContext, use, useEffect, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import { supabase } from '@/lib/supabase';

const SessionContext = createContext<Session | null>(null);

/** The signed-in Supabase session, or null when signed out or local-only. */
export function useSession(): Session | null {
  return use(SessionContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    if (!supabase) return;
    const client = supabase;

    client.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = client.auth.onAuthStateChange((_event, next) => setSession(next));

    // Only refresh tokens while the app is in the foreground.
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') client.auth.startAutoRefresh();
      else client.auth.stopAutoRefresh();
    });

    return () => {
      listener.subscription.unsubscribe();
      appState.remove();
    };
  }, []);

  return <SessionContext value={session}>{children}</SessionContext>;
}
