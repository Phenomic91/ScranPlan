import { and, eq, getTableColumns, getTableName, inArray, sql } from 'drizzle-orm';
import type { SQLiteColumn, SQLiteTable } from 'drizzle-orm/sqlite-core';

import type { Database } from '@/db/client';

import { toIsoString } from './merge';
import type { LocalTable, RemoteRecord, SyncedRow } from './types';

/** A Drizzle table that has the sync columns from src/db/schema.ts. */
type SyncedSqliteTable = SQLiteTable & {
  id: SQLiteColumn;
  clientUpdatedAt: SQLiteColumn;
  dirty: SQLiteColumn;
};

/**
 * Builds the sync engine's view of a Drizzle table. Server column names are
 * the device's column names (snake_case), so mapping is mechanical. Only the
 * timestamp columns need care, because Postgres formats them differently.
 *
 * @param timestampKeys Row keys holding timestamps, beyond the sync columns.
 */
export function drizzleSyncTable<Row extends SyncedRow>(
  db: Database,
  table: SyncedSqliteTable,
  timestampKeys: (keyof Row & string)[] = [],
): LocalTable<Row> {
  const columns = Object.entries(getTableColumns(table)).filter(([key]) => key !== 'dirty');
  const timestamps = new Set<string>(['clientUpdatedAt', 'deletedAt', ...timestampKeys]);

  // On conflict, overwrite every column with the incoming value.
  const overwriteAll = Object.fromEntries(
    columns.map(([key, column]) => [key, sql.raw(`excluded."${column.name}"`)]),
  );

  return {
    name: getTableName(table),

    async getDirty() {
      return (await db.select().from(table).where(eq(table.dirty, true))) as Row[];
    },

    async getByIds(ids) {
      if (ids.length === 0) return [];
      return (await db.select().from(table).where(inArray(table.id, ids))) as Row[];
    },

    async saveFromServer(rows) {
      if (rows.length === 0) return;
      await db
        .insert(table)
        .values(rows)
        .onConflictDoUpdate({ target: table.id, set: { ...overwriteAll, dirty: false } });
    },

    async markPushed(rows) {
      for (const row of rows) {
        await db
          .update(table)
          .set({ dirty: false })
          .where(and(eq(table.id, row.id), eq(table.clientUpdatedAt, row.clientUpdatedAt)));
      }
    },

    toRemote(row, userId) {
      const record: Record<string, unknown> = { user_id: userId };
      for (const [key, column] of columns) record[column.name] = row[key as keyof Row];
      return record;
    },

    fromRemote(record: RemoteRecord) {
      const row: Record<string, unknown> = { dirty: false };
      for (const [key, column] of columns) {
        const value = record[column.name] ?? null;
        row[key] = timestamps.has(key) && value !== null ? toIsoString(value) : value;
      }
      return row as Row;
    },
  };
}
