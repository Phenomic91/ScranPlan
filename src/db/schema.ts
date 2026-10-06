import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import type { Ingredient, OvenSetting, Step } from '@/domain/recipes/recipe';

/**
 * Columns every synced table carries. Timestamps are ISO-8601 strings so they
 * compare correctly as text and match Postgres timestamptz output.
 */
const syncColumns = {
  /** When this device last changed the row; the newest change wins. */
  clientUpdatedAt: text('client_updated_at').notNull(),
  /** Soft delete, so the deletion can sync to other devices. */
  deletedAt: text('deleted_at'),
  /** True until the latest local change has been pushed to the server. */
  dirty: integer('dirty', { mode: 'boolean' }).notNull().default(true),
};

export const recipes = sqliteTable('recipes', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  shortName: text('short_name').notNull(),
  minutes: integer('minutes').notNull(),
  serves: integer('serves').notNull(),
  vegetarian: integer('vegetarian', { mode: 'boolean' }).notNull(),
  blurb: text('blurb').notNull(),
  oven: text('oven', { mode: 'json' }).$type<OvenSetting | null>(),
  ingredients: text('ingredients', { mode: 'json' }).$type<Ingredient[]>().notNull(),
  steps: text('steps', { mode: 'json' }).$type<Step[]>().notNull(),
  note: text('note').notNull(),
  createdAt: text('created_at').notNull(),
  ...syncColumns,
});

/** Where each table's last pull from the server got to. */
export const syncState = sqliteTable('sync_state', {
  tableName: text('table_name').primaryKey(),
  lastPulledAt: text('last_pulled_at').notNull(),
});
