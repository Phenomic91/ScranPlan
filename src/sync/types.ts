/**
 * The sync protocol, in short:
 *
 * - Every synced row has an id made on the device, a `clientUpdatedAt` time set
 *   whenever the device changes it, and a soft-delete `deletedAt`.
 * - Push: rows marked dirty are upserted to the server. The server keeps
 *   whichever version has the newest `clientUpdatedAt` (newest change wins).
 * - Pull: rows the server changed since the last pull are fetched, by the
 *   server's own `updated_at`, and saved unless this device holds a newer
 *   unpushed change to the same row.
 *
 * See docs/sync.md for the reasoning and the server side.
 */

/** The fields the sync engine relies on. Timestamps are ISO-8601 UTC strings. */
export type SyncedRow = {
  id: string;
  clientUpdatedAt: string;
  deletedAt: string | null;
  dirty: boolean;
};

/** A row as the server stores it: snake_case columns plus user_id and updated_at. */
export type RemoteRecord = Record<string, unknown> & { id: string; updated_at: string };

/** One synced table on the device. */
export type LocalTable<Row extends SyncedRow = SyncedRow> = {
  /** Same name on the device and the server. */
  name: string;
  getDirty(): Promise<Row[]>;
  getByIds(ids: string[]): Promise<Row[]>;
  /** Saves rows that came from the server (they arrive with dirty = false). */
  saveFromServer(rows: Row[]): Promise<void>;
  /** Clears the dirty flag, but only where the row hasn't changed again since it was pushed. */
  markPushed(rows: Pick<Row, 'id' | 'clientUpdatedAt'>[]): Promise<void>;
  toRemote(row: Row, userId: string): Record<string, unknown>;
  fromRemote(record: RemoteRecord): Row;
};

/** The server side of sync. Implemented with Supabase, and with a fake in tests. */
export type SyncServer = {
  upsert(table: string, records: Record<string, unknown>[]): Promise<void>;
  /** Rows changed after `since`, oldest change first. */
  changedSince(
    table: string,
    since: string,
    offset: number,
    limit: number,
  ): Promise<RemoteRecord[]>;
};

/** Where each table's last pull got to, as a server `updated_at` time. */
export type PullCursors = {
  get(table: string): Promise<string | null>;
  set(table: string, lastPulledAt: string): Promise<void>;
};
