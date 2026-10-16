import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { once } from 'node:events'
import { randomBytes, randomUUID } from 'node:crypto'
import { createHandler } from '../../services/monitor-api/app.mjs'
import { createGoogleService } from '../../services/monitor-api/google-service.mjs'
import { ApiError } from '../../services/monitor-api/errors.mjs'
import { GOOGLE_SCOPES, GOOGLE_CALLBACK_URL, GOOGLE_RETURN_URL, GOOGLE_COOKIE, googleConfigFromEnv,
  encryptGoogleSecret, decryptGoogleSecret, sha256, pkceChallenge, exactGoogleScopes, readOAuthCookie } from '../../services/monitor-api/google-crypto.mjs'

const tenant = '11111111-1111-4111-8111-111111111111'
const otherTenant = '22222222-2222-4222-8222-222222222222'
const owner = '33333333-3333-4333-8333-333333333333'
const member = '44444444-4444-4444-8444-444444444444'
const admin = '55555555-5555-4555-8555-555555555555'
const anotherOwner = '66666666-6666-4666-8666-666666666666'
const origin = 'https://app.fluxoatento.com.br'
const jsonHeaders = { 'Content-Type': 'application/json' }
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: jsonHeaders })
const post = (body = {}, headers = {}) => ({ method: 'POST', headers: { ...jsonHeaders, ...headers }, body: JSON.stringify(body) })
const deferred = () => {
  let resolve
  const promise = new Promise(done => { resolve = done })
  return { promise, resolve }
}
const inProgress = () => new ApiError(409, 'GOOGLE_OAUTH_IN_PROGRESS', 'Uma autorização Google está em andamento ou aguarda confirmação de término. Aguarde e tente novamente.')

