import type { SupabaseClient } from '@supabase/supabase-js';

import type { RemoteRecord, SyncServer } from './types';

export function supabaseSyncServer(client: SupabaseClient): SyncServer {
  return {
    async upsert(table, records) {
      const { error } = await client.from(table).upsert(records);
      if (error) throw error;
    },

    async changedSince(table, since, offset, limit) {
      // Row-level security limits this to the signed-in user's rows.
      const { data, error } = await client
        .from(table)
        .select('*')
        .gt('updated_at', since)
        .order('updated_at')
        .order('id')
        .range(offset, offset + limit - 1);
      if (error) throw error;
      return data as RemoteRecord[];
    },
  };
}
