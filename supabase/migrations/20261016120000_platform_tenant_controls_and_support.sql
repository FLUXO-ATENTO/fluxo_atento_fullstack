-- Platform control plane and tenant support. The browser has no direct table
-- access: the VPS API validates the Supabase identity and the relevant role.
grant usage on schema private to service_role;
create table public.platform_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (length(trim(name)) between 1 and 80),
  price_cents integer not null default 0 check (price_cents between 0 and 100000000),
  billing_interval text not null default 'monthly' check (billing_interval in ('monthly', 'yearly')),
  max_users integer check (max_users between 1 and 100000),
  max_connections integer check (max_connections between 1 and 100000),
  gallery_storage_mb integer not null default 0 check (gallery_storage_mb between 0 and 1000000),
  trial_days integer not null default 0 check (trial_days between 0 and 365),
  features text[] not null default '{}',
  audience text not null default 'selected' check (audience in ('global', 'selected')),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (features <@ array['monitoring','google_data','whatsapp_waba','email_smtp','campaigns','bulk_send','gallery','auto_responses','ai_copilot']::text[])
);

create table public.platform_plan_targets (
  plan_id uuid not null references public.platform_plans(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  primary key (plan_id, tenant_id)
);
create index platform_plan_targets_tenant_idx on public.platform_plan_targets(tenant_id, plan_id);

-- Plan plus selected audience is saved in one transaction. A draft can have
-- no targets; a published selected plan must name at least one real tenant.
create function public.save_platform_plan(
  p_actor_id uuid, p_plan_id uuid, p_name text, p_price_cents integer,
  p_billing_interval text, p_max_users integer, p_max_connections integer,
  p_gallery_storage_mb integer, p_trial_days integer, p_features text[],
  p_audience text, p_status text, p_target_tenant_ids uuid[]
) returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare saved_id uuid;
begin
  if not exists (select 1 from public.platform_administrators where user_id = p_actor_id) then
    raise exception 'PLATFORM_ADMIN_REQUIRED';
  end if;
  if p_target_tenant_ids is null or cardinality(p_target_tenant_ids) > 100
    or (p_audience = 'global' and cardinality(p_target_tenant_ids) <> 0)
    or (p_audience = 'selected' and p_status = 'published' and cardinality(p_target_tenant_ids) = 0)
    or (select count(*) from public.tenants where id = any(p_target_tenant_ids)) <> cardinality(p_target_tenant_ids) then
    raise exception 'INVALID_PLAN_TARGETS';
  end if;
  if p_plan_id is not null and p_audience = 'selected' and exists (
    select 1 from public.tenant_controls
    where plan_id = p_plan_id and not (tenant_id = any(p_target_tenant_ids))
  ) then raise exception 'PLAN_STILL_ASSIGNED'; end if;
  if p_plan_id is null then
    insert into public.platform_plans(name,price_cents,billing_interval,max_users,max_connections,
      gallery_storage_mb,trial_days,features,audience,status,created_by)
    values (trim(p_name),p_price_cents,p_billing_interval,p_max_users,p_max_connections,
      p_gallery_storage_mb,p_trial_days,p_features,p_audience,p_status,p_actor_id)
    returning id into saved_id;
  else
    update public.platform_plans set name=trim(p_name),price_cents=p_price_cents,
      billing_interval=p_billing_interval,max_users=p_max_users,max_connections=p_max_connections,
      gallery_storage_mb=p_gallery_storage_mb,trial_days=p_trial_days,features=p_features,
      audience=p_audience,status=p_status,updated_at=now()
    where id=p_plan_id returning id into saved_id;
    if saved_id is null then raise exception 'PLAN_NOT_FOUND'; end if;
  end if;
  delete from public.platform_plan_targets where plan_id=saved_id;
  if cardinality(p_target_tenant_ids) > 0 then
    insert into public.platform_plan_targets(plan_id,tenant_id)
    select saved_id, target_id from unnest(p_target_tenant_ids) as target_id;
  end if;
  return saved_id;
end;
$$;
revoke all on function public.save_platform_plan(uuid,uuid,text,integer,text,integer,integer,integer,integer,text[],text,text,uuid[]) from public, anon, authenticated, service_role;
grant execute on function public.save_platform_plan(uuid,uuid,text,integer,text,integer,integer,integer,integer,text[],text,text,uuid[]) to service_role;

create table public.tenant_controls (
  tenant_id uuid primary key references public.tenants(id) on delete cascade,
  identifier text unique check (identifier is null or identifier ~ '^[a-z0-9][a-z0-9-]{2,62}$'),
  status text not null default 'active' check (status in ('active', 'paused')),
  plan_id uuid references public.platform_plans(id) on delete set null,
  max_users integer check (max_users between 1 and 100000),
  max_connections integer check (max_connections between 1 and 100000),
  gallery_storage_mb integer not null default 0 check (gallery_storage_mb between 0 and 1000000),
  trial_days integer not null default 0 check (trial_days between 0 and 365),
  allowed_channels text[] not null default array['whatsapp_waba','email_smtp']::text[],
  channel_limits jsonb not null default '{}'::jsonb check (jsonb_typeof(channel_limits) = 'object'),
  provider_mode text not null default 'platform' check (provider_mode in ('platform', 'tenant')),
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  check (allowed_channels <@ array['whatsapp_waba','email_smtp']::text[])
);
create index tenant_controls_plan_idx on public.tenant_controls(plan_id);

-- Serialize connection creation for a tenant. The API check provides a useful
-- message; this trigger closes the concurrent-request gap at the database.
create function private.enforce_connection_controls()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare policy_row public.tenant_controls%rowtype;
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(new.tenant_id::text, 4));
  select * into policy_row from public.tenant_controls where tenant_id = new.tenant_id;
  if found then
    if policy_row.status <> 'active' then raise exception 'TENANT_PAUSED'; end if;
    if not (new.channel = any(policy_row.allowed_channels))
      or policy_row.channel_limits ->> new.channel = '0' then raise exception 'CHANNEL_DISABLED'; end if;
    if policy_row.max_connections is not null
      and not exists (select 1 from public.tenant_channel_connections where tenant_id = new.tenant_id and channel = new.channel)
      and (select count(*) from public.tenant_channel_connections where tenant_id = new.tenant_id) >= policy_row.max_connections then
      raise exception 'CONNECTION_LIMIT';
    end if;
  end if;
  return new;