// Synthetic SQL-contract adapter. These HTTP tests do NOT claim to run Postgres/RLS.
async function fixture(t, options = {}) {
  let time = Date.parse('2026-10-15T12:00:00Z')
  const now = () => time
  const env = { GOOGLE_INTEGRATION_CLIENT_ID: 'fixture-only.apps.googleusercontent.com',
    GOOGLE_INTEGRATION_CLIENT_SECRET: 'fixture-only-never-a-real-secret', GOOGLE_TOKEN_ENCRYPTION_KEY: randomBytes(32).toString('base64'),
    GOOGLE_OAUTH_REDIRECT_URL: GOOGLE_CALLBACK_URL, ...options.env }
  const config = googleConfigFromEnv(env)
  const memberships = new Map([[`${tenant}:${owner}`, 'owner'], [`${tenant}:${member}`, 'member'], [`${otherTenant}:${anotherOwner}`, 'owner']])
  const attempts = new Map(); const connections = new Map(); const audits = []; const calls = []
  const state = { enabled: options.enabled ?? true, schemaAvailable: options.schemaAvailable ?? true, callbacks: 0, saved: 0, inspections: 0 }
  // Model RPC transaction serialization, not PostgreSQL lock implementation.
  const tenantLocks = new Map()
  async function withTenant(tenantId, operation) {
    const previous = tenantLocks.get(tenantId) || Promise.resolve()
    const release = deferred()
    const current = previous.then(() => release.promise)
    tenantLocks.set(tenantId, current)
    await previous
    try { return await operation() } finally {
      release.resolve()
      if (tenantLocks.get(tenantId) === current) tenantLocks.delete(tenantId)
    }
  }
  function withTenants(ids, operation) {
    const ordered = [...new Set(ids)].sort()
    const acquire = index => index === ordered.length ? operation() : withTenant(ordered[index], () => acquire(index + 1))
    return acquire(0)
  }
  const googleStore = {
    async assertPlatformAdmin(userId) { if (userId !== admin) throw new ApiError(403, 'ADMIN_REQUIRED', 'Administração necessária.') },
    async assertMember(tenantId, userId, administrative = false) {
      const role = memberships.get(`${tenantId}:${userId}`)
      if (!role) throw new ApiError(403, 'TENANT_DENIED', 'Tenant não autorizado.')
      if (administrative && !['owner', 'admin'].includes(role)) throw new ApiError(403, 'TENANT_ADMIN_REQUIRED', 'Responsável necessário.')
    },
    async inspect() { state.inspections++; return { ...state, updated_at: audits.at(-1)?.at || null, updated_by: audits.at(-1)?.userId || null } },
    async setEnabled(userId, enabled) {
      await this.assertPlatformAdmin(userId)
      state.enabled = enabled; audits.push({ userId, enabled, at: new Date(now()).toISOString() })
      if (!enabled) for (const [key, value] of attempts) {
        if (value.consumed_at) value.invalidated_at ||= new Date(now()).toISOString()
        else attempts.delete(key)
      }
    },
    async beginAttempt(attempt) {
      const previousTenants = [...attempts.values()].filter(value => attempt.previous_browser_hash && value.browser_hash === attempt.previous_browser_hash).map(value => value.tenant_id)
      return withTenants([attempt.tenant_id, ...previousTenants], async () => {
        if (!state.enabled) throw new ApiError(409, 'GOOGLE_DISABLED', 'Desabilitado.')
        await this.assertMember(attempt.tenant_id, attempt.user_id, true)
        if ([...attempts.values()].some(value => value.tenant_id === attempt.tenant_id && value.consumed_at)) throw inProgress()
        for (const [key, value] of attempts) {
          const previousBrowser = attempt.previous_browser_hash && attempt.previous_browser_hash === value.browser_hash
          if (value.consumed_at) {
            if (previousBrowser) value.invalidated_at ||= new Date(now()).toISOString()
          } else if (Date.parse(value.expires_at) <= now() || (value.tenant_id === attempt.tenant_id && value.user_id === attempt.user_id) || previousBrowser) attempts.delete(key)
        }
        attempts.set(attempt.state_hash, { ...attempt, consumed_at: null, invalidated_at: null, expires_at: new Date(now() + 600000).toISOString() })
      })
    },
    async consumeAttempt(stateHash, browserHash) {
      const candidate = attempts.get(stateHash)
      if (!candidate) return null
      return withTenant(candidate.tenant_id, () => {
        const attempt = attempts.get(stateHash)
        if (!state.enabled || !attempt || attempt.browser_hash !== browserHash || attempt.invalidated_at || Date.parse(attempt.expires_at) <= now()
          || [...attempts.values()].some(value => value.tenant_id === candidate.tenant_id && value.consumed_at)) return null
        attempt.consumed_at = new Date(now()).toISOString()
        state.callbacks++
        return structuredClone(attempt)
      })
    },
    async discardAttempt(hash) { attempts.delete(hash) },
    async finishAttempt(attempt, connection) {
      return withTenant(attempt.tenant_id, () => {
        const row = attempts.get(attempt.state_hash)
        if (!state.enabled || !row?.consumed_at || row.invalidated_at || Date.parse(row.expires_at) <= now()
          || row.tenant_id !== attempt.tenant_id || row.user_id !== attempt.user_id
          || !['owner', 'admin'].includes(memberships.get(`${attempt.tenant_id}:${attempt.user_id}`))) return false
        connections.set(attempt.tenant_id, { ...connection, tenant_id: attempt.tenant_id, authorized_by: attempt.user_id,
          revision: randomUUID(), status: 'connected', connected_at: new Date(now()).toISOString(), last_checked_at: null })
        attempts.delete(attempt.state_hash); state.saved++
        return true
      })
    },
    async readConnection(tenantId) { return connections.has(tenantId) ? structuredClone(connections.get(tenantId)) : null },
    async updateConnection(tenantId, actorId, revision, changes) {
      return withTenant(tenantId, async () => {
        await this.assertMember(tenantId, actorId, true)
        const connection = connections.get(tenantId)
        if (!state.enabled || !connection || connection.revision !== revision) return false
        if ((changes.returning_resources || changes.status !== 'needs_reconnect')
          && !['owner', 'admin'].includes(memberships.get(`${tenantId}:${connection.authorized_by}`))) return false
        const { returning_resources, ...persisted } = changes
        Object.assign(connection, persisted, { revision: randomUUID() })
        return true
      })
    },
    async disconnect(tenantId, userId) {
      return withTenant(tenantId, async () => {
        await this.assertMember(tenantId, userId, true)
        if ([...attempts.values()].some(value => value.tenant_id === tenantId && value.consumed_at)) throw inProgress()
        for (const [key, value] of attempts) if (value.tenant_id === tenantId) attempts.delete(key)
        const connection = connections.get(tenantId) || null
        connections.delete(tenantId)
        return connection
      })
    }
  }
  const tokenBody = { access_token: 'fixture-access-only', refresh_token: 'fixture-refresh-only', token_type: 'Bearer',
    expires_in: 3600, scope: GOOGLE_SCOPES.join(' ') }
  async function defaultFetch(url, init) {
    if (url === 'https://oauth2.googleapis.com/token') return json({ ...tokenBody })
    if (url === 'https://oauth2.googleapis.com/revoke') return new Response('', { status: 200 })
    if (url.startsWith('https://analyticsadmin.googleapis.com/v1beta/accountSummaries?')) {
      return json({ accountSummaries: [{ displayName: 'Conta sintética', propertySummaries: [{ property: 'properties/123', displayName: 'GA4 de teste' }] }] })
    }
    if (url === 'https://www.googleapis.com/webmasters/v3/sites') return json({ siteEntry: [{ siteUrl: 'sc-domain:fixture.test', permissionLevel: 'siteOwner' }] })
    throw new Error('Unexpected outbound destination')
  }
  const fetchImpl = async (url, init) => {
    calls.push({ url, init })
    return options.fetchImpl ? options.fetchImpl(url, init, { defaultFetch, googleStore, memberships, attempts, connections, state, tokenBody }) : defaultFetch(url, init)
  }
  const google = createGoogleService({ store: googleStore, config, now, fetchImpl, timeoutMs: options.timeoutMs ?? 100, maxPages: options.maxPages, maxResources: options.maxResources })
  const tokenUsers = { 'fixture.owner': owner, 'fixture.member': member, 'fixture.admin': admin, 'fixture.other': anotherOwner }
  const store = {
    async authenticate(token) { if (!tokenUsers[token]) throw new ApiError(401, 'UNAUTHORIZED', 'Entre na sua conta.'); return { userId: tokenUsers[token], token } },
    async workspace(context, requested) {
      const selected = requested || (context.userId === anotherOwner ? otherTenant : tenant)
      await googleStore.assertMember(selected, context.userId)
      return { activeTenant: { id: selected, role: memberships.get(`${selected}:${context.userId}`) }, platformAdmin: context.userId === admin }
    },
    async tenantPolicy() { return { status: 'active', allowed_channels: ['whatsapp_waba', 'email_smtp'], max_connections: null, channel_limits: {} } },
    async list(context, tenantId) { return [{ id: 'monitor-fixture', tenant_id: tenantId, user_id: context.userId }] }
  }
  const server = createServer(createHandler({ store, google, allowedOrigins: [origin] }))
  server.listen(0, '127.0.0.1'); await once(server, 'listening')
  t.after(() => { server.closeAllConnections(); server.close() })
  const base = `http://127.0.0.1:${server.address().port}`
  const request = (path, init = {}) => fetch(base + path, { ...init, redirect: 'manual', headers: { Authorization: 'Bearer fixture.owner', ...init.headers } })
  async function start(headers = {}) {
    const response = await request('/v1/integrations/google/authorize', post({}, headers))
    assert.equal(response.status, 200)
    const body = await response.json()
    return { response, cookie: response.headers.get('set-cookie').split(';')[0], url: new URL(body.authorization_url) }
  }
  async function callback(attempt, extra = 'code=fixture-code', headers = {}) {
    return request(`/v1/integrations/google/callback?state=${attempt.url.searchParams.get('state')}&${extra}`,
      { headers: { Authorization: '', Cookie: attempt.cookie, ...headers } })
  }
  async function connect(headers = {}) {
    const attempt = await start(headers)
    const response = await callback(attempt)
    assert.equal(response.headers.get('location'), GOOGLE_RETURN_URL + '?google=connected')
    return attempt
  }
  return { request, start, callback, connect, env, config, google, googleStore, state, calls, attempts, connections, audits, memberships,
    advance: milliseconds => { time += milliseconds } }
}

test('Google admin endpoints reject non-superadmins and require a verified session', async t => {
  const { request, audits } = await fixture(t)
  for (const init of [{}, { method: 'PATCH', headers: jsonHeaders, body: '{"enabled":true}' }]) {
    assert.equal((await request('/v1/admin/google', init)).status, 403)
  }
  assert.equal((await request('/v1/admin/google', { headers: { Authorization: '' } })).status, 401)
  const response = await request('/v1/admin/google', { headers: { Authorization: 'Bearer fixture.admin' } })
  assert.equal(response.status, 200)
  assert.equal((await response.json()).external_apis_verified, false)
  assert.equal(audits.length, 0)
})

test('feature defaults off; status distinguishes local readiness from availability and external verification', async t => {
  const { request } = await fixture(t, { enabled: false })
  const status = await (await request('/v1/admin/google', { headers: { Authorization: 'Bearer fixture.admin' } })).json()
  assert.equal(status.enabled, false); assert.equal(status.ready, true); assert.equal(status.external_apis_verified, false)
  assert.deepEqual(status.scopes, GOOGLE_SCOPES); assert.equal(status.callback_url, GOOGLE_CALLBACK_URL)
  assert.equal((await request('/v1/integrations/google/authorize', post())).status, 409)
  assert.deepEqual(await (await request('/v1/integrations/google')).json(), { available: false, connection: null })
})

