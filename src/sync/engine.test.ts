import { PAGE_SIZE, syncTables } from './engine';
import { pullSince, rowsToSave } from './merge';
import type { LocalTable, PullCursors, RemoteRecord, SyncServer, SyncedRow } from './types';

type Note = SyncedRow & { text: string };

function note(id: string, text: string, clientUpdatedAt: string, dirty = false): Note {
  return { id, text, clientUpdatedAt, deletedAt: null, dirty };
}

/** An in-memory device table. */
function fakeLocalTable(initial: Note[] = []) {
  const rows = new Map(initial.map((row) => [row.id, row]));
  const table: LocalTable<Note> = {
    name: 'notes',
    getDirty: async () => [...rows.values()].filter((row) => row.dirty),
    getByIds: async (ids) => ids.flatMap((id) => rows.get(id) ?? []),
    saveFromServer: async (saved) => saved.forEach((row) => rows.set(row.id, row)),
    markPushed: async (pushed) =>
      pushed.forEach(({ id, clientUpdatedAt }) => {
        const row = rows.get(id);
        if (row?.clientUpdatedAt === clientUpdatedAt) rows.set(id, { ...row, dirty: false });
      }),
    toRemote: ({ dirty, ...row }, userId) => ({ ...row, user_id: userId }),
    fromRemote: (record) => ({
      id: record.id,
      text: record.text as string,
      clientUpdatedAt: record.clientUpdatedAt as string,
      deletedAt: null,
      dirty: false,
    }),
  };
  return { table, rows };
}

/** An in-memory server with the same newest-change-wins rule as the Postgres trigger. */
function fakeServer() {
  const records = new Map<string, RemoteRecord>();
  let clock = Date.parse('2026-01-01T00:00:00Z');

  const server: SyncServer = {
    upsert: async (_table, incoming) => {
      for (const record of incoming) {
        const id = record.id as string;
        const existing = records.get(id);
        if (existing && (existing.clientUpdatedAt as string) > (record.clientUpdatedAt as string)) {
          continue;
        }
        records.set(id, { ...record, id, updated_at: new Date((clock += 1000)).toISOString() });
      }
    },
    changedSince: async (_table, since, offset, limit) =>
      [...records.values()]
        .filter((record) => record.updated_at > since)
        .sort((a, b) => a.updated_at.localeCompare(b.updated_at))
        .slice(offset, offset + limit),
  };
  return { server, records };
}

function memoryCursors(): PullCursors {
  const cursors = new Map<string, string>();
  return {
    get: async (table) => cursors.get(table) ?? null,
    set: async (table, value) => void cursors.set(table, value),
  };
}

const T1 = '2026-01-01T10:00:00.000Z';
const T2 = '2026-01-01T11:00:00.000Z';

describe('rowsToSave', () => {
  it('keeps a newer unpushed local change', () => {
    expect(rowsToSave([note('a', 'server', T1)], [note('a', 'mine', T2, true)])).toEqual([]);
  });

  it('takes the server row over an older unpushed local change', () => {
    const pulled = [note('a', 'server', T2)];
    expect(rowsToSave(pulled, [note('a', 'mine', T1, true)])).toEqual(pulled);
  });

  it('takes the server row when the local row is already pushed', () => {
    const pulled = [note('a', 'server', T1)];
    expect(rowsToSave(pulled, [note('a', 'mine', T2)])).toEqual(pulled);
  });
});

describe('pullSince', () => {
  it('starts from the beginning on a first pull', () => {
    expect(pullSince(null)).toBe('1970-01-01T00:00:00.000Z');
  });

  it('rewinds the cursor a little to catch slow writes', () => {
    expect(pullSince('2026-01-01T10:00:10.000Z')).toBe('2026-01-01T10:00:00.000Z');
  });
});

describe('syncTables', () => {
  it('copies one device’s changes to another', async () => {
    const { server } = fakeServer();
    const phone = fakeLocalTable([note('a', 'pasta', T1, true)]);
    const tablet = fakeLocalTable();

    await syncTables([phone.table], { server, cursors: memoryCursors(), userId: 'u1' });
    await syncTables([tablet.table], { server, cursors: memoryCursors(), userId: 'u1' });

    expect(phone.rows.get('a')?.dirty).toBe(false);
    expect(tablet.rows.get('a')).toEqual(note('a', 'pasta', T1));
  });

  it('keeps the newest edit when two devices change the same row', async () => {
    const { server } = fakeServer();
    const phone = fakeLocalTable([note('a', 'phone edit', T2, true)]);
    const tablet = fakeLocalTable([note('a', 'older tablet edit', T1, true)]);
    const phoneCursors = memoryCursors();
    const tabletCursors = memoryCursors();

    await syncTables([phone.table], { server, cursors: phoneCursors, userId: 'u1' });
    await syncTables([tablet.table], { server, cursors: tabletCursors, userId: 'u1' });
    await syncTables([phone.table], { server, cursors: phoneCursors, userId: 'u1' });

    expect(tablet.rows.get('a')?.text).toBe('phone edit');
    expect(phone.rows.get('a')?.text).toBe('phone edit');
  });

  it('pulls in pages', async () => {
    const { server } = fakeServer();
    const count = PAGE_SIZE * 2 + 3;
    const phone = fakeLocalTable(
      Array.from({ length: count }, (_, i) => note(`n${i}`, 'x', T1, true)),
    );
    const tablet = fakeLocalTable();

    await syncTables([phone.table], { server, cursors: memoryCursors(), userId: 'u1' });
    await syncTables([tablet.table], { server, cursors: memoryCursors(), userId: 'u1' });

    expect(tablet.rows.size).toBe(count);
  });

  it('only pulls rows changed since the last pull', async () => {
    const { server } = fakeServer();
    const phone = fakeLocalTable([note('a', 'first', T1, true)]);
    const cursors = memoryCursors();
    const changedSince = jest.spyOn(server, 'changedSince');

    await syncTables([phone.table], { server, cursors, userId: 'u1' });
    const firstSince = changedSince.mock.calls[0]![1];
    await syncTables([phone.table], { server, cursors, userId: 'u1' });
    const secondSince = changedSince.mock.calls[1]![1];

    expect(secondSince > firstSince).toBe(true);
  });

  it('adds the user id when pushing', async () => {
    const { server, records } = fakeServer();
    const phone = fakeLocalTable([note('a', 'pasta', T1, true)]);

    await syncTables([phone.table], { server, cursors: memoryCursors(), userId: 'u1' });

    expect(records.get('a')?.user_id).toBe('u1');
  });
});
