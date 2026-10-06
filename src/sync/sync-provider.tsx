import NetInfo from '@react-native-community/netinfo';
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AppState } from 'react-native';

import { db } from '@/db/client';
import { useSession } from '@/features/auth/auth-provider';
import { supabase } from '@/lib/supabase';

import { sqlitePullCursors } from './cursors';
import { syncTables } from './engine';
import { handleSyncRequests } from './request-sync';
import { supabaseSyncServer } from './supabase-server';
import { SYNCED_TABLES } from './tables';

export type SyncStatus =
  | { state: 'off' } // signed out, or no Supabase project configured
  | { state: 'syncing'; lastSyncedAt: Date | null }
  | { state: 'idle'; lastSyncedAt: Date | null }
  | { state: 'failed'; lastSyncedAt: Date | null; message: string };

type SyncContextValue = { status: SyncStatus; syncNow: () => Promise<void> };

const SYNC_OFF: SyncStatus = { state: 'off' };

const SyncContext = createContext<SyncContextValue>({
  status: SYNC_OFF,
  syncNow: async () => {},
});

export function useSync(): SyncContextValue {
  return use(SyncContext);
}

/**
 * Syncs while signed in: on start, when the app returns to the foreground,
 * when the network comes back, and shortly after local edits.
 */
export function SyncProvider({ children }: { children: ReactNode }) {
  const userId = useSession()?.user.id ?? null;
  const [status, setStatus] = useState<SyncStatus>({ state: 'idle', lastSyncedAt: null });
  const running = useRef<Promise<void> | null>(null);
  const runAgain = useRef(false);
  const lastSyncedAt = useRef<Date | null>(null);

  const syncNow = useCallback(async () => {
    if (!supabase || !userId) return;
    // One sync at a time. A request during a sync (say, an edit) gets one more pass after it.
    if (running.current) {
      runAgain.current = true;
      return running.current;
    }

    const context = {
      server: supabaseSyncServer(supabase),
      cursors: sqlitePullCursors(db),
      userId,
    };
    running.current = (async () => {
      setStatus({ state: 'syncing', lastSyncedAt: lastSyncedAt.current });
      try {
        do {
          runAgain.current = false;
          await syncTables(SYNCED_TABLES, context);
        } while (runAgain.current);
        lastSyncedAt.current = new Date();
        setStatus({ state: 'idle', lastSyncedAt: lastSyncedAt.current });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        setStatus({ state: 'failed', lastSyncedAt: lastSyncedAt.current, message });
      } finally {
        running.current = null;
      }
    })();
    return running.current;
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    syncNow();
    const stopRequests = handleSyncRequests(syncNow);
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') syncNow();
    });
    let wasOnline = true;
    const stopNetInfo = NetInfo.addEventListener(({ isConnected }) => {
      if (isConnected && !wasOnline) syncNow();
      wasOnline = isConnected !== false;
    });

    return () => {
      stopRequests();
      appState.remove();
      stopNetInfo();
    };
  }, [userId, syncNow]);

  const value = useMemo(
    () => ({ status: userId ? status : SYNC_OFF, syncNow }),
    [userId, status, syncNow],
  );
  return <SyncContext value={value}>{children}</SyncContext>;
}