test('enabling requires all private configuration and available schema; changes audit actor and time', async t => {
  for (const options of [{ env: { GOOGLE_INTEGRATION_CLIENT_SECRET: '' } }, { env: { GOOGLE_TOKEN_ENCRYPTION_KEY: 'not-base64' } },
    { env: { GOOGLE_OAUTH_REDIRECT_URL: 'https://attacker.test/callback' } }, { schemaAvailable: false }]) {
    const f = await fixture(t, { enabled: false, ...options })
    const res = await f.request('/v1/admin/google', { method: 'PATCH', headers: { ...jsonHeaders, Authorization: 'Bearer fixture.admin' }, body: '{"enabled":true}' })
    assert.equal(res.status, options.schemaAvailable === false ? 503 : 409)
    assert.equal(f.audits.length, 0)
  }
  const f = await fixture(t, { enabled: false })
  const res = await f.request('/v1/admin/google', { method: 'PATCH', headers: { ...jsonHeaders, Authorization: 'Bearer fixture.admin' }, body: '{"enabled":true}' })
  assert.equal(res.status, 200); assert.equal((await res.json()).enabled, true)
  assert.equal(f.audits[0].userId, admin); assert.ok(f.audits[0].at)
})

test('Google bodies are strict: no browser credentials, identity, redirect or scope injection', async t => {
  const f = await fixture(t)
  for (const body of [{ tenant_id: otherTenant }, { client_secret: 'fixture-only' }, { redirect_uri: 'https://attacker.test' }, { scopes: ['gmail'] }]) {
    assert.equal((await f.request('/v1/integrations/google/authorize', post(body))).status, 400)
    assert.equal((await f.request('/v1/integrations/google/disconnect', post(body))).status, 400)
  }
  for (const body of [{}, { enabled: 'true' }, { enabled: true, client_secret: 'fixture-only' }]) {
    assert.equal((await f.request('/v1/admin/google', { ...post(body, { Authorization: 'Bearer fixture.admin' }), method: 'PATCH' })).status, 400)
  }
  assert.equal((await f.request('/v1/integrations/google/authorize', { method: 'POST', headers: jsonHeaders, body: '[]' })).status, 400)
  assert.equal((await f.request('/v1/integrations/google/authorize', { method: 'POST', body: '{}' })).status, 415)
  assert.equal(f.calls.length, 0); assert.equal(f.attempts.size, 0)
})

test('forged tenants and member writes/resource discovery fail; members may read their tenant status', async t => {
  const f = await fixture(t)
  for (const path of ['/v1/integrations/google', '/v1/integrations/google/resources']) {
    assert.equal((await f.request(path, { headers: { 'X-Fluxo-Tenant-Id': otherTenant } })).status, 403)
  }
  for (const path of ['/v1/integrations/google/authorize', '/v1/integrations/google/disconnect']) {
    assert.equal((await f.request(path, post({}, { Authorization: 'Bearer fixture.member' }))).status, 403)
  }
  assert.equal((await f.request('/v1/integrations/google/resources', { headers: { Authorization: 'Bearer fixture.member' } })).status, 403)
  assert.equal((await f.request('/v1/integrations/google', { headers: { Authorization: 'Bearer fixture.member' } })).status, 200)
  assert.equal(f.calls.length, 0)
})

test('credentialed CORS allows exact origins only and leaves monitors CORS/health intact', async t => {
  const { request } = await fixture(t)
  const preflight = await request('/v1/integrations/google/authorize', { method: 'OPTIONS', headers: { Origin: origin } })
  assert.equal(preflight.status, 204)
  assert.equal(preflight.headers.get('access-control-allow-credentials'), 'true')
  assert.equal(preflight.headers.get('access-control-allow-origin'), origin)
  assert.match(preflight.headers.get('access-control-allow-headers'), /X-Fluxo-Tenant-Id/)
  for (const badOrigin of ['https://evil.test', `${origin}.evil.test`, 'null']) {
    const denied = await request('/v1/integrations/google/authorize', post({}, { Origin: badOrigin }))
    assert.equal(denied.status, 403); assert.equal(denied.headers.get('access-control-allow-credentials'), null)
  }
  assert.equal((await request('/v1/health', { headers: { Authorization: '' } })).status, 200)
  const monitor = await request('/v1/monitors', { headers: { Origin: origin } })
  assert.equal(monitor.status, 200); assert.equal(monitor.headers.get('access-control-allow-credentials'), null)
})

test('authorization uses only two read-only scopes, PKCE S256 and a private, host-only 10-minute nonce', async t => {
  const f = await fixture(t)
  const attempt = await f.start({ Origin: origin })
  assert.equal(attempt.url.origin, 'https://accounts.google.com')
  assert.deepEqual(attempt.url.searchParams.get('scope').split(' '), GOOGLE_SCOPES)
  assert.equal(attempt.url.searchParams.get('include_granted_scopes'), 'false')
  assert.equal(attempt.url.searchParams.get('redirect_uri'), GOOGLE_CALLBACK_URL)
  assert.equal(attempt.url.searchParams.get('code_challenge_method'), 'S256')
  assert.equal(attempt.url.searchParams.get('access_type'), 'offline')
  assert.match(attempt.response.headers.get('set-cookie'), /Path=\/; Secure; HttpOnly; SameSite=Lax; Max-Age=600$/)
  assert.doesNotMatch(attempt.response.headers.get('set-cookie'), /Domain=/i)
  const saved = f.attempts.get(sha256(attempt.url.searchParams.get('state')))
  const secret = decryptGoogleSecret(f.config.encryptionKey, saved.verifier_envelope, { purpose: `pkce:${saved.state_hash}`, tenantId: tenant, userId: owner })
  assert.equal(pkceChallenge(secret.verifier), attempt.url.searchParams.get('code_challenge'))
  assert.doesNotMatch(JSON.stringify(saved), new RegExp(secret.verifier))
  assert.equal(saved.browser_hash, sha256(attempt.cookie.split('=')[1]))
  assert.equal(f.calls.length, 0)
})

test('callback without Bearer succeeds only with the bound state+cookie; consumes once and never exposes tokens', async t => {
  const f = await fixture(t)
  const attempt = await f.start()
  for (const Cookie of ['', `${GOOGLE_COOKIE}=${randomBytes(32).toString('base64url')}`, `${attempt.cookie}; ${attempt.cookie}`]) {
    const denied = await f.callback(attempt, 'code=fixture-code', { Cookie })
    assert.equal(denied.headers.get('location'), `${GOOGLE_RETURN_URL}?google=error`)
  }
  assert.equal(f.calls.length, 0); assert.equal(f.state.callbacks, 0)
  const response = await f.callback(attempt)
  assert.equal(response.status, 303); assert.equal(response.headers.get('location'), `${GOOGLE_RETURN_URL}?google=connected`)
  assert.match(response.headers.get('set-cookie'), /Max-Age=0$/)
  assert.equal(response.headers.get('cache-control'), 'no-store'); assert.equal(response.headers.get('referrer-policy'), 'no-referrer')
  const replay = await f.callback(attempt)
  assert.equal(replay.headers.get('location'), `${GOOGLE_RETURN_URL}?google=error`)
  assert.equal(f.state.saved, 1); assert.equal(f.calls.length, 1)
  const connection = f.connections.get(tenant)
  assert.equal(connection.token_envelope.v, 1); assert.equal(connection.token_envelope.alg, 'A256GCM')
  assert.ok(!JSON.stringify(connection).includes('fixture-access-only'))
  const status = await f.request('/v1/integrations/google')
  const body = await status.text()
  assert.equal(status.status, 200); assert.doesNotMatch(body, /token|secret|ciphertext|authorized_by|revision/)
  assert.equal(JSON.parse(body).connection.status, 'connected')
})

