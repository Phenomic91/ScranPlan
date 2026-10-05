import type { SyncedRow } from './types';

/**
 * Picks which pulled rows to save. A pulled row loses only to a local change
 * that hasn't been pushed yet and is newer; that change will be pushed next.
 */
export function rowsToSave<Row extends SyncedRow>(pulled: Row[], local: Row[]): Row[] {
  const localById = new Map(local.map((row) => [row.id, row]));
  return pulled.filter((incoming) => {
    const mine = localById.get(incoming.id);
    return !mine || !mine.dirty || incoming.clientUpdatedAt >= mine.clientUpdatedAt;
  });
}

/**
 * How far to rewind the pull cursor. The server stamps `updated_at` when a
 * write starts, so a slow write can land with a time just before the cursor.
 * Re-reading a short window catches it; re-saving a row is harmless.
 */
export const PULL_OVERLAP_MS = 10_000;

/** The `since` time for the next pull, or the start of time on a first pull. */
export function pullSince(lastPulledAt: string | null): string {
  if (!lastPulledAt) return new Date(0).toISOString();
  return new Date(Date.parse(lastPulledAt) - PULL_OVERLAP_MS).toISOString();
}

/** Converts any timestamp the server sends (e.g. "…+00:00") to the device's ISO form. */
export function toIsoString(value: unknown): string {
  if (typeof value !== 'string') throw new Error(`Expected a timestamp, got ${String(value)}`);
  return new Date(value).toISOString();
}
