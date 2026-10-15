import { randomUUID } from 'node:crypto'
import { readdir, readFile } from 'node:fs/promises'
import pg from 'pg'

export function validateTestDatabaseUrl(value, allowCreate) {
  if (allowCreate !== '1') throw new Error('Set FLUXO_TEST_DATABASE_ALLOW_CREATE=1 for a disposable local test cluster only.')
  let url
  try { url = new URL(value) } catch { throw new Error('FLUXO_TEST_DATABASE_URL must identify the disposable loopback database fluxo_test.') }
  if (!['postgres:', 'postgresql:'].includes(url.protocol)
      || !['127.0.0.1', '[::1]'].includes(url.hostname)
      || url.pathname !== '/fluxo_test' || url.search || url.hash
      || decodeURIComponent(url.username) !== 'postgres') {
    throw new Error('Refusing database tests: only postgres on literal loopback /fluxo_test, without URL options, is allowed.')
  }
  return url
}

export const scopes = [
  'https://www.googleapis.com/auth/analytics.readonly',
  'https://www.googleapis.com/auth/webmasters.readonly',
]

export const ids = {
  ownerA: '10000000-0000-4000-8000-000000000001',
  ownerB: '10000000-0000-4000-8000-000000000002',
  adminA: '10000000-0000-4000-8000-000000000003',
  memberA: '10000000-0000-4000-8000-000000000004',
  platform: '10000000-0000-4000-8000-000000000005',
  tenantA: '20000000-0000-4000-8000-000000000001',
  tenantB: '20000000-0000-4000-8000-000000000002',
}

// This is a real PostgreSQL test, not a running Supabase stack. The only
// Supabase-owned objects emulated here are roles, auth.users and auth.uid().
// Never link this harness to a cloud project or reuse a production connection.
export async function createDatabase(t, { legacyDefaults = false } = {}) {
  const rootUrl = validateTestDatabaseUrl(process.env.FLUXO_TEST_DATABASE_URL, process.env.FLUXO_TEST_DATABASE_ALLOW_CREATE)
  const root = new pg.Client({ connectionString: rootUrl.href, connectionTimeoutMillis: 5000 })
  await root.connect()
  const clients = []
  const databaseName = `fluxo_test_${process.pid}_${randomUUID().replaceAll('-', '')}`
  let created = false
  t.after(async () => {
    await Promise.all(clients.map(client => client.end()))
    try {
      // The name is generated here, never taken from env/user input. No FORCE:
      // an unexpected remaining connection must fail cleanup visibly.
      if (created) await root.query(`drop database "${databaseName}"`)
    } finally { await root.end() }
  })
  const existing = await root.query("select count(*)::int as count from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname in ('public','auth','private') and c.relkind in ('r','p','v','m','f')")
  if (existing.rows[0].count !== 0) throw new Error('Refusing database tests: fluxo_test control database is not empty.')
  await root.query(`do $$ begin
    if not exists(select 1 from pg_roles where rolname='anon') then create role anon nologin; end if;
    if not exists(select 1 from pg_roles where rolname='authenticated') then create role authenticated nologin; end if;
    if not exists(select 1 from pg_roles where rolname='service_role') then create role service_role nologin bypassrls; end if;
  end $$`)
  const roles = await root.query("select rolname,rolsuper,rolbypassrls,rolcanlogin from pg_roles where rolname=any($1)", [['anon', 'authenticated', 'service_role']])
  for (const role of roles.rows) {
    if (role.rolsuper || role.rolcanlogin || role.rolbypassrls !== (role.rolname === 'service_role')) throw new Error('Unexpected test role privileges; use a fresh disposable cluster.')
  }
  await root.query(`create database "${databaseName}"`)
  created = true
  const databaseUrl = new URL(rootUrl.href)
  databaseUrl.pathname = `/${databaseName}`
  async function connect(role = 'service_role', userId = null) {
    if (!['postgres', 'service_role', 'authenticated', 'anon'].includes(role)) throw new Error('Unsupported test role')
    const client = new pg.Client({ connectionString: databaseUrl.href, connectionTimeoutMillis: 5000 })
    await client.connect()
    clients.push(client)
    await client.query("set statement_timeout='10s'; set lock_timeout='8s'; set idle_in_transaction_session_timeout='15s'")
    await client.query(`set role ${role}`)
    await client.query("select set_config('request.jwt.claim.sub',$1,false), set_config('request.jwt.claims',$2,false)", [userId || '', JSON.stringify({ sub: userId, role })])
    return client
  }
  const admin = await connect('postgres')
  await admin.query(`
    grant usage on schema public to anon, authenticated, service_role;
    create schema auth;
    create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}'::jsonb);
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid;
    $$;
    grant usage on schema auth to anon, authenticated, service_role;
    grant execute on function auth.uid() to anon, authenticated, service_role;
  `)
  if (legacyDefaults) {
    await admin.query(`alter default privileges in schema public grant select,insert,update,delete on tables to anon,authenticated,service_role;
      alter default privileges in schema public grant execute on functions to anon,authenticated,service_role;`)
  }
  const migrationsUrl = new URL('../../supabase/migrations/', import.meta.url)
  for (const name of (await readdir(migrationsUrl)).filter(name => /^\d+_[a-z0-9_]+\.sql$/.test(name)).sort()) {
    await admin.query(await readFile(new URL(name, migrationsUrl), 'utf8'))
  }
  for (const [label, id] of Object.entries(ids).filter(([key]) => !key.startsWith('tenant'))) {
    await admin.query('insert into auth.users(id,email) values($1,$2)', [id, `${label.toLowerCase()}@example.test`])
  }
  await admin.query('insert into public.tenants(id,name,created_by) values($1,$2,$3),($4,$5,$6)', [ids.tenantA, 'Empresa A fictícia', ids.ownerA, ids.tenantB, 'Empresa B fictícia', ids.ownerB])
  for (const [tenant, user, role] of [[ids.tenantA, ids.ownerA, 'owner'], [ids.tenantA, ids.adminA, 'admin'], [ids.tenantA, ids.memberA, 'member'], [ids.tenantB, ids.ownerB, 'owner']]) {
    await admin.query('insert into public.tenant_members(tenant_id,user_id,role) values($1,$2,$3)', [tenant, user, role])
  }
  await admin.query('insert into public.platform_administrators(user_id) values($1)', [ids.platform])
  return { admin, connect, ids, scopes }
}
