import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createGoogleStore } from '../../services/monitor-api/google-store.mjs'

function writerFixture(respond = () => ({ data: null, error: null })) {
  const calls = []
  const writer = {
    rpc(name, parameters) {
      const call = { rpc: name, parameters }; calls.push(call)
      return Promise.resolve(respond(call))
    },
    from(table) {
      const call = { table, operations: [] }; calls.push(call)
      const query = {}
      for (const name of ['select', 'eq', 'delete', 'limit', 'maybeSingle']) {
        query[name] = (...args) => { call.operations.push([name, ...args]); return query }
      }
      query.then = (resolve, reject) => Promise.resolve(respond(call)).then(resolve, reject)
      return query
    }
  }
  return { store: createGoogleStore(writer), calls }
}

test('Google persistence asserts roles from service-owned tables, never metadata claims', async () => {
  const denied = writerFixture()
  await assert.rejects(() => denied.store.assertPlatformAdmin('verified-user'), { code: 'ADMIN_REQUIRED' })
  await assert.rejects(() => denied.store.assertMember('tenant-id', 'verified-user'), { code: 'TENANT_DENIED' })
  assert.deepEqual(denied.calls[0].operations, [['select', 'user_id'], ['eq', 'user_id', 'verified-user'], ['maybeSingle']])
  const member = writerFixture(() => ({ data: { role: 'member' }, error: null }))
  await member.store.assertMember('tenant-id', 'verified-user')
  await assert.rejects(() => member.store.assertMember('tenant-id', 'verified-user', true), { code: 'TENANT_ADMIN_REQUIRED' })
  assert.deepEqual(member.calls[0].operations.slice(1, 3), [['eq', 'tenant_id', 'tenant-id'], ['eq', 'user_id', 'verified-user']])
})

test('schema probe handles missing migration/grants and verifies columns without loading private rows', async () => {
  for (const code of ['42P01', '42883', 'PGRST202', '42501']) {
    const f = writerFixture(() => ({ error: { code, message: 'private database diagnostics' } }))
    assert.deepEqual(await f.store.inspect(), { schemaAvailable: false, enabled: false })
  }
  const f = writerFixture(call => ({ data: call.rpc ? { schema_version: 1, enabled: false } : [], error: null }))
  assert.equal((await f.store.inspect()).schemaAvailable, true)
  assert.equal(f.calls.length, 4)
  for (const call of f.calls.filter(call => call.table)) assert.deepEqual(call.operations.at(-1), ['limit', 0])
  const failed = writerFixture(() => ({ error: { code: 'NETWORK_FAILURE', message: 'sensitive connection string' } }))
  await assert.rejects(() => failed.store.inspect(), error => error.code === 'GOOGLE_STORAGE_UNAVAILABLE' && !error.message.includes('sensitive'))
})

test('single-use attempts and disconnect use atomic RPCs with verified tenant/user binding', async () => {
  const f = writerFixture(call => ({ data: call.rpc === 'google_oauth_consume' ? [{ state_hash: 'hash' }] : true, error: null }))
  await f.store.beginAttempt({ tenant_id: 'tenant', user_id: 'verified-user', state_hash: 'hash', browser_hash: 'browser', previous_browser_hash: null, verifier_envelope: { v: 1 } })
  assert.equal((await f.store.consumeAttempt('hash', 'browser')).state_hash, 'hash')
  await f.store.finishAttempt({ tenant_id: 'tenant', user_id: 'verified-user', state_hash: 'hash' }, { token_envelope: { v: 1 }, scopes: ['synthetic'], expires_at: 'synthetic' })
  await f.store.disconnect('tenant', 'verified-user')
  assert.deepEqual(f.calls.map(call => call.rpc), ['google_oauth_begin', 'google_oauth_consume', 'google_oauth_finish', 'google_connection_disconnect'])
  assert.deepEqual(f.calls[1].parameters, { p_state_hash: 'hash', p_browser_hash: 'browser' })
  assert.equal(f.calls[2].parameters.p_user_id, 'verified-user')
  assert.deepEqual(f.calls[3].parameters, { p_tenant_id: 'tenant', p_user_id: 'verified-user' })
})

test('connection reads are tenant scoped; refresh uses compare-and-swap rather than upsert', async () => {
  const f = writerFixture(() => ({ data: true, error: null }))
  await f.store.readConnection('only-this-tenant')
  assert.ok(f.calls[0].operations.some(operation => operation[0] === 'eq' && operation[1] === 'tenant_id' && operation[2] === 'only-this-tenant'))
  assert.equal(await f.store.updateConnection('tenant', 'verified-user', 'old-revision', { status: 'needs_reconnect' }), true)
  assert.equal(f.calls[1].rpc, 'google_connection_update')
  assert.equal(f.calls[1].parameters.p_revision, 'old-revision')
  assert.equal(f.calls[1].parameters.p_actor_id, 'verified-user')
  assert.equal(f.calls[1].parameters.p_token_envelope, null)
  assert.equal(f.calls[1].parameters.p_returning_resources, false)
  await f.store.updateConnection('tenant', 'verified-user', 'old-revision', { status: 'needs_reconnect', returning_resources: true })
  assert.equal(f.calls[2].parameters.p_returning_resources, true)
  assert.equal(f.calls[2].parameters.p_status, 'needs_reconnect')
})