test('parallel callbacks consume atomically and expired/cancelled states cannot reconnect', async t => {
  const f = await fixture(t)
  const attempt = await f.start()
  const responses = await Promise.all([f.callback(attempt), f.callback(attempt)])
  assert.deepEqual(responses.map(response => response.headers.get('location')).sort(), [`${GOOGLE_RETURN_URL}?google=connected`, `${GOOGLE_RETURN_URL}?google=error`])
  assert.equal(f.state.callbacks, 1); assert.equal(f.state.saved, 1)
  const expired = await f.start(); f.advance(600001)
  assert.equal((await f.callback(expired)).headers.get('location'), `${GOOGLE_RETURN_URL}?google=error`)
  const cancelled = await f.start()
  assert.equal((await f.callback(cancelled, 'error=access_denied')).headers.get('location'), `${GOOGLE_RETURN_URL}?google=cancelled`)
  assert.equal((await f.callback(cancelled)).headers.get('location'), `${GOOGLE_RETURN_URL}?google=error`)
  assert.equal(f.state.saved, 1)
})

test('role revocation or disable during token exchange prevents late persistence without revoking other grants', async t => {
  for (const behavior of ['role', 'disable']) {
    const f = await fixture(t, { fetchImpl: async (url, init, context) => {
      if (url.endsWith('/token')) {
        if (behavior === 'role') context.memberships.set(`${tenant}:${owner}`, 'member')
        if (behavior === 'disable') await context.googleStore.setEnabled(admin, false)
      }
      return context.defaultFetch(url, init)
    } })
    const attempt = await f.start()
    assert.equal((await f.callback(attempt)).headers.get('location'), `${GOOGLE_RETURN_URL}?google=error`)
    assert.equal(f.connections.size, 0); assert.equal(f.attempts.size, 0)
    assert.equal(f.calls.filter(call => call.url.endsWith('/revoke')).length, 0)
  }
})

test('scope escalation/partial consent, missing refresh tokens and malformed upstream tokens fail closed', async t => {
  for (const tokenChanges of [{ scope: GOOGLE_SCOPES[0] }, { scope: `${GOOGLE_SCOPES.join(' ')} https://www.googleapis.com/auth/drive` },
    { refresh_token: undefined }, { expires_in: '3600' }, { access_token: 'bad\r\nheader' }, { token_type: 'MAC' }]) {
    const f = await fixture(t, { fetchImpl: async (_url, _init, context) => json({ ...context.tokenBody, ...tokenChanges }) })
    const attempt = await f.start()
    const response = await f.callback(attempt)
    assert.equal(response.headers.get('location'), `${GOOGLE_RETURN_URL}?google=error`)
    assert.equal(f.connections.size, 0)
  }
})

test('upstream timeout, redirect/network failures, invalid JSON and oversized responses are sanitized', async t => {
  for (const upstream of [
    () => new Promise(() => {}),
    () => { throw new Error('private-provider-details fixture-access-only') },
    () => new Response('not-json fixture-access-only', { headers: jsonHeaders }),
    () => new Response('x'.repeat(40000), { headers: jsonHeaders }),
    () => json({ error: 'invalid_grant', error_description: 'private-provider-details' }, 400)
  ]) {
    const f = await fixture(t, { fetchImpl: upstream, timeoutMs: 15 })
    const attempt = await f.start()
    const response = await f.callback(attempt)
    assert.equal(response.headers.get('location'), `${GOOGLE_RETURN_URL}?google=error`)
    assert.doesNotMatch(await response.text(), /private|fixture|token/)
    assert.equal(f.connections.size, 0); assert.equal(f.attempts.size, 0)
  }
})

test('resources lists real-shaped GA4/SC observations, never tokens or invented metrics', async t => {
  const f = await fixture(t); await f.connect()
  const response = await f.request('/v1/integrations/google/resources')
  assert.equal(response.status, 200)
  const body = await response.json()
  assert.deepEqual(body.analytics, [{ id: 'properties/123', name: 'GA4 de teste', account_name: 'Conta sintética' }])
  assert.deepEqual(body.search_console, [{ id: 'sc-domain:fixture.test', name: 'sc-domain:fixture.test', permission: 'siteOwner' }])
  assert.deepEqual(body.errors, {}); assert.equal(body.truncated, false); assert.ok(body.checked_at)
  assert.doesNotMatch(JSON.stringify(body), /fixture-access-only|refresh_token|clicks|conversions|sessions/)
  assert.ok(f.connections.get(tenant).last_checked_at)
  for (const call of f.calls) assert.equal(call.init.redirect, 'error')
})

test('resource failures are explicit per source, not false zero; 401 marks needs_reconnect', async t => {
  for (const upstreamStatus of [403, 401]) {
    const f = await fixture(t, { fetchImpl: (url, init, ctx) => url.includes('analyticsadmin')
      ? json({ error: { message: 'private-upstream-detail' } }, upstreamStatus) : ctx.defaultFetch(url, init) })
    await f.connect()
    const response = await f.request('/v1/integrations/google/resources')
    const body = await response.json()
    assert.equal(response.status, 200); assert.deepEqual(body.analytics, [])
    assert.equal(body.errors.analytics, upstreamStatus === 401 ? 'GOOGLE_RECONNECT_REQUIRED' : 'GOOGLE_FORBIDDEN')
    assert.equal(body.search_console.length, 1); assert.equal(f.connections.get(tenant).last_checked_at, null)
    assert.equal(f.connections.get(tenant).status, upstreamStatus === 401 ? 'needs_reconnect' : 'connected')
    assert.ok(!JSON.stringify(body).includes('private-upstream-detail'))
  }
})

test('malformed resource data is not interpreted as an empty successful account', async t => {
  const f = await fixture(t, { fetchImpl: (url, init, ctx) => url.includes('analyticsadmin')
    ? json({ unexpected: 'not an account response' }) : url.includes('webmasters/v3') ? json({ siteEntry: 'not an array' }) : ctx.defaultFetch(url, init) })
  await f.connect()
  const body = await (await f.request('/v1/integrations/google/resources')).json()
  assert.deepEqual(body.errors, { analytics: 'GOOGLE_INVALID_RESPONSE', search_console: 'GOOGLE_INVALID_RESPONSE' })
  assert.equal(f.connections.get(tenant).last_checked_at, null)
})

