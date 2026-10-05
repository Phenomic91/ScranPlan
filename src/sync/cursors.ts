import { eq } from 'drizzle-orm';

import type { Database } from '@/db/client';
import { syncState } from '@/db/schema';

import type { PullCursors } from './types';

export function sqlitePullCursors(db: Database): PullCursors {
  return {
    async get(table) {
      const [row] = await db.select().from(syncState).where(eq(syncState.tableName, table));
      return row?.lastPulledAt ?? null;
    },

    async set(table, lastPulledAt) {
      await db
        .insert(syncState)
        .values({ tableName: table, lastPulledAt })
        .onConflictDoUpdate({ target: syncState.tableName, set: { lastPulledAt } });
    },
  };
}

/** Forgets how far each table has pulled, so the next sign-in fetches everything. */
export async function clearPullCursors(db: Database): Promise<void> {
  await db.delete(syncState);
}
