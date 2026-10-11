-- Multi-tenant foundation for the FLUXO dashboard. Existing rows are
-- retained and moved into a private initial workspace for their owner.
create schema if not exists private;
revoke all on schema private from public;

create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 1 and 120),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table public.tenant_members (
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'member')),
  created_at timestamptz not null default now(),
  primary key (tenant_id, user_id)
);
create index tenant_members_user_idx on public.tenant_members(user_id, tenant_id);

-- This table is deliberately service-managed. A browser cannot make itself an
-- administrator; appointment is an audited operational action outside the app.
create table public.platform_administrators (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Global provider catalog. A row contains metadata and an opaque reference to
-- a VPS-managed secret, never the secret itself. Only a platform administrator
-- can manage this catalog through the authenticated API.
create table public.platform_providers (
  id uuid primary key default gen_random_uuid(),
  provider_key text not null unique check (provider_key ~ '^[a-z0-9][a-z0-9_-]{2,62}$'),
  display_name text not null check (length(display_name) between 1 and 120),
  channel text not null check (channel in ('whatsapp_waba', 'email_smtp')),
  credential_reference text not null check (credential_reference ~ '^[A-Z][A-Z0-9_]{2,127}$'),
  status text not null default 'pending' check (status in ('pending', 'validated', 'disabled', 'error')),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index platform_providers_channel_status_idx on public.platform_providers(channel, status);

-- Configuration metadata only. OAuth tokens, SMTP passwords and WABA system
-- user tokens never enter these rows or the browser; the VPS secret store will
-- later hold credentials referenced by a non-public operational identifier.
create table public.tenant_channel_connections (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  provider_id uuid references public.platform_providers(id) on delete restrict,
  channel text not null check (channel in ('whatsapp_waba', 'email_smtp')),
  status text not null default 'pending' check (status in ('pending', 'configured', 'validated', 'disabled', 'error')),
  account_reference text check (length(account_reference) between 1 and 255),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, channel)
);
create index tenant_channel_connections_tenant_idx on public.tenant_channel_connections(tenant_id, channel);

create function private.is_tenant_member(target_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1 from public.tenant_members
    where tenant_id = target_tenant_id and user_id = auth.uid()
  );
$$;

create function private.is_platform_administrator()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1 from public.platform_administrators
    where user_id = auth.uid()
  );
$$;

revoke all on function private.is_tenant_member(uuid) from public;
revoke all on function private.is_platform_administrator() from public;
grant usage on schema private to authenticated;
grant execute on function private.is_tenant_member(uuid) to authenticated;
grant execute on function private.is_platform_administrator() to authenticated;

-- Data from the previous individual-workspace release keeps its owner and is
-- assigned to a dedicated tenant before tenant_id becomes mandatory.
insert into public.tenants (name, created_by)
select 'Espaço inicial', legacy.user_id
from (select distinct user_id from public.monitors) as legacy;

insert into public.tenant_members (tenant_id, user_id, role)
select tenants.id, tenants.created_by, 'owner'
from public.tenants
where tenants.name = 'Espaço inicial'
on conflict do nothing;

alter table public.monitors add column tenant_id uuid references public.tenants(id) on delete cascade;
update public.monitors as monitors
set tenant_id = tenants.id
from public.tenants as tenants
where tenants.created_by = monitors.user_id
  and tenants.name = 'Espaço inicial';
alter table public.monitors alter column tenant_id set not null;

alter table public.monitor_checks add column tenant_id uuid;
update public.monitor_checks as checks
set tenant_id = monitors.tenant_id
from public.monitors as monitors
where monitors.id = checks.monitor_id;
alter table public.monitor_checks alter column tenant_id set not null;

alter table public.monitor_checks drop constraint monitor_checks_monitor_id_user_id_fkey;
alter table public.monitors drop constraint monitors_user_id_url_key;
alter table public.monitors drop constraint monitors_id_user_id_key;
alter table public.monitors add constraint monitors_tenant_url_key unique (tenant_id, url);
alter table public.monitors add constraint monitors_id_tenant_key unique (id, tenant_id);
alter table public.monitor_checks add constraint monitor_checks_monitor_tenant_fkey
  foreign key (monitor_id, tenant_id) references public.monitors(id, tenant_id) on delete cascade;

