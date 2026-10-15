begin;

-- Separate from channel catalog and Supabase login. Only the private VPS
-- service can access these objects; no browser role receives a table/RPC grant.
create table public.google_data_configuration (
  singleton boolean primary key default true check (singleton),
  enabled boolean not null default false,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);
insert into public.google_data_configuration(singleton, enabled) values (true, false);
create index google_data_configuration_actor_idx on public.google_data_configuration(updated_by);

create table public.google_data_configuration_audit (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  enabled boolean not null,
  changed_at timestamptz not null default now()
);
create index google_data_audit_actor_idx on public.google_data_configuration_audit(actor_user_id);
create index google_data_audit_time_idx on public.google_data_configuration_audit(changed_at);

create table public.google_oauth_attempts (
  state_hash text primary key check (state_hash ~ '^[0-9a-f]{64}$'),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  browser_hash text not null check (browser_hash ~ '^[0-9a-f]{64}$'),
  verifier_envelope jsonb not null check (jsonb_typeof(verifier_envelope) = 'object' and octet_length(verifier_envelope::text) <= 4096),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '10 minutes'),
  consumed_at timestamptz,
  invalidated_at timestamptz,
  unique(tenant_id, user_id),
  check (expires_at > created_at and expires_at <= created_at + interval '10 minutes')
);
create index google_oauth_attempts_user_idx on public.google_oauth_attempts(user_id);
create index google_oauth_attempts_browser_idx on public.google_oauth_attempts(browser_hash);
create index google_oauth_attempts_expiry_idx on public.google_oauth_attempts(expires_at);

create table public.google_tenant_connections (
  tenant_id uuid primary key references public.tenants(id) on delete cascade,
  authorized_by uuid not null references auth.users(id) on delete cascade,
  revision uuid not null default gen_random_uuid(),
  status text not null check (status in ('connected', 'needs_reconnect')),
  token_envelope jsonb not null check (jsonb_typeof(token_envelope) = 'object' and octet_length(token_envelope::text) <= 65536),
  scopes text[] not null check (scopes = array['https://www.googleapis.com/auth/analytics.readonly', 'https://www.googleapis.com/auth/webmasters.readonly']::text[]),
  expires_at timestamptz not null,
  connected_at timestamptz not null default now(),
  last_checked_at timestamptz
);
create index google_connections_authorizer_idx on public.google_tenant_connections(authorized_by);

alter table public.google_data_configuration enable row level security;
alter table public.google_data_configuration force row level security;
alter table public.google_data_configuration_audit enable row level security;
alter table public.google_data_configuration_audit force row level security;
alter table public.google_oauth_attempts enable row level security;
alter table public.google_oauth_attempts force row level security;
alter table public.google_tenant_connections enable row level security;
alter table public.google_tenant_connections force row level security;
revoke all on public.google_data_configuration, public.google_data_configuration_audit,
  public.google_oauth_attempts, public.google_tenant_connections from public, anon, authenticated, service_role;
-- Clear legacy default grants for the service too before granting the exact
-- operations below (configuration is not deletable; audit is append-only).
grant select, update on public.google_data_configuration to service_role;
grant select, insert on public.google_data_configuration_audit to service_role;
grant select, insert, update, delete on public.google_oauth_attempts, public.google_tenant_connections to service_role;

create function public.google_data_status()
returns jsonb language sql stable security invoker set search_path = '' as $$
  select jsonb_build_object('schema_version', 1, 'enabled', enabled,
    'updated_at', updated_at, 'updated_by', updated_by)
  from public.google_data_configuration where singleton = true;
$$;

create function public.google_data_set_enabled(p_user_id uuid, p_enabled boolean)
returns void language plpgsql security invoker set search_path = '' as $$
begin
  perform 1 from public.platform_administrators where user_id = p_user_id for share;
  if not found then raise exception 'GOOGLE_ADMIN_REQUIRED'; end if;
  if p_enabled is null then raise exception 'GOOGLE_INVALID_INPUT'; end if;
  update public.google_data_configuration
    set enabled = p_enabled, updated_by = p_user_id, updated_at = now() where singleton = true;
  if not found then raise exception 'GOOGLE_SCHEMA_UNAVAILABLE'; end if;
  insert into public.google_data_configuration_audit(actor_user_id, enabled) values (p_user_id, p_enabled);
  -- Preserve consumed guards until the callback finishes. Expiry/disable must
  -- not allow disconnect to revoke while an external exchange is still running.
  if not p_enabled then
    update public.google_oauth_attempts set invalidated_at = coalesce(invalidated_at, clock_timestamp())
      where consumed_at is not null;
    delete from public.google_oauth_attempts where consumed_at is null;
  end if;
end;
$$;

create function public.google_oauth_begin(p_tenant_id uuid, p_user_id uuid,
  p_state_hash text, p_browser_hash text, p_previous_browser_hash text, p_verifier_envelope jsonb)
