-- Individual workspaces for the first validated release. Team sharing is not enabled.
create table public.monitors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (length(name) between 1 and 253),
  url text not null check (length(url) between 8 and 2048 and url ~ '^https?://'),
  hostname text not null check (length(hostname) between 3 and 253),
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  last_requested_at timestamptz,
  unique (user_id, url),
  unique (id, user_id)
);
create index monitors_owner_created_idx on public.monitors(user_id, created_at);

create table public.monitor_checks (
  id uuid primary key default gen_random_uuid(),
  monitor_id uuid not null,
  user_id uuid not null,
  checked_at timestamptz not null default now(),
  status text not null check (status in ('ok', 'attention', 'failed')),
  http_status integer check (http_status between 100 and 599),
  duration_ms integer not null check (duration_ms between 0 and 120000),
  detail text not null check (length(detail) between 1 and 1000),
  foreign key (monitor_id, user_id) references public.monitors(id, user_id) on delete cascade
);
create index monitor_checks_owner_time_idx on public.monitor_checks(user_id, checked_at desc);
create index monitor_checks_monitor_owner_idx on public.monitor_checks(monitor_id, user_id);

alter table public.monitors enable row level security;
alter table public.monitors force row level security;
alter table public.monitor_checks enable row level security;
alter table public.monitor_checks force row level security;

revoke all on public.monitors, public.monitor_checks from public, anon, authenticated;
grant select on public.monitors, public.monitor_checks to authenticated;
grant all on public.monitors, public.monitor_checks to service_role;

create policy monitors_read_own on public.monitors for select to authenticated
  using (user_id = (select auth.uid()));
create policy checks_read_own on public.monitor_checks for select to authenticated
  using (user_id = (select auth.uid()));

-- The backend derives p_user_id from Supabase getUser(), never from the request body.
-- SECURITY INVOKER and an explicit service_role grant: no privilege escalation.
create function public.create_monitor_for_user(p_user_id uuid, p_url text, p_hostname text)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  monitor_id uuid;
begin
  if p_user_id is null then
    raise exception 'USER_REQUIRED';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));
  if (select count(*) from public.monitors where user_id = p_user_id) >= 2
    or exists (select 1 from public.monitors where user_id = p_user_id and hostname <> p_hostname)
  then
    raise exception 'FREE_MONITOR_LIMIT';
  end if;
  insert into public.monitors(user_id, name, url, hostname)
    values(p_user_id, p_hostname, p_url, p_hostname)
    returning id into monitor_id;
  return monitor_id;
end;
$$;
revoke all on function public.create_monitor_for_user(uuid, text, text) from public, anon, authenticated;
grant execute on function public.create_monitor_for_user(uuid, text, text) to service_role;

comment on table public.monitors is 'Individual account monitors. Browser read-only via RLS; writes through the authenticated VPS API.';
comment on table public.monitor_checks is 'HTTP HEAD observations from the VPS. No page bodies, customer messages or credentials.';
