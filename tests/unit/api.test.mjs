import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { once } from 'node:events'
import { createHandler } from '../../services/monitor-api/app.mjs'
import { ApiError } from '../../services/monitor-api/errors.mjs'

const own = '11111111-1111-4111-8111-111111111111'
const other = '22222222-2222-4222-8222-222222222222'
const tenant = '33333333-3333-4333-8333-333333333333'
async function fixture(t, { globalOnly = false, paused = false } = {}) {
  const saved = []
  const adminOnly = () => { if (!globalOnly) throw new ApiError(403, 'ADMIN_REQUIRED', 'Administração necessária.') }
  const store = {
    authenticate: async token => { if (token !== 'valid.user.token') throw new ApiError(401, 'UNAUTHORIZED', 'Entre na sua conta.'); return { userId: 'owner', token } },
    workspace: async (_context, requested) => {
      if (requested && requested !== tenant) throw new ApiError(403, 'TENANT_DENIED', 'Espaço negado.')
      if (globalOnly) return { activeTenant: null, tenants: [], platformAdmin: true }
      return { activeTenant: { id: tenant, name: 'Espaço teste', role: 'owner' }, tenants: [{ id: tenant, name: 'Espaço teste', role: 'owner' }], platformAdmin: false }
    },
    adminTenants: async () => { adminOnly(); return [] },
    createOwnTenant: async () => { adminOnly(); return { tenant_id: tenant } },
    renameTenant: async (_context, tenantId, name) => { adminOnly(); saved.push({ tenantId, name }); return { id: tenantId, name } },
    tenantControls: async () => { adminOnly(); return { tenant: { id: tenant }, controls: { status: 'active' } } },
    saveTenantControls: async (_context, tenantId, changes) => { adminOnly(); saved.push({ tenantId, changes }); return changes },
    tenantPolicy: async () => ({ status: paused ? 'paused' : 'active', allowed_channels: ['whatsapp_waba', 'email_smtp'], channel_limits: {} }),
    adminPlans: async () => { adminOnly(); return [] },
    availablePlans: async () => [],
    savePlan: async (_context, plan) => { adminOnly(); saved.push({ plan }); return { id: own } },
    adminBilling: async () => { adminOnly(); return { gateway: 'none' } },
    setBillingGateway: async (_context, gateway) => { adminOnly(); saved.push({ gateway }); return { gateway } },
    adminSupportThreads: async () => { adminOnly(); return [] },
    supportMessages: async (_context, tenantId, fromPlatform) => { if (fromPlatform) adminOnly(); return saved.filter(item => item.supportTenant === tenantId).map(item => item.message) },
    sendSupportMessage: async (_context, tenantId, body, fromPlatform) => { if (fromPlatform) adminOnly(); const message = { id: own, tenant_id: tenantId, sender_platform: fromPlatform, body }; saved.push({ supportTenant: tenantId, message }); return message },
    list: async (context, tenantId) => [{ id: own, user_id: context.userId, tenant_id: tenantId }],
    create: async (context, tenantId, url) => { saved.push({ userId: context.userId, tenantId, url: url.href }); return { id: own } },
    setEnabled: async (_context, tenantId, id) => { if (tenantId !== tenant || id !== own) throw new ApiError(404, 'NOT_FOUND', 'Não encontrado.'); return { id } },
    claim: async (_context, tenantId, id) => { if (tenantId !== tenant || id !== own) throw new ApiError(404, 'NOT_FOUND', 'Não encontrado.'); return { id, url: 'https://site.com/' } },
    record: async (context, tenantId, id, result) => { saved.push({ userId: context.userId, tenantId, id, result }); return { ...result, monitor_id: id } }
  }
  const server = createServer(createHandler({
    store, allowedOrigins: ['https://fluxoatento.com.br'], validate: async () => ({}),
    probe: async () => ({ status: 'ok', http_status: 200, duration_ms: 42, detail: 'HTTP only' })
  }))
  server.listen(0, '127.0.0.1'); await once(server, 'listening')
  t.after(() => { server.closeAllConnections(); server.close() })
  const base = 'http://127.0.0.1:' + server.address().port
  const request = (path, init = {}) => fetch(base + path, { ...init, headers: { Authorization: 'Bearer valid.user.token', ...init.headers } })
  return { request, saved }
}
test('health is public but monitor data and writes require a verified session', async t => {
  const { request } = await fixture(t)
  assert.equal((await request('/v1/health')).status, 200)
  for (const method of ['GET', 'POST', 'PATCH']) {
    assert.equal((await request('/v1/monitors', { method, headers: { Authorization: '' } })).status, 401)
  }
  assert.equal((await request('/v1/monitors', { headers: { Authorization: 'Bearer wrong' } })).status, 401)
})
test('identity injection and cross-user monitor access are rejected before any check or write', async t => {
  const { request, saved } = await fixture(t)
  const injection = await request('/v1/monitors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: 'https://site.com', user_id: 'other' }) })
  assert.equal(injection.status, 400)
  assert.equal((await request('/v1/monitors/' + other + '/check', { method: 'POST' })).status, 404)
  assert.equal((await request('/v1/monitors/' + other, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: '{"enabled":false}' })).status, 404)
  assert.equal(saved.length, 0)
})
test('creates and records observations using only the verified owner; responses are not cached', async t => {
  const { request, saved } = await fixture(t)
  assert.equal((await request('/v1/monitors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"url":"site.com"}' })).status, 201)
  const check = await request('/v1/monitors/' + own + '/check', { method: 'POST' })
  assert.equal(check.status, 200); assert.equal(check.headers.get('cache-control'), 'no-store')
  assert.equal((await check.json()).check.http_status, 200)
  assert.deepEqual(saved.map(value => value.userId), ['owner', 'owner'])
})
test('CORS denies arbitrary origins and allows only exact configured origins', async t => {
  const { request } = await fixture(t)
  assert.equal((await request('/v1/monitors', { headers: { Origin: 'https://evil.example' } })).status, 403)
  const allowed = await request('/v1/monitors', { method: 'OPTIONS', headers: { Origin: 'https://fluxoatento.com.br' } })
  assert.equal(allowed.status, 204); assert.equal(allowed.headers.get('access-control-allow-origin'), 'https://fluxoatento.com.br')
  assert.match(allowed.headers.get('access-control-allow-headers'), /X-Fluxo-Tenant-Id/)
})
test('workspace is resolved from verified identity and a forged tenant id is denied', async t => {
  const { request } = await fixture(t)
  const workspace = await request('/v1/workspace')
  assert.equal(workspace.status, 200)
  assert.equal((await workspace.json()).active_tenant.id, tenant)
  assert.equal((await request('/v1/monitors', { headers: { 'X-Fluxo-Tenant-Id': other } })).status, 403)
})
test('a global administrator needs no tenant and cannot use tenant endpoints without membership', async t => {
  const { request } = await fixture(t, { globalOnly: true })
  const workspace = await request('/v1/workspace')
  assert.equal(workspace.status, 200)
  assert.deepEqual(await workspace.json(), { active_tenant: null, tenants: [], platform_admin: true })
  assert.equal((await request('/v1/admin/tenants')).status, 200)
  const scoped = await request('/v1/monitors')
  assert.equal(scoped.status, 403)
  assert.equal((await scoped.json()).error.code, 'TENANT_REQUIRED')
  assert.equal((await request('/v1/monitors', { headers: { 'X-Fluxo-Tenant-Id': other } })).status, 403)
})
test('invalid JSON, unsupported media and oversized bodies fail safely', async t => {
  const { request } = await fixture(t)
  assert.equal((await request('/v1/monitors', { method: 'POST', body: '{}' })).status, 415)
  assert.equal((await request('/v1/monitors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' })).status, 400)
  assert.equal((await request('/v1/monitors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: 'x'.repeat(9000) }) })).status, 413)
})
test('platform controls and plan scope accept only bounded fields from a verified global role', async t => {
  const admin = await fixture(t, { globalOnly: true })
  const tenantUser = await fixture(t)
  assert.equal((await tenantUser.request('/v1/admin/plans')).status, 403)
  assert.equal((await tenantUser.request(`/v1/admin/tenants/${tenant}`)).status, 403)
  assert.equal((await admin.request('/v1/admin/plans')).status, 200)
  const plan = { name: 'Inicial', price_cents: 4900, billing_interval: 'monthly', max_users: 10,
    max_connections: 2, gallery_storage_mb: 0, trial_days: 7, features: ['monitoring'],
    audience: 'selected', status: 'published', target_tenant_ids: [tenant] }
  const post = (path, body, method = 'POST') => admin.request(path, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  assert.equal((await post('/v1/admin/plans', { ...plan, target_tenant_ids: [] })).status, 400)
  assert.equal((await post('/v1/admin/plans', { ...plan, price_cents: -1 })).status, 400)
  assert.equal((await post('/v1/admin/plans', plan)).status, 201)
  const controls = { identifier: 'empresa-a', status: 'active', plan_id: null, max_users: 10,
    max_connections: 2, gallery_storage_mb: 100, trial_days: 7, allowed_channels: ['email_smtp'],
    channel_limits: { email_smtp: null }, provider_mode: 'platform' }
  assert.equal((await post(`/v1/admin/tenants/${tenant}`, { ...controls, channel_limits: { email_smtp: -1 } }, 'PATCH')).status, 400)
  assert.equal((await post(`/v1/admin/tenants/${tenant}`, controls, 'PATCH')).status, 200)
  assert.equal(admin.saved.length, 2)
})
test('support stays tenant-scoped and available to a global-only administrator', async t => {
  const user = await fixture(t)
  const admin = await fixture(t, { globalOnly: true })
  const post = (request, path, body) => request(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  assert.equal((await post(user.request, '/v1/support/messages', { body: 'Preciso de ajuda.' })).status, 201)
  assert.equal((await user.request('/v1/support/messages')).status, 200)
  assert.equal((await user.request(`/v1/admin/support/${tenant}/messages`)).status, 403)
  assert.equal((await post(admin.request, `/v1/admin/support/${tenant}/messages`, { body: 'Podemos ajudar.' })).status, 201)
  assert.equal((await admin.request(`/v1/admin/support/${tenant}/messages`)).status, 200)
  assert.equal((await post(user.request, '/v1/support/messages', { body: 'x'.repeat(2001) })).status, 400)
  assert.equal((await user.request('/v1/support/messages', { headers: { 'X-Fluxo-Tenant-Id': other } })).status, 403)
})
test('pausing a tenant blocks operational endpoints but keeps support and plan information available', async t => {
  const { request } = await fixture(t, { paused: true })
  assert.equal((await request('/v1/support/messages')).status, 200)
  assert.equal((await request('/v1/plans')).status, 200)
  const monitors = await request('/v1/monitors')
  assert.equal(monitors.status, 403)
  assert.equal((await monitors.json()).error.code, 'TENANT_PAUSED')
})