test('active OAuth transaction rejection is a sanitized retryable conflict for authorize and disconnect', async () => {
  const f = writerFixture(() => ({ error: { message: 'GOOGLE_OAUTH_IN_PROGRESS', details: 'private transaction diagnostics' } }))
  for (const operation of [() => f.store.beginAttempt({}), () => f.store.disconnect('tenant', 'verified-user')]) {
    await assert.rejects(operation, error => error.status === 409 && error.code === 'GOOGLE_OAUTH_IN_PROGRESS'
      && /Aguarde e tente novamente/.test(error.message) && !error.message.includes('private'))
  }
})

test('migration source has explicit service-only grants, RLS and transactional replay/concurrency guards (not a live DB test)', () => {
  const sql = readFileSync(new URL('../../supabase/migrations/20261015171734_google_tenant_oauth.sql', import.meta.url), 'utf8')
  for (const table of ['google_data_configuration', 'google_data_configuration_audit', 'google_oauth_attempts', 'google_tenant_connections']) {
    assert.ok(sql.includes(`alter table public.${table} enable row level security;`))
    assert.ok(sql.includes(`alter table public.${table} force row level security;`))
  }
  assert.match(sql, /from public, anon, authenticated;/)
  assert.doesNotMatch(sql, /security\s+definer/i)
  assert.doesNotMatch(sql, /grant\s+[^;]+\s+to\s+(?:anon|authenticated|public)\s*;/i)
  const functions = [...sql.matchAll(/create function public\.(\w+)\(/g)].map(match => match[1])
  assert.equal(functions.length, 7)
  for (const name of functions) {
    assert.ok(sql.includes(`revoke all on function public.${name}(`))
    assert.match(sql, new RegExp(`grant execute on function public\\.${name}\\([^;]+ to service_role;`))
  }
  assert.match(sql, /enabled boolean not null default false/)
  assert.match(sql, /consumed_at is null and invalidated_at is null and expires_at > clock_timestamp\(\)/)
  assert.match(sql, /browser_hash = p_browser_hash/)
  assert.match(sql, /where tenant_id = p_tenant_id and revision = p_revision/)
  assert.match(sql, /delete from public.google_oauth_attempts where tenant_id = p_tenant_id/)
  assert.match(sql, /role in \('owner', 'admin'\) for share/)
  assert.match(sql, /interval '10 minutes'/)
  assert.match(sql, /^begin;/)
  assert.match(sql, /commit;\s*$/)
})

test('SQL serialization protects consumed callbacks through expiry/disable and gates every resource-returning update', () => {
  const sql = readFileSync(new URL('../../supabase/migrations/20261015171734_google_tenant_oauth.sql', import.meta.url), 'utf8')
  const functions = Object.fromEntries([...sql.matchAll(/create function public\.(\w+)\(([\s\S]*?)\$\$;/g)].map(match => [match[1], match[2]]))
  const consume = functions.google_oauth_consume
  const consumeLock = consume.indexOf('id = attempt_tenant for update')
  assert.ok(consumeLock >= 0 && consumeLock < consume.indexOf('return query update'))
  assert.match(consume, /state_hash = p_state_hash and browser_hash = p_browser_hash and tenant_id = attempt_tenant/)
  const disconnect = functions.google_connection_disconnect
  const disconnectLock = disconnect.indexOf('id = p_tenant_id for update')
  const rejection = disconnect.indexOf("raise exception 'GOOGLE_OAUTH_IN_PROGRESS'")
  assert.ok(disconnectLock >= 0 && rejection > disconnectLock)
  assert.ok(rejection < disconnect.indexOf('delete from public.google_oauth_attempts'))
  assert.ok(rejection < disconnect.indexOf('delete from public.google_tenant_connections'))
  const activeGuard = /if exists \(select 1 from public\.google_oauth_attempts where tenant_id = p_tenant_id and consumed_at is not null\) then/
  assert.match(disconnect, activeGuard) // no expires_at/invalidated_at exception
  assert.match(functions.google_oauth_begin, activeGuard)
  assert.match(functions.google_oauth_begin, /order by id for update/)
  assert.match(functions.google_oauth_begin, /expires_at <= clock_timestamp\(\) and consumed_at is null/)
  assert.match(functions.google_oauth_begin, /limit 1000\)\s+and consumed_at is null;/)
  const disable = functions.google_data_set_enabled
  assert.match(disable, /set invalidated_at = coalesce\(invalidated_at, clock_timestamp\(\)\)/)
  assert.match(disable, /delete from public\.google_oauth_attempts where consumed_at is null;/)
  assert.doesNotMatch(disable, /delete from public\.google_tenant_connections/)
  assert.match(functions.google_oauth_finish, /consumed_at is not null\s+and invalidated_at is null and expires_at > clock_timestamp\(\)/)
  const update = functions.google_connection_update
  assert.match(update, /p_returning_resources boolean default false/)
  assert.match(update, /if p_status = 'connected' or coalesce\(p_returning_resources, false\) then\s+perform 1 from public\.tenant_members\s+where tenant_id = p_tenant_id and user_id = authorizer and role in \('owner', 'admin'\) for share;/)
  for (const verb of ['revoke all on', 'grant execute on']) {
    assert.ok(sql.includes(`${verb} function public.google_connection_update(uuid, uuid, uuid, text, jsonb, timestamptz, timestamptz, boolean)`))
  }
})