test('a real empty Google response has no source errors', async t => {
  const f = await fixture(t, { fetchImpl: (url, init, ctx) => url.includes('analyticsadmin') || url.includes('webmasters/v3') ? json({}) : ctx.defaultFetch(url, init) })
  await f.connect()
  const body = await (await f.request('/v1/integrations/google/resources')).json()
  assert.deepEqual(body.analytics, []); assert.deepEqual(body.search_console, []); assert.deepEqual(body.errors, {})
})

test('duplicate state/code values and forged state fail without leaking callback input', async t => {
  const f = await fixture(t)
  const attempt = await f.start()
  const wrong = { ...attempt, url: new URL(attempt.url) }
  wrong.url.searchParams.set('state', randomBytes(32).toString('base64url'))
  assert.equal((await f.callback(wrong)).headers.get('location'), `${GOOGLE_RETURN_URL}?google=error`)
  const response = await f.callback(attempt, 'code=one&code=two&next=https://evil.test')
  assert.equal(response.headers.get('location'), `${GOOGLE_RETURN_URL}?google=error`)
  assert.equal(f.calls.length, 0)
  const next = await f.start()
  assert.equal((await f.callback(next, `code=fixture&state=${next.url.searchParams.get('state')}`)).headers.get('location'), `${GOOGLE_RETURN_URL}?google=error`)
  assert.equal(f.calls.length, 0)
})

test('membership loss during resource read discards the observations before returning them', async t => {
  const f = await fixture(t, { fetchImpl: (url, init, ctx) => {
    if (url.includes('analyticsadmin')) ctx.memberships.set(`${tenant}:${owner}`, 'member')
    return ctx.defaultFetch(url, init)
  } })
  await f.connect()
  const response = await f.request('/v1/integrations/google/resources')
  assert.equal(response.status, 403)
  assert.ok(!(await response.text()).includes('GA4 de teste'))
})

test('partial 401 responses revalidate a different authorizer before returning either source', async t => {
  for (const failedSource of ['analyticsadmin', 'webmasters/v3']) {
    const f = await fixture(t, { fetchImpl: (url, init, ctx) => {
      if (url.includes(failedSource)) {
        ctx.memberships.set(`${tenant}:${owner}`, 'member')
        return json({ error: 'synthetic unauthorized' }, 401)
      }
      return ctx.defaultFetch(url, init)
    } })
    f.memberships.set(`${tenant}:${anotherOwner}`, 'admin')
    await f.connect()
    const headers = { Authorization: 'Bearer fixture.other', 'X-Fluxo-Tenant-Id': tenant }
    const response = await f.request('/v1/integrations/google/resources', { headers })
    assert.equal(response.status, 409)
    const body = await response.text()
    assert.equal(JSON.parse(body).error.code, 'GOOGLE_CONNECTION_CHANGED')
    assert.doesNotMatch(body, /GA4 de teste|sc-domain:fixture|properties\/123|search_console/)
    assert.equal(f.connections.get(tenant).last_checked_at, null)
    // Recording the need to reconnect is still permitted after authorizer loss;
    // it must not require permission to return observations.
    const before = f.calls.length
    const retry = await f.request('/v1/integrations/google/resources', { headers })
    assert.equal(retry.status, 409)
    assert.equal((await retry.json()).error.code, 'GOOGLE_RECONNECT_REQUIRED')
    assert.equal(f.connections.get(tenant).status, 'needs_reconnect')
    assert.equal(f.calls.length, before)
  }
})

test('consumption wins: disconnect returns 409 without mutation, then revokes the persisted token on retry', async t => {
  for (const existing of [false, true]) {
    const entered = deferred(); const release = deferred(); let hold = false
    const f = await fixture(t, { timeoutMs: 8000, fetchImpl: async (url, init, ctx) => {
      if (hold && url.endsWith('/token')) { entered.resolve(); await release.promise }
      return ctx.defaultFetch(url, init)
    } })
    t.after(() => release.resolve())
    if (existing) await f.connect()
    hold = true
    const attempt = await f.start()
    const callback = f.callback(attempt)
    await entered.promise
    const connections = structuredClone([...f.connections]); const attempts = structuredClone([...f.attempts])
    try {
      const denied = await f.request('/v1/integrations/google/disconnect', post())
      assert.equal(denied.status, 409)
      assert.deepEqual(await denied.json(), { error: { code: 'GOOGLE_OAUTH_IN_PROGRESS',
        message: 'Uma autorização Google está em andamento ou aguarda confirmação de término. Aguarde e tente novamente.' } })
      assert.deepEqual([...f.connections], connections); assert.deepEqual([...f.attempts], attempts)
      assert.equal(f.calls.filter(call => call.url.endsWith('/revoke')).length, 0)
    } finally { release.resolve() }
    assert.equal((await callback).headers.get('location'), `${GOOGLE_RETURN_URL}?google=connected`)
    const retry = await f.request('/v1/integrations/google/disconnect', post())
    assert.equal(retry.status, 200)
    assert.deepEqual(await retry.json(), { disconnected: true, revocation: 'succeeded' })
    assert.equal(f.connections.size, 0); assert.equal(f.attempts.size, 0)
    assert.equal(f.calls.filter(call => call.url.endsWith('/revoke')).length, 1)
  }
})

test('disconnect wins before consumption: cancelled consent reports unconfirmed revocation and cannot exchange tokens', async t => {
  const f = await fixture(t)
  const attempt = await f.start()
  const entered = deferred(); const release = deferred()
  const consume = f.googleStore.consumeAttempt.bind(f.googleStore)
  f.googleStore.consumeAttempt = async (...args) => { entered.resolve(); await release.promise; return consume(...args) }
  t.after(() => release.resolve())
  const callback = f.callback(attempt)
  await entered.promise
  try {
    const disconnected = await f.request('/v1/integrations/google/disconnect', post())
    assert.equal(disconnected.status, 200)
    const body = await disconnected.json()
    assert.equal(body.disconnected, true); assert.equal(body.revocation, 'failed')
    assert.match(body.warning, /não há credencial local para confirmar a revogação externa/)
    assert.equal(f.attempts.size, 0)
  } finally { release.resolve() }
  assert.equal((await callback).headers.get('location'), `${GOOGLE_RETURN_URL}?google=error`)
  assert.equal(f.calls.length, 0); assert.equal(f.connections.size, 0)
  assert.equal((await f.callback(attempt)).headers.get('location'), `${GOOGLE_RETURN_URL}?google=error`)
})