end;
$$;
revoke all on function private.enforce_connection_controls() from public, anon, authenticated, service_role;
grant execute on function private.enforce_connection_controls() to service_role;
create trigger tenant_connection_controls before insert or update on public.tenant_channel_connections
  for each row execute function private.enforce_connection_controls();

-- A gateway preference is not a payment integration. No credentials, payment
-- status, invoices or entitlement activation are stored in this row.
create table public.platform_billing_settings (
  singleton boolean primary key default true check (singleton),
  gateway text not null default 'none' check (gateway in ('none', 'stripe', 'mercado_pago')),
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);
insert into public.platform_billing_settings(singleton) values(true);

-- One private support channel per tenant. Users in the tenant may participate;
-- only platform administrators may reply from the platform side.
create table public.support_threads (
  tenant_id uuid primary key references public.tenants(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.support_messages (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.support_threads(tenant_id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete restrict,
  sender_platform boolean not null,
  body text not null check (length(trim(body)) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index support_messages_tenant_time_idx on public.support_messages(tenant_id, created_at desc, id desc);

alter table public.platform_plans enable row level security;
alter table public.platform_plans force row level security;
alter table public.platform_plan_targets enable row level security;
alter table public.platform_plan_targets force row level security;
alter table public.tenant_controls enable row level security;
alter table public.tenant_controls force row level security;
alter table public.platform_billing_settings enable row level security;
alter table public.platform_billing_settings force row level security;
alter table public.support_threads enable row level security;
alter table public.support_threads force row level security;
alter table public.support_messages enable row level security;
alter table public.support_messages force row level security;

revoke all on public.platform_plans, public.platform_plan_targets, public.tenant_controls, public.platform_billing_settings,
  public.support_threads, public.support_messages from public, anon, authenticated, service_role;
grant select, insert, update on public.platform_plans to service_role;
grant select, insert, delete on public.platform_plan_targets to service_role;
grant select, insert, update on public.tenant_controls to service_role;
grant select, update on public.platform_billing_settings to service_role;
grant select, insert, update on public.support_threads to service_role;
grant select, insert on public.support_messages to service_role;

comment on table public.platform_plans is 'Commercial catalog, not payment state or an active entitlement by itself.';
comment on table public.tenant_controls is 'Platform-managed tenant policy; planned feature limits require their own enforcement before being presented as active.';
comment on table public.platform_billing_settings is 'Gateway preference only; no credentials or payments are stored here.';
comment on table public.support_messages is 'Tenant-scoped human support messages; never exposed by browser table grants.';
