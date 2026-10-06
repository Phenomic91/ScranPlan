# Sync

ScranPlan keeps all data on the phone in SQLite and syncs it through Supabase
(Postgres) when the user is signed in. We wrote our own small sync rather than
using a sync product, to avoid lock-in and fees. It is a few hundred lines in
`src/sync`.

## Rules

- **Newest change wins.** Each row carries `client_updated_at`, the time the
  device changed it. When two devices change the same row, the later change is
  kept, for the whole row. Good enough for recipes and plans, where two people
  editing the same row at once is rare.
- **Ids come from the device** (`Crypto.randomUUID()`), so rows can be created
  offline.
- **Deletes are soft.** A delete sets `deleted_at`, so it reaches other devices.
- **`dirty`** (device only) marks rows changed since the last push.
- **`updated_at`** (server only) is when the server accepted the latest write.
  Devices pull everything changed since the last `updated_at` they saw.

## One sync

For each table in `src/sync/tables.ts`:

1. **Push.** Upsert every dirty row (500 per request). A Postgres trigger
   (`keep_newest_change`) skips any write older than what the server holds.
   Rows are then marked clean, unless they changed again during the push.
2. **Pull.** Fetch rows with `updated_at` after the saved cursor, minus a
   10-second overlap that catches writes still in flight. Save each one unless
   the device holds a newer unpushed change to it. Move the cursor on.

Pushing first means a pull can't overwrite a local edit that hasn't been sent.

## When it runs

On app start, when the app returns to the foreground, when the network comes
back, and two seconds after any local edit (`requestSync()`). Settings has a
"Sync now" button and shows the last result.

## Where things are

| Piece                             | File                                              |
| --------------------------------- | ------------------------------------------------- |
| Engine (push, pull)               | `src/sync/engine.ts`                              |
| Merge rules                       | `src/sync/merge.ts` (tested in `engine.test.ts`)  |
| Device tables                     | `src/sync/drizzle-table.ts`, `src/sync/tables.ts` |
| Server calls                      | `src/sync/supabase-server.ts`                     |
| Triggers and schedule             | `src/sync/sync-provider.tsx`                      |
| Server tables, triggers, security | `supabase/migrations/`                            |

## Known limits

- Signing out keeps the recipes on the phone. If someone else then signs in on
  the same phone, those recipes are pushed to their account.
- Whole-row conflicts: two devices editing different fields of the same recipe
  at the same moment keep only the later edit.
- Sharing between people (a household) is not designed yet; it will need a
  `household_id` and new row-level security rules.
