-- Applied to the authorized Supabase project with version 20261011013631.
-- Additive migration: preserves existing users, passwords, tenants and data.
-- Browser authorization remains database-backed, never based on email or user_metadata.
alter policy monitors_read_tenant on public.monitors using (
  (select private.is_tenant_member(tenant_id)) or (select private.is_platform_administrator())
);
alter policy checks_read_tenant on public.monitor_checks using (
  (select private.is_tenant_member(tenant_id)) or (select private.is_platform_administrator())
);
alter policy channel_connections_read_tenant on public.tenant_channel_connections using (
  (select private.is_tenant_member(tenant_id)) or (select private.is_platform_administrator())
);

create table public.platform_audit_events (
  id bigint generated always as identity primary key,
  actor_id uuid not null references auth.users(id) on delete restrict,
  tenant_id uuid references public.tenants(id) on delete restrict,
  action text not null check (length(action) between 1 and 80),
  subject_id uuid,
  details jsonb not null default '{}'::jsonb check (octet_length(details::text) <= 4096),
  created_at timestamptz not null default now()
);
create index platform_audit_time_idx on public.platform_audit_events(created_at desc, id desc);
create index platform_audit_actor_idx on public.platform_audit_events(actor_id);
create index platform_audit_tenant_idx on public.platform_audit_events(tenant_id, created_at desc);
alter table public.platform_audit_events enable row level security;
alter table public.platform_audit_events force row level security;
revoke all on public.platform_audit_events from public, anon, authenticated;
grant select, insert on public.platform_audit_events to service_role;
grant usage on sequence public.platform_audit_events_id_seq to service_role;
create policy audit_admin_read on public.platform_audit_events for select to authenticated
  using ((select private.is_platform_administrator()));

create function public.admin_set_member_role(p_actor_id uuid, p_tenant_id uuid, p_user_id uuid, p_role text)
returns void language plpgsql security invoker set search_path = '' as $$
declare previous_role text;
begin
  if not exists (select 1 from public.platform_administrators where user_id = p_actor_id) then raise exception 'ADMIN_REQUIRED'; end if;
  if p_role not in ('owner','admin','member') or p_role is null then raise exception 'INVALID_ROLE'; end if;
  -- Serialize ownership changes; never leave a tenant without an owner.
  perform 1 from public.tenants where id = p_tenant_id for update;
  select role into previous_role from public.tenant_members where tenant_id=p_tenant_id and user_id=p_user_id;
  if previous_role is null then raise exception 'MEMBER_NOT_FOUND'; end if;
  if previous_role='owner' and p_role<>'owner' and
    (select count(*) from public.tenant_members where tenant_id=p_tenant_id and role='owner') <= 1 then
    raise exception 'LAST_OWNER';
  end if;
  if previous_role = p_role then return; end if;
  update public.tenant_members set role=p_role where tenant_id=p_tenant_id and user_id=p_user_id;
  insert into public.platform_audit_events(actor_id,tenant_id,action,subject_id,details)
    values(p_actor_id,p_tenant_id,'member.role_changed',p_user_id,jsonb_build_object('from',previous_role,'to',p_role));
end $$;
revoke all on function public.admin_set_member_role(uuid,uuid,uuid,text) from public, anon, authenticated;
grant execute on function public.admin_set_member_role(uuid,uuid,uuid,text) to service_role;

create function public.admin_set_provider_status(p_actor_id uuid, p_provider_id uuid, p_status text)
returns void language plpgsql security invoker set search_path = '' as $$
declare previous_status text;
begin
  if not exists (select 1 from public.platform_administrators where user_id=p_actor_id) then raise exception 'ADMIN_REQUIRED'; end if;
  -- Validation cannot be declared by a button: it requires a real connector test.
  if p_status not in ('pending','disabled') or p_status is null then raise exception 'INVALID_STATUS'; end if;
  select status into previous_status from public.platform_providers where id=p_provider_id for update;
  if previous_status is null then raise exception 'PROVIDER_NOT_FOUND'; end if;
  if previous_status=p_status then return; end if;
  update public.platform_providers set status=p_status,updated_at=now() where id=p_provider_id;
  if p_status='disabled' then
    update public.tenant_channel_connections set status='disabled',updated_at=now() where provider_id=p_provider_id;
  end if;
  insert into public.platform_audit_events(actor_id,action,subject_id,details)
    values(p_actor_id,'provider.status_changed',p_provider_id,jsonb_build_object('from',previous_status,'to',p_status));
