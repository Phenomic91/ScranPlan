import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import type { ReactNode } from 'react';

import { MessageScreen } from '@/ui/message-screen';

import { db } from './client';
import migrations from './migrations/migrations';

/** Runs pending on-device migrations before rendering the app. */
export function DatabaseGate({ children }: { children: ReactNode }) {
  const { success, error } = useMigrations(db, migrations);

  if (error) {
    return <MessageScreen title="Couldn't open your data" body={error.message} />;
  }
  if (!success) return null;
  return children;
}
