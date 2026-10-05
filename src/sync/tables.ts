import { db } from '@/db/client';
import { recipes } from '@/db/schema';

import { drizzleSyncTable } from './drizzle-table';

/** Every table that syncs. Add new synced tables here and in supabase/migrations. */
export const SYNCED_TABLES = [
  drizzleSyncTable<typeof recipes.$inferSelect>(db, recipes, ['createdAt']),
];