returns void language plpgsql security invoker set search_path = '' as $$
begin
  perform 1 from public.google_data_configuration where singleton = true and enabled for share;
  if not found then raise exception 'GOOGLE_DISABLED'; end if;
  -- Lock this tenant and the previous browser's tenant in UUID order before
  -- replacing consent. Consumption of that previous flow cannot slip between
  -- its invalidation and deletion. No network calls inside transactions.
  perform 1 from public.tenants where id = p_tenant_id or id in
    (select tenant_id from public.google_oauth_attempts
      where p_previous_browser_hash is not null and browser_hash = p_previous_browser_hash)
    order by id for update;
  perform 1 from public.tenant_members
    where tenant_id = p_tenant_id and user_id = p_user_id and role in ('owner', 'admin') for share;
  if not found then raise exception 'GOOGLE_TENANT_ADMIN_REQUIRED'; end if;
  if exists (select 1 from public.google_oauth_attempts where tenant_id = p_tenant_id and consumed_at is not null) then
    raise exception 'GOOGLE_OAUTH_IN_PROGRESS';
  end if;
  delete from public.google_oauth_attempts where state_hash in
    (select state_hash from public.google_oauth_attempts
      where expires_at <= clock_timestamp() and consumed_at is null order by expires_at limit 1000)
    and consumed_at is null;
  -- A new browser flow can invalidate an exchange in another tenant, but never
  -- erase its disconnect guard. Only that callback can release the guard.
  update public.google_oauth_attempts set invalidated_at = coalesce(invalidated_at, clock_timestamp())
    where p_previous_browser_hash is not null and browser_hash = p_previous_browser_hash and consumed_at is not null;
  delete from public.google_oauth_attempts
    where ((tenant_id = p_tenant_id and user_id = p_user_id)
      or (p_previous_browser_hash is not null and browser_hash = p_previous_browser_hash)) and consumed_at is null;
  insert into public.google_oauth_attempts(state_hash, tenant_id, user_id, browser_hash, verifier_envelope)
    values(p_state_hash, p_tenant_id, p_user_id, p_browser_hash, p_verifier_envelope);
end;
$$;

create function public.google_oauth_consume(p_state_hash text, p_browser_hash text)
returns setof public.google_oauth_attempts
language plpgsql security invoker set search_path = '' as $$
declare attempt_tenant uuid;
begin
  select tenant_id into attempt_tenant from public.google_oauth_attempts
    where state_hash = p_state_hash and browser_hash = p_browser_hash;
  if not found then return; end if;
  perform 1 from public.google_data_configuration where singleton = true and enabled for share;
  if not found then return; end if;
  -- Same tenant lock as begin/finish/disconnect: either disconnect cancels an
  -- unconsumed row first, or consumption wins and disconnect must return 409.
  perform 1 from public.tenants where id = attempt_tenant for update;
  if exists (select 1 from public.google_oauth_attempts where tenant_id = attempt_tenant and consumed_at is not null) then return; end if;
  return query update public.google_oauth_attempts set consumed_at = clock_timestamp()
    where state_hash = p_state_hash and browser_hash = p_browser_hash and tenant_id = attempt_tenant
      and consumed_at is null and invalidated_at is null and expires_at > clock_timestamp()
    returning *;
end;
$$;

create function public.google_oauth_finish(p_state_hash text, p_tenant_id uuid, p_user_id uuid,
  p_token_envelope jsonb, p_scopes text[], p_expires_at timestamptz)
returns boolean language plpgsql security invoker set search_path = '' as $$
begin
  perform 1 from public.google_data_configuration where singleton = true and enabled for share;
  if not found then return false; end if;
  perform 1 from public.tenants where id = p_tenant_id for update;
  perform 1 from public.tenant_members
    where tenant_id = p_tenant_id and user_id = p_user_id and role in ('owner', 'admin') for share;
  if not found then return false; end if;
  -- Disabled/replaced/expired attempts cannot persist even after re-enabling.
  -- A rejected consumed row remains a guard until the callback's final cleanup.
  delete from public.google_oauth_attempts where state_hash = p_state_hash
    and tenant_id = p_tenant_id and user_id = p_user_id and consumed_at is not null
    and invalidated_at is null and expires_at > clock_timestamp();
  if not found then return false; end if;
  if p_expires_at <= now() or p_expires_at > now() + interval '1 day' then raise exception 'GOOGLE_INVALID_INPUT'; end if;
  insert into public.google_tenant_connections(tenant_id, authorized_by, status, token_envelope, scopes, expires_at)
    values (p_tenant_id, p_user_id, 'connected', p_token_envelope, p_scopes, p_expires_at)
    on conflict(tenant_id) do update set authorized_by = excluded.authorized_by,
      revision = gen_random_uuid(), status = 'connected', token_envelope = excluded.token_envelope,
      scopes = excluded.scopes, expires_at = excluded.expires_at, connected_at = now(), last_checked_at = null;
  return true;