end $$;
revoke all on function public.admin_set_provider_status(uuid,uuid,text) from public, anon, authenticated;
grant execute on function public.admin_set_provider_status(uuid,uuid,text) to service_role;

create or replace function public.create_monitor_for_tenant(p_tenant_id uuid,p_user_id uuid,p_url text,p_hostname text)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare monitor_id uuid;
begin
  if p_tenant_id is null or p_user_id is null then raise exception 'TENANT_AND_USER_REQUIRED'; end if;
  if not exists(select 1 from public.tenant_members where tenant_id=p_tenant_id and user_id=p_user_id)
    and not exists(select 1 from public.platform_administrators where user_id=p_user_id) then raise exception 'TENANT_ACCESS_DENIED'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_tenant_id::text,0));
  if (select count(*) from public.monitors where tenant_id=p_tenant_id)>=2
    or exists(select 1 from public.monitors where tenant_id=p_tenant_id and hostname<>p_hostname) then raise exception 'FREE_MONITOR_LIMIT'; end if;
  insert into public.monitors(tenant_id,user_id,name,url,hostname) values(p_tenant_id,p_user_id,p_hostname,p_url,p_hostname) returning id into monitor_id;
  return monitor_id;
end $$;

create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  display_name text not null check(length(display_name) between 1 and 160),
  source text not null default 'manual' check(source in ('manual','import','channel')),
  status text not null default 'active' check(status in ('active','archived')),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(id,tenant_id)
);
create index contacts_tenant_time_idx on public.contacts(tenant_id,created_at desc,id desc);
create index contacts_creator_idx on public.contacts(created_by);

create table public.contact_identities (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  contact_id uuid not null,
  kind text not null check(kind in ('email','phone')),
  normalized_value text not null check(length(normalized_value) between 3 and 254),
  created_at timestamptz not null default now(),
  unique(tenant_id,kind,normalized_value),
  foreign key(contact_id,tenant_id) references public.contacts(id,tenant_id) on delete cascade,
  check((kind='email' and normalized_value=lower(btrim(normalized_value)) and normalized_value ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$')
    or (kind='phone' and normalized_value ~ '^\+[1-9][0-9]{7,14}$'))
);
create index contact_identities_contact_idx on public.contact_identities(contact_id,tenant_id);

alter table public.tenant_channel_connections add constraint connections_id_tenant_unique unique(id,tenant_id);
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  contact_id uuid not null,
  connection_id uuid not null,
  external_id text not null check(length(external_id) between 1 and 255),
  subject text check(length(subject)<=500),
  status text not null default 'open' check(status in ('open','closed')),
  created_at timestamptz not null default now(),
  unique(id,tenant_id,connection_id),
  unique(tenant_id,connection_id,external_id),
  foreign key(contact_id,tenant_id) references public.contacts(id,tenant_id) on delete restrict,
  foreign key(connection_id,tenant_id) references public.tenant_channel_connections(id,tenant_id) on delete restrict
);
create index conversations_contact_idx on public.conversations(contact_id,tenant_id,created_at desc);
create index conversations_connection_idx on public.conversations(connection_id,tenant_id);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  conversation_id uuid not null,
  connection_id uuid not null,
  external_id text not null check(length(external_id) between 1 and 255),
  direction text not null check(direction in ('inbound','outbound')),
  body_text text not null check(octet_length(body_text)<=65536),
  occurred_at timestamptz not null,
  received_at timestamptz not null default now(),
  unique(tenant_id,connection_id,external_id),
  foreign key(conversation_id,tenant_id,connection_id) references public.conversations(id,tenant_id,connection_id) on delete restrict
);
create index messages_conversation_time_idx on public.messages(conversation_id,tenant_id,connection_id,occurred_at desc,id desc);