test('state expiry and unrelated authorization cleanup never release an active exchange guard', async t => {
  const entered = deferred(); const release = deferred()
  const f = await fixture(t, { timeoutMs: 8000, fetchImpl: async (url, init, ctx) => {
    if (url.endsWith('/token')) { entered.resolve(); await release.promise }
    return ctx.defaultFetch(url, init)
  } })
  t.after(() => release.resolve())
  const attempt = await f.start(); f.advance(599999)
  const callback = f.callback(attempt)
  await entered.promise
  f.advance(2)
  try {
    for (const path of ['disconnect', 'authorize']) {
      const denied = await f.request(`/v1/integrations/google/${path}`, post())
      assert.equal(denied.status, 409); assert.equal((await denied.json()).error.code, 'GOOGLE_OAUTH_IN_PROGRESS')
    }
    await f.start({ Authorization: 'Bearer fixture.other' })
    assert.ok(f.attempts.get(sha256(attempt.url.searchParams.get('state'))).consumed_at)
    // Another tenant can cancel its own pending consent despite this guard.
    assert.equal((await f.request('/v1/integrations/google/disconnect', post({}, { Authorization: 'Bearer fixture.other' }))).status, 200)
    assert.equal(f.attempts.size, 1)
  } finally { release.resolve() }
  assert.equal((await callback).headers.get('location'), `${GOOGLE_RETURN_URL}?google=error`)
  assert.equal(f.connections.size, 0); assert.equal(f.attempts.size, 0)
  assert.equal(f.calls.filter(call => call.url.endsWith('/revoke')).length, 0)
  const after = await (await f.request('/v1/integrations/google/disconnect', post())).json()
  assert.equal(after.revocation, 'failed'); assert.match(after.warning, /revogação externa/)
})

test('disable/re-enable preserves connections and the active guard but never revives or revokes a cancelled exchange', async t => {
  const entered = deferred(); const release = deferred(); let hold = false
  const f = await fixture(t, { timeoutMs: 8000, fetchImpl: async (url, init, ctx) => {
    if (hold && url.endsWith('/token')) { entered.resolve(); await release.promise }
    return ctx.defaultFetch(url, init)
  } })
  t.after(() => release.resolve())
  await f.connect(); await f.connect({ Authorization: 'Bearer fixture.other' })
  const connections = structuredClone([...f.connections])
  const attempt = await f.start(); hold = true
  const callback = f.callback(attempt)
  await entered.promise
  try {
    for (const enabled of [false, true]) {
      const result = await f.request('/v1/admin/google', { ...post({ enabled }, { Authorization: 'Bearer fixture.admin' }), method: 'PATCH' })
      assert.equal(result.status, 200)
      assert.deepEqual([...f.connections], connections)
      const denied = await f.request('/v1/integrations/google/disconnect', post())
      assert.equal(denied.status, 409); assert.equal((await denied.json()).error.code, 'GOOGLE_OAUTH_IN_PROGRESS')
    }
    assert.ok(f.attempts.get(sha256(attempt.url.searchParams.get('state'))).invalidated_at)
  } finally { release.resolve() }
  assert.equal((await callback).headers.get('location'), `${GOOGLE_RETURN_URL}?google=error`)
  assert.deepEqual([...f.connections], connections); assert.equal(f.attempts.size, 0)
  assert.equal(f.calls.filter(call => call.url.endsWith('/revoke')).length, 0)
})

test('replacing browser consent in another tenant keeps the old guard and never revokes the new connection', async t => {
  const entered = deferred(); const release = deferred(); let first = true
  const f = await fixture(t, { timeoutMs: 8000, fetchImpl: async (url, init, ctx) => {
    if (first && url.endsWith('/token')) { first = false; entered.resolve(); await release.promise }
    return ctx.defaultFetch(url, init)
  } })
  t.after(() => release.resolve())
  const oldAttempt = await f.start()
  const oldCallback = f.callback(oldAttempt)
  await entered.promise
  try {
    const newer = await f.start({ Authorization: 'Bearer fixture.other', Cookie: oldAttempt.cookie })
    assert.equal((await f.callback(newer)).headers.get('location'), `${GOOGLE_RETURN_URL}?google=connected`)
    const oldRow = f.attempts.get(sha256(oldAttempt.url.searchParams.get('state')))
    assert.ok(oldRow.invalidated_at); assert.ok(oldRow.consumed_at)
    assert.equal((await f.request('/v1/integrations/google/disconnect', post())).status, 409)
  } finally { release.resolve() }
  assert.equal((await oldCallback).headers.get('location'), `${GOOGLE_RETURN_URL}?google=error`)
  assert.equal(f.connections.has(tenant), false); assert.equal(f.connections.has(otherTenant), true)
  assert.equal(f.calls.filter(call => call.url.endsWith('/revoke')).length, 0)
})

test('token timeout releases the completed callback guard without claiming or attempting external revocation', async t => {
  let aborted = false
  const f = await fixture(t, { timeoutMs: 10, fetchImpl: (_url, init) => new Promise((_resolve, reject) => {
    init.signal.addEventListener('abort', () => { aborted = true; reject(new Error('synthetic abort')) }, { once: true })
  }) })
  const attempt = await f.start()
  assert.equal((await f.callback(attempt)).headers.get('location'), `${GOOGLE_RETURN_URL}?google=error`)
  assert.equal(aborted, true); assert.equal(f.attempts.size, 0); assert.equal(f.connections.size, 0)
  const disconnected = await f.request('/v1/integrations/google/disconnect', post())
  assert.equal(disconnected.status, 200); assert.equal((await disconnected.json()).revocation, 'failed')
  assert.equal(f.calls.filter(call => call.url.endsWith('/revoke')).length, 0)
})

test('uncertain consumption or failed cleanup retains the guard after expiry instead of silently unlocking revocation', async t => {
  for (const failure of ['consume-response', 'cleanup']) {
    const f = await fixture(t)
    if (failure === 'consume-response') {
      const consume = f.googleStore.consumeAttempt.bind(f.googleStore)
      f.googleStore.consumeAttempt = async (...args) => { await consume(...args); throw new Error('synthetic lost RPC response') }
    } else f.googleStore.discardAttempt = async () => { throw new Error('synthetic storage failure') }
    const attempt = await f.start()
    await f.callback(attempt, 'error=access_denied')
    f.advance(600001)
    const snapshot = structuredClone([...f.attempts])
    for (const path of ['disconnect', 'authorize']) {
      const denied = await f.request(`/v1/integrations/google/${path}`, post())
      assert.equal(denied.status, 409); assert.equal((await denied.json()).error.code, 'GOOGLE_OAUTH_IN_PROGRESS')
      assert.deepEqual([...f.attempts], snapshot)
    }
    assert.equal(f.calls.length, 0); assert.equal(f.connections.size, 0)
  }
})

test('external revocation must complete, not merely accept the request', async t => {
  const f = await fixture(t, { fetchImpl: (url, init, ctx) => url.endsWith('/revoke') ? new Response('', { status: 202 }) : ctx.defaultFetch(url, init) })
  await f.connect()
  const result = await (await f.request('/v1/integrations/google/disconnect', post())).json()
  assert.equal(result.revocation, 'failed'); assert.equal(result.disconnected, true)
})

