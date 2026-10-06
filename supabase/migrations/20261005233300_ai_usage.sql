-- Counts AI requests that go through our server key, per user per calendar month, so the
-- ai Edge Function can enforce an allowance. Requests made on the device or
-- with the user's own Claude key never reach the server and aren't counted.

create table public.ai_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  month date not null default date_trunc('month', current_date)::date,
  requests integer not null default 0,
  primary key (user_id, month)
);

-- Users can see their own usage; only consume_ai_allowance can change it.
alter table public.ai_usage enable row level security;

create policy "Users read their own AI usage" on public.ai_usage
  for select to authenticated using ((select auth.uid()) = user_id);

-- Counts one request for the signed-in user and reports whether it's within
-- this month's limit. The upsert is atomic, so parallel requests can't overshoot.
create function public.consume_ai_allowance(monthly_limit integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  used integer;
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;

  insert into public.ai_usage as usage (user_id, month, requests)
  values (auth.uid(), date_trunc('month', current_date)::date, 1)
  on conflict (user_id, month) do update set requests = usage.requests + 1
  returning requests into used;

  return used <= monthly_limit;
end;
$$;

revoke execute on function public.consume_ai_allowance from public, anon;
grant execute on function public.consume_ai_allowance to authenticated;