-- Cursor metadata only, not an operational connector or a promise to import history.
create table public.channel_sync_state (
  connection_id uuid primary key,
  tenant_id uuid not null,
  cursor_value text check(length(cursor_value)<=2048),
  last_synced_at timestamptz,
  state text not null default 'not_configured' check(state in ('not_configured','ready','syncing','error','rebuild_required')),
  updated_at timestamptz not null default now(),
  foreign key(connection_id,tenant_id) references public.tenant_channel_connections(id,tenant_id) on delete restrict
);
create index channel_sync_tenant_idx on public.channel_sync_state(tenant_id);

do $$ declare table_name text; begin
  foreach table_name in array array['contacts','contact_identities','conversations','messages','channel_sync_state'] loop
    execute format('alter table public.%I enable row level security',table_name);
    execute format('alter table public.%I force row level security',table_name);
    execute format('revoke all on public.%I from public,anon,authenticated',table_name);
    execute format('grant all on public.%I to service_role',table_name);
    execute format('create policy tenant_read on public.%I for select to authenticated using ((select private.is_tenant_member(tenant_id)) or (select private.is_platform_administrator()))',table_name);
  end loop;
end $$;
grant select on public.contacts,public.contact_identities,public.conversations,public.messages to authenticated;
-- Sync cursors remain server-only even for ordinary authenticated users.

create function public.save_contact(p_actor_id uuid,p_tenant_id uuid,p_name text,p_email text,p_phone text)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare contact_uuid uuid; found_ids uuid[]; was_created boolean:=false;
begin
  if not exists(select 1 from public.tenant_members where tenant_id=p_tenant_id and user_id=p_actor_id)
    and not exists(select 1 from public.platform_administrators where user_id=p_actor_id) then raise exception 'TENANT_ACCESS_DENIED'; end if;
  p_name:=btrim(p_name); p_email:=nullif(lower(btrim(p_email)),''); p_phone:=nullif(btrim(p_phone),'');
  if p_name is null or length(p_name) not between 1 and 160 or (p_email is null and p_phone is null)
    or (p_email is not null and (length(p_email)>254 or p_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'))
    or (p_phone is not null and p_phone !~ '^\+[1-9][0-9]{7,14}$') then raise exception 'INVALID_CONTACT'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_tenant_id::text,2));
  select array_agg(distinct contact_id) into found_ids from public.contact_identities
    where tenant_id=p_tenant_id and ((kind='email' and normalized_value=p_email) or (kind='phone' and normalized_value=p_phone));
  if cardinality(found_ids)>1 then raise exception 'IDENTITY_CONFLICT'; end if;
  contact_uuid:=found_ids[1];
  if contact_uuid is null then
    insert into public.contacts(tenant_id,display_name,created_by) values(p_tenant_id,p_name,p_actor_id) returning id into contact_uuid;
    was_created:=true;
  end if;
  -- Do not silently merge identities into an existing contact. Return the record
  -- unchanged; adding a new identifier requires a future explicit review flow.
  if was_created then
    if p_email is not null then insert into public.contact_identities(tenant_id,contact_id,kind,normalized_value) values(p_tenant_id,contact_uuid,'email',p_email); end if;
    if p_phone is not null then insert into public.contact_identities(tenant_id,contact_id,kind,normalized_value) values(p_tenant_id,contact_uuid,'phone',p_phone); end if;
  end if;
  return jsonb_build_object('id',contact_uuid,'created',was_created);
end $$;
revoke all on function public.save_contact(uuid,uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.save_contact(uuid,uuid,text,text,text) to service_role;

-- Preserve the operational hardening already applied without exposing a trigger function.
do $$ begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    revoke execute on function public.rls_auto_enable() from public,anon,authenticated;
  end if;
end $$;
comment on table public.contacts is 'Tenant-isolated contacts. Manual registration is not marketing consent.';
comment on table public.messages is 'Persisted connector history; text-only rendering, tenant/connection FK and provider idempotency key.';
comment on table public.channel_sync_state is 'Future provider-specific incremental sync checkpoints, not credentials.';
comment on table public.platform_audit_events is 'Administrative role/status changes without passwords, tokens or customer message bodies.';