test('bounded pagination and resource cap explicitly report truncation', async t => {
  const f = await fixture(t, { maxPages: 2, maxResources: 2, fetchImpl: (url, init, ctx) => {
    if (url.includes('analyticsadmin')) {
      const page = new URL(url).searchParams.get('pageToken') || '1'
      return json({ accountSummaries: [{ propertySummaries: [{ property: `properties/${page}`, displayName: 'Fixture' }] }], nextPageToken: String(Number(page) + 1) })
    }
    if (url.includes('webmasters/v3/sites')) return json({ siteEntry: [1, 2, 3].map(id => ({ siteUrl: `sc-domain:${id}.test`, permissionLevel: 'siteOwner' })) })
    return ctx.defaultFetch(url, init)
  } })
  await f.connect()
  const body = await (await f.request('/v1/integrations/google/resources')).json()
  assert.equal(body.truncated, true); assert.equal(body.analytics.length, 2); assert.equal(body.search_console.length, 2)
  assert.equal(f.calls.filter(call => call.url.includes('analyticsadmin')).length, 2)
})

test('expired token refresh is server-side, persisted encrypted and used without exposing refresh credentials', async t => {
  const f = await fixture(t, { fetchImpl: (url, init, ctx) => {
    if (url.endsWith('/token') && new URLSearchParams(init.body).get('grant_type') === 'refresh_token') {
      return json({ access_token: 'fixture-renewed-only', token_type: 'Bearer', expires_in: 3600 })
    }
    return ctx.defaultFetch(url, init)
  } })
  await f.connect(); f.advance(3600001)
  const res = await f.request('/v1/integrations/google/resources')
  assert.equal(res.status, 200)
  const refresh = f.calls.find(call => new URLSearchParams(call.init.body || '').get('grant_type') === 'refresh_token')
  assert.ok(refresh); assert.equal(new URLSearchParams(refresh.init.body).get('refresh_token'), 'fixture-refresh-only')
  const resource = f.calls.find(call => call.url.includes('analyticsadmin'))
  assert.equal(resource.init.headers.Authorization, 'Bearer fixture-renewed-only')
  const persisted = f.connections.get(tenant)
  assert.ok(!JSON.stringify(persisted).includes('fixture-renewed-only'))
  assert.ok(!(await res.text()).includes('fixture-renewed-only'))
})

test('invalid refresh grants mark reconnection while transient failures preserve connection state', async t => {
  for (const status of [400, 503]) {
    const f = await fixture(t, { fetchImpl: (url, init, ctx) => {
      if (url.endsWith('/token') && new URLSearchParams(init.body).get('grant_type') === 'refresh_token') return json({ error: status === 400 ? 'invalid_grant' : 'temporarily_unavailable' }, status)
      return ctx.defaultFetch(url, init)
    } })
    await f.connect(); f.advance(3600001)
    const res = await f.request('/v1/integrations/google/resources')
    assert.equal(res.status, status === 400 ? 409 : 502)
    assert.equal(f.connections.get(tenant).status, status === 400 ? 'needs_reconnect' : 'connected')
    assert.equal(f.calls.filter(call => call.url.includes('analyticsadmin')).length, 0)
  }
})

test('disconnect during refresh cannot recreate a connection or return resource data', async t => {
  const f = await fixture(t, { fetchImpl: async (url, init, ctx) => {
    if (url.endsWith('/token') && new URLSearchParams(init.body).get('grant_type') === 'refresh_token') await ctx.googleStore.disconnect(tenant, owner)
    return ctx.defaultFetch(url, init)
  } })
  await f.connect(); f.advance(3600001)
  assert.equal((await f.request('/v1/integrations/google/resources')).status, 409)
  assert.equal(f.connections.size, 0)
  assert.equal(f.calls.filter(call => call.url.includes('analyticsadmin')).length, 0)
})

test('disconnect deletes only its tenant, invalidates pending OAuth and reports external revocation outcome', async t => {
  for (const failRevocation of [false, true]) {
    const f = await fixture(t, { fetchImpl: (url, init, ctx) => url.endsWith('/revoke') && failRevocation
      ? json({ error: 'fixture-only-private-error' }, 500) : ctx.defaultFetch(url, init) })
    await f.connect(); await f.connect({ Authorization: 'Bearer fixture.other' })
    const pending = await f.start()
    const result = await (await f.request('/v1/integrations/google/disconnect', post())).json()
    assert.equal(result.disconnected, true); assert.equal(result.revocation, failRevocation ? 'failed' : 'succeeded')
    assert.equal(f.connections.has(tenant), false); assert.equal(f.connections.has(otherTenant), true)
    assert.equal((await f.callback(pending)).headers.get('location'), `${GOOGLE_RETURN_URL}?google=error`)
    const call = f.calls.find(value => value.url.endsWith('/revoke'))
    assert.ok(call); assert.equal(call.url, 'https://oauth2.googleapis.com/revoke')
    assert.equal(new URLSearchParams(call.init.body).get('token'), 'fixture-refresh-only')
    assert.ok(!JSON.stringify(result).includes('fixture'))
  }
})

test('disconnection remains possible with feature off; missing local tokens never prove external revocation is unnecessary', async t => {
  const f = await fixture(t); await f.connect(); f.state.enabled = false
  assert.equal((await f.request('/v1/integrations/google/resources')).status, 409)
  assert.equal((await (await f.request('/v1/integrations/google/disconnect', post())).json()).revocation, 'succeeded')
  const empty = await (await f.request('/v1/integrations/google/disconnect', post())).json()
  assert.equal(empty.disconnected, true); assert.equal(empty.revocation, 'failed')
  assert.match(empty.warning, /não há credencial local para confirmar a revogação externa/)
})

test('status never claims connected for damaged tokens or an authorizer without tenant admin access', async t => {
  for (const kind of ['ciphertext', 'membership']) {
    const f = await fixture(t); await f.connect()
    if (kind === 'ciphertext') f.connections.get(tenant).token_envelope.tag = 'A'.repeat(22)
    else f.memberships.set(`${tenant}:${owner}`, 'member')
    const body = await (await f.request('/v1/integrations/google')).json()
    assert.equal(body.connection.status, 'needs_reconnect')
  }
})

test('authorization rate limits bound active attempts and one replacement invalidates prior browser flow', async t => {
  const f = await fixture(t)
  const previous = await f.start()
  const current = await f.start({ Cookie: previous.cookie })
  assert.equal(f.attempts.size, 1)
  assert.equal((await f.callback(previous)).headers.get('location'), `${GOOGLE_RETURN_URL}?google=error`)
  assert.equal((await f.callback(current)).headers.get('location'), `${GOOGLE_RETURN_URL}?google=connected`)
  for (let count = 0; count < 3; count++) await f.start()
  const limited = await f.request('/v1/integrations/google/authorize', post())
  assert.equal(limited.status, 429); assert.equal(limited.headers.get('retry-after'), '60'); assert.equal(f.attempts.size, 1)
})

