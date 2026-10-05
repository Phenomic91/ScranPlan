import { pullSince, rowsToSave, toIsoString } from './merge';
import type { LocalTable, PullCursors, SyncServer, SyncedRow } from './types';

/** Rows sent or fetched per request. */
export const PAGE_SIZE = 500;

type SyncContext = { server: SyncServer; cursors: PullCursors; userId: string };

/** Pushes local changes first, so a pull straight after can't overwrite them. */
export async function syncTables(tables: LocalTable[], context: SyncContext): Promise<void> {
  for (const table of tables) {
    await push(table, context);
    await pull(table, context);
  }
}

export async function push<Row extends SyncedRow>(
  table: LocalTable<Row>,
  { server, userId }: SyncContext,
): Promise<void> {
  const dirty = await table.getDirty();
  for (let start = 0; start < dirty.length; start += PAGE_SIZE) {
    const page = dirty.slice(start, start + PAGE_SIZE);
    await server.upsert(
      table.name,
      page.map((row) => table.toRemote(row, userId)),
    );
    await table.markPushed(page);
  }
}

export async function pull<Row extends SyncedRow>(
  table: LocalTable<Row>,
  { server, cursors }: SyncContext,
): Promise<void> {
  const since = pullSince(await cursors.get(table.name));
  let newest: string | null = null;

  for (let offset = 0; ; offset += PAGE_SIZE) {
    const records = await server.changedSince(table.name, since, offset, PAGE_SIZE);
    if (records.length === 0) break;

    const pulled = records.map((record) => table.fromRemote(record));
    const local = await table.getByIds(pulled.map((row) => row.id));
    await table.saveFromServer(rowsToSave(pulled, local));

    newest = toIsoString(records[records.length - 1]!.updated_at);
    if (records.length < PAGE_SIZE) break;
  }

  if (newest) await cursors.set(table.name, newest);
}