end;
$$;

create function public.google_connection_update(p_tenant_id uuid, p_actor_id uuid, p_revision uuid,
  p_status text, p_token_envelope jsonb, p_expires_at timestamptz, p_checked_at timestamptz,
  p_returning_resources boolean default false)
returns boolean language plpgsql security invoker set search_path = '' as $$
declare authorizer uuid;
begin
  perform 1 from public.google_data_configuration where singleton = true and enabled for share;
  if not found then return false; end if;
  perform 1 from public.tenants where id = p_tenant_id for update;
  perform 1 from public.tenant_members
    where tenant_id = p_tenant_id and user_id = p_actor_id and role in ('owner', 'admin') for share;
  if not found then raise exception 'GOOGLE_TENANT_ADMIN_REQUIRED'; end if;
  select authorized_by into authorizer from public.google_tenant_connections
    where tenant_id = p_tenant_id and revision = p_revision;
  if not found then return false; end if;
  -- Marking needs_reconnect may be necessary after authorizer loss. Returning
  -- observations always requires that author's current role, including partials.
  if p_status = 'connected' or coalesce(p_returning_resources, false) then
    perform 1 from public.tenant_members
      where tenant_id = p_tenant_id and user_id = authorizer and role in ('owner', 'admin') for share;
    if not found then return false; end if;
  end if;
  update public.google_tenant_connections set status = p_status,
    token_envelope = coalesce(p_token_envelope, token_envelope),
    expires_at = coalesce(p_expires_at, expires_at), last_checked_at = coalesce(p_checked_at, last_checked_at),
    revision = gen_random_uuid()
    where tenant_id = p_tenant_id and revision = p_revision;
  return found;
end;
$$;

create function public.google_connection_disconnect(p_tenant_id uuid, p_user_id uuid)
returns setof public.google_tenant_connections
language plpgsql security invoker set search_path = '' as $$
begin
  perform 1 from public.tenants where id = p_tenant_id for update;
  perform 1 from public.tenant_members
    where tenant_id = p_tenant_id and user_id = p_user_id and role in ('owner', 'admin') for share;
  if not found then raise exception 'GOOGLE_TENANT_ADMIN_REQUIRED'; end if;
  -- Deliberately no expiry predicate: an expired/invalidated consent can still
  -- be awaiting a token response. A crashed callback requires reconciliation;
  -- a wall-clock expiry alone is not proof that its exchange has stopped.
  if exists (select 1 from public.google_oauth_attempts where tenant_id = p_tenant_id and consumed_at is not null) then
    raise exception 'GOOGLE_OAUTH_IN_PROGRESS';
  end if;
  delete from public.google_oauth_attempts where tenant_id = p_tenant_id;
  return query delete from public.google_tenant_connections where tenant_id = p_tenant_id returning *;
end;
$$;

revoke all on function public.google_data_status() from public, anon, authenticated;
revoke all on function public.google_data_set_enabled(uuid, boolean) from public, anon, authenticated;
revoke all on function public.google_oauth_begin(uuid, uuid, text, text, text, jsonb) from public, anon, authenticated;
revoke all on function public.google_oauth_consume(text, text) from public, anon, authenticated;
revoke all on function public.google_oauth_finish(text, uuid, uuid, jsonb, text[], timestamptz) from public, anon, authenticated;
revoke all on function public.google_connection_update(uuid, uuid, uuid, text, jsonb, timestamptz, timestamptz, boolean) from public, anon, authenticated;
revoke all on function public.google_connection_disconnect(uuid, uuid) from public, anon, authenticated;
grant execute on function public.google_data_status() to service_role;
grant execute on function public.google_data_set_enabled(uuid, boolean) to service_role;
grant execute on function public.google_oauth_begin(uuid, uuid, text, text, text, jsonb) to service_role;
grant execute on function public.google_oauth_consume(text, text) to service_role;
grant execute on function public.google_oauth_finish(text, uuid, uuid, jsonb, text[], timestamptz) to service_role;
grant execute on function public.google_connection_update(uuid, uuid, uuid, text, jsonb, timestamptz, timestamptz, boolean) to service_role;
grant execute on function public.google_connection_disconnect(uuid, uuid) to service_role;

comment on table public.google_tenant_connections is 'Private Google OAuth data connection per tenant. AES-GCM ciphertext only; VPS owns the key. Not a login identity.';
comment on table public.google_oauth_attempts is '10-minute single-use state hashes bound to tenant, user and HttpOnly browser nonce. Encrypted PKCE verifier. Only unconsumed expired rows are pruned; consumed guards survive expiry/invalidation until callback cleanup.';
comment on table public.google_data_configuration is 'Global feature switch, initially false. Enabling records actor/time; does not certify external Google APIs.';
commit;