test('malformed callback traffic does not reach storage or consume a legitimate callback budget on the same socket', async t => {
  const f = await fixture(t)
  const attempt = await f.start()
  const inspected = f.state.inspections
  let consumptions = 0
  const consume = f.googleStore.consumeAttempt.bind(f.googleStore)
  f.googleStore.consumeAttempt = (...args) => { consumptions++; return consume(...args) }
  const state = attempt.url.searchParams.get('state')
  for (let count = 0; count < 65; count++) {
    const malformed = [
      { query: `state=${state}`, cookie: '' },
      { query: 'state=invalid', cookie: attempt.cookie },
      { query: `state=${state}&state=${state}`, cookie: attempt.cookie },
      { query: `state=${state}`, cookie: `${attempt.cookie}; ${attempt.cookie}` }
    ][count % 4]
    const response = await f.request(`/v1/integrations/google/callback?${malformed.query}&code=fixture-code`,
      { headers: { Authorization: '', Cookie: malformed.cookie, 'X-Forwarded-For': '192.0.2.1' } })
    assert.equal(response.headers.get('location'), `${GOOGLE_RETURN_URL}?google=error`)
  }
  assert.equal(consumptions, 0); assert.equal(f.state.inspections, inspected); assert.equal(f.calls.length, 0)
  assert.equal((await f.callback(attempt)).headers.get('location'), `${GOOGLE_RETURN_URL}?google=connected`)
})

test('over 5000 random state/nonce pairs and valid-state/wrong-cookie attempts cannot poison callback counters', async t => {
  const f = await fixture(t)
  const attempt = await f.start()
  const inspected = f.state.inspections
  for (let count = 0; count < 5001; count++) {
    const state = count % 2 ? attempt.url.searchParams.get('state') : randomBytes(32).toString('base64url')
    const result = await f.google.callback(new URLSearchParams({ state, code: 'fixture-code' }),
      `${GOOGLE_COOKIE}=${randomBytes(32).toString('base64url')}`, '127.0.0.1')
    assert.equal(result.location, `${GOOGLE_RETURN_URL}?google=error`)
  }
  assert.equal(f.state.inspections, inspected); assert.equal(f.state.callbacks, 0); assert.equal(f.calls.length, 0)
  assert.equal((await f.callback(attempt)).headers.get('location'), `${GOOGLE_RETURN_URL}?google=connected`)
  // Replay is also invalid for rate-limit accounting, despite a genuine cookie.
  const completedInspections = f.state.inspections
  for (let count = 0; count < 65; count++) {
    const replay = await f.google.callback(new URLSearchParams({ state: attempt.url.searchParams.get('state'), code: 'fixture-code' }), attempt.cookie)
    assert.equal(replay.location, `${GOOGLE_RETURN_URL}?google=error`)
  }
  assert.equal(f.state.inspections, completedInspections)
  await f.connect()
  assert.equal((await f.request('/v1/integrations/google')).status, 200)
})

test('callback quota follows the atomically consumed user, without coupling another tenant or proxy socket', async t => {
  const f = await fixture(t)
  // Seed sequential pending rows to model authorizations issued by other API
  // workers; this worker still consumes each state once through the adapter.
  function seeded(tenantId, userId) {
    const state = randomBytes(32).toString('base64url'); const nonce = randomBytes(32).toString('base64url')
    const stateHash = sha256(state)
    f.attempts.set(stateHash, { state_hash: stateHash, tenant_id: tenantId, user_id: userId,
      browser_hash: sha256(nonce), consumed_at: null, invalidated_at: null, expires_at: '2026-10-15T12:10:00.000Z',
      verifier_envelope: encryptGoogleSecret(f.config.encryptionKey, { verifier: randomBytes(32).toString('base64url') },
        { purpose: `pkce:${stateHash}`, tenantId, userId }) })
    return { query: new URLSearchParams({ state, code: 'fixture-code' }), cookie: `${GOOGLE_COOKIE}=${nonce}` }
  }
  for (let count = 0; count < 60; count++) {
    const attempt = seeded(tenant, owner)
    assert.equal((await f.google.callback(attempt.query, attempt.cookie, '127.0.0.1')).location, `${GOOGLE_RETURN_URL}?google=connected`)
  }
  const excess = seeded(tenant, owner)
  assert.equal((await f.google.callback(excess.query, excess.cookie, '192.0.2.55')).location, `${GOOGLE_RETURN_URL}?google=error`)
  assert.equal(f.calls.length, 60); assert.equal(f.attempts.size, 0)
  const other = seeded(otherTenant, anotherOwner)
  assert.equal((await f.google.callback(other.query, other.cookie, '127.0.0.1')).location, `${GOOGLE_RETURN_URL}?google=connected`)
  assert.equal(f.calls.length, 61)
})

test('the eight-operation global limit still bounds callback consumption before a user is known', async t => {
  const f = await fixture(t)
  const entered = deferred(); const release = deferred()
  const consume = f.googleStore.consumeAttempt.bind(f.googleStore)
  let active = 0
  f.googleStore.consumeAttempt = async (...args) => {
    active++
    if (active === 8) entered.resolve()
    await release.promise
    return consume(...args)
  }
  t.after(() => release.resolve())
  const request = () => f.google.callback(new URLSearchParams({ state: randomBytes(32).toString('base64url'), code: 'fixture-code' }),
    `${GOOGLE_COOKIE}=${randomBytes(32).toString('base64url')}`)
  const pending = Array.from({ length: 8 }, request)
  await entered.promise
  try {
    assert.equal((await request()).location, `${GOOGLE_RETURN_URL}?google=error`)
    assert.equal(active, 8); assert.equal(f.state.inspections, 0)
  } finally { release.resolve() }
  await Promise.all(pending)
  f.googleStore.consumeAttempt = consume
  await f.connect()
})

test('cryptographic envelopes enforce version, authentication tag, purpose, tenant and user', () => {
  const key = randomBytes(32)
  const scope = { purpose: 'tokens', tenantId: tenant, userId: owner }
  const encrypted = encryptGoogleSecret(key, { synthetic: true }, scope)
  assert.deepEqual(decryptGoogleSecret(key, encrypted, scope), { synthetic: true })
  for (const changedScope of [{ ...scope, tenantId: otherTenant }, { ...scope, userId: member }, { ...scope, purpose: 'pkce' }]) {
    assert.throws(() => decryptGoogleSecret(key, encrypted, changedScope), { code: 'GOOGLE_RECONNECT_REQUIRED' })
  }
  assert.throws(() => decryptGoogleSecret(randomBytes(32), encrypted, scope), { code: 'GOOGLE_RECONNECT_REQUIRED' })
  assert.throws(() => decryptGoogleSecret(key, { ...encrypted, v: 2 }, scope), { code: 'GOOGLE_RECONNECT_REQUIRED' })
  assert.throws(() => exactGoogleScopes([...GOOGLE_SCOPES, 'openid']), { code: 'GOOGLE_SCOPES_REQUIRED' })
  assert.equal(readOAuthCookie(`${GOOGLE_COOKIE}=bad`), null)
})