drop index public.monitors_owner_created_idx;
drop index public.monitor_checks_owner_time_idx;
drop index public.monitor_checks_monitor_owner_idx;
create index monitors_tenant_created_idx on public.monitors(tenant_id, created_at);
create index monitor_checks_tenant_time_idx on public.monitor_checks(tenant_id, checked_at desc);
create index monitor_checks_monitor_tenant_idx on public.monitor_checks(monitor_id, tenant_id);

alter table public.tenants enable row level security;
alter table public.tenants force row level security;
alter table public.tenant_members enable row level security;
alter table public.tenant_members force row level security;
alter table public.platform_administrators enable row level security;
alter table public.platform_administrators force row level security;
alter table public.platform_providers enable row level security;
alter table public.platform_providers force row level security;
alter table public.tenant_channel_connections enable row level security;
alter table public.tenant_channel_connections force row level security;

revoke all on public.tenants, public.tenant_members, public.platform_administrators, public.platform_providers, public.tenant_channel_connections from public, anon, authenticated;
grant select on public.tenant_channel_connections to authenticated;
grant all on public.tenants, public.tenant_members, public.platform_administrators, public.platform_providers, public.tenant_channel_connections to service_role;

drop policy monitors_read_own on public.monitors;
drop policy checks_read_own on public.monitor_checks;
create policy monitors_read_tenant on public.monitors for select to authenticated
  using ((select private.is_tenant_member(tenant_id)));
create policy checks_read_tenant on public.monitor_checks for select to authenticated
  using ((select private.is_tenant_member(tenant_id)));
create policy channel_connections_read_tenant on public.tenant_channel_connections for select to authenticated
  using ((select private.is_tenant_member(tenant_id)));

create function public.create_monitor_for_tenant(p_tenant_id uuid, p_user_id uuid, p_url text, p_hostname text)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  monitor_id uuid;
begin
  if p_tenant_id is null or p_user_id is null then
    raise exception 'TENANT_AND_USER_REQUIRED';
  end if;
  if not exists (
    select 1 from public.tenant_members
    where tenant_id = p_tenant_id and user_id = p_user_id
  ) then
    raise exception 'TENANT_ACCESS_DENIED';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_tenant_id::text, 0));
  if (select count(*) from public.monitors where tenant_id = p_tenant_id) >= 2
    or exists (select 1 from public.monitors where tenant_id = p_tenant_id and hostname <> p_hostname)
  then
    raise exception 'FREE_MONITOR_LIMIT';
  end if;
  insert into public.monitors(tenant_id, user_id, name, url, hostname)
    values(p_tenant_id, p_user_id, p_hostname, p_url, p_hostname)
    returning id into monitor_id;
  return monitor_id;
end;
$$;
revoke all on function public.create_monitor_for_tenant(uuid, uuid, text, text) from public, anon, authenticated;
grant execute on function public.create_monitor_for_tenant(uuid, uuid, text, text) to service_role;

-- Idempotent onboarding for a confirmed Supabase Auth user. The API invokes
-- this with a user id derived from getUser(), never from request JSON.
create function public.ensure_personal_tenant(p_user_id uuid)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  workspace_id uuid;
begin
  if p_user_id is null then
    raise exception 'USER_REQUIRED';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 1));
  select tenant_id into workspace_id
  from public.tenant_members
  where user_id = p_user_id
  order by created_at, tenant_id
  limit 1;
  if workspace_id is not null then
    return workspace_id;
  end if;
  insert into public.tenants(name, created_by)
    values ('Meu espaço', p_user_id)
    returning id into workspace_id;
  insert into public.tenant_members(tenant_id, user_id, role)
    values (workspace_id, p_user_id, 'owner');
  return workspace_id;
end;
$$;
revoke all on function public.ensure_personal_tenant(uuid) from public, anon, authenticated;
grant execute on function public.ensure_personal_tenant(uuid) to service_role;

comment on table public.tenants is 'FLUXO tenant boundary. A member only reads tenant-scoped operational data.';
comment on table public.tenant_members is 'Membership and role mapping managed by the service, never directly by the browser.';
comment on table public.platform_administrators is 'Global operational role. Assignment requires a controlled server-side procedure.';
comment on table public.platform_providers is 'Global provider metadata. credential_reference resolves only in the VPS private environment.';
comment on table public.tenant_channel_connections is 'Tenant channel state without credentials. Tokens and SMTP passwords stay outside Supabase rows and browser code.';
comment on table public.monitors is 'Tenant-scoped monitors. Browser read-only through membership RLS; writes occur through the authenticated VPS API.';
comment on table public.monitor_checks is 'Tenant-scoped HTTP observations. No page bodies, credentials or customer messages are stored.';
