-- Shared pieces for every synced table, then the recipes table.
--
-- Sync rules (see docs/sync.md):
--   * Devices make row ids and send client_updated_at, the time of their change.
--   * The newest client_updated_at wins: an older write is silently skipped.
--   * updated_at is the server's own time of the last accepted write; devices
--     pull rows changed since the last updated_at they saw.

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create function public.keep_newest_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- Returning null from a BEFORE UPDATE trigger skips the update.
  if new.client_updated_at < old.client_updated_at then
    return null;
  end if;
  return new;
end;
$$;

create table public.recipes (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  short_name text not null,
  minutes integer not null,
  serves integer not null,
  vegetarian boolean not null,
  blurb text not null,
  oven jsonb,
  ingredients jsonb not null,
  steps jsonb not null,
  note text not null,
  created_at timestamptz not null,
  client_updated_at timestamptz not null,
  deleted_at timestamptz,
  updated_at timestamptz not null default now()
);

create index recipes_user_id_updated_at on public.recipes (user_id, updated_at);

create trigger recipes_keep_newest_change
  before update on public.recipes
  for each row execute function public.keep_newest_change();

-- Named so it runs after keep_newest_change (triggers fire in name order).
create trigger recipes_set_updated_at
  before insert or update on public.recipes
  for each row execute function public.set_updated_at();

alter table public.recipes enable row level security;

create policy "Users read their own recipes" on public.recipes
  for select to authenticated using ((select auth.uid()) = user_id);

create policy "Users add their own recipes" on public.recipes
  for insert to authenticated with check ((select auth.uid()) = user_id);

create policy "Users change their own recipes" on public.recipes
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- No delete policy: devices soft-delete with deleted_at so deletions sync.
