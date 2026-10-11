import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { once } from 'node:events'
import { createHandler } from '../../services/monitor-api/app.mjs'
import { ApiError } from '../../services/monitor-api/errors.mjs'

const own = '11111111-1111-4111-8111-111111111111'
const other = '22222222-2222-4222-8222-222222222222'
const tenant = '33333333-3333-4333-8333-333333333333'
async function fixture(t, admin = false) {
  const saved = []
  const store = {
    requirePlatformAdmin: async () => { if (!admin) throw new ApiError(403, 'ADMIN_REQUIRED', 'Administração necessária.') },
    authenticate: async token => { if (token !== 'valid.user.token') throw new ApiError(401, 'UNAUTHORIZED', 'Entre na sua conta.'); return { userId: 'owner', token } },
    workspace: async (_context, requested) => {
      if (requested && requested !== tenant) throw new ApiError(403, 'TENANT_DENIED', 'Espaço negado.')
      return { activeTenant: { id: tenant, name: 'Espaço teste', role: 'owner' }, tenants: [{ id: tenant, name: 'Espaço teste', role: 'owner' }], platformAdmin: admin }
    },
    adminTenants: async () => ({ tenants: [{ id: tenant }], total: 1 }),
    adminProviders: async () => [],
    adminAudit: async () => [],
    adminMembers: async () => [{ user_id: own, role: 'owner' }],
    setMemberRole: async (...args) => { saved.push(args); return { updated: true } },
    setProviderStatus: async (...args) => { saved.push(args); return { updated: true } },
    contacts: async (_context, tenantId) => ({ contacts: [], tenant_id: tenantId }),
    saveContact: async (context, tenantId, contact) => { saved.push({ userId: context.userId, tenantId, ...contact }); return { id: own, created: true } },
    contactHistory: async (_context, tenantId, id) => { if (tenantId !== tenant || id !== own) throw new ApiError(404, 'CONTACT_NOT_FOUND', 'Não encontrado.'); return { messages: [], next_cursor: null } },
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
test('invalid JSON, unsupported media and oversized bodies fail safely', async t => {
  const { request } = await fixture(t)
  assert.equal((await request('/v1/monitors', { method: 'POST', body: '{}' })).status, 415)
  assert.equal((await request('/v1/monitors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' })).status, 400)
  assert.equal((await request('/v1/monitors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: 'x'.repeat(9000) }) })).status, 413)
})

test('every global admin route is denied to tenant owners before reaching its handler', async t => {
  const { request, saved } = await fixture(t)
  const routes = ['/v1/admin/tenants', '/v1/admin/providers', '/v1/admin/users', '/v1/admin/audit', `/v1/admin/tenants/${tenant}/members`, `/v1/admin/providers/${own}`]
  for (const path of routes) for (const method of ['GET', 'POST', 'PATCH']) {
    assert.equal((await request(path, { method, headers: { 'Content-Type': 'application/json' } })).status, 403)
  }
  assert.equal(saved.length, 0)
})

test('admin can read global controls, but cannot promote tenant users to platform admin or fake provider validation', async t => {
  const { request, saved } = await fixture(t, true)
  assert.equal((await request('/v1/admin/tenants')).status, 200)
  assert.equal((await request(`/v1/admin/tenants/${tenant}/members`)).status, 200)
  const patch = body => ({ method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  assert.equal((await request(`/v1/admin/tenants/${tenant}/members/${own}`, patch({ role: 'platform_admin' }))).status, 400)
  assert.equal((await request(`/v1/admin/providers/${own}`, patch({ status: 'validated' }))).status, 400)
  assert.equal(saved.length, 0)
  assert.equal((await request(`/v1/admin/tenants/${tenant}/members/${own}`, patch({ role: 'admin' }))).status, 200)
  assert.equal((await request(`/v1/admin/providers/${own}`, patch({ status: 'disabled' }))).status, 200)
})

test('contacts normalize identifiers, reject identity injection, isolate history and validate cursors', async t => {
  const { request, saved } = await fixture(t)
  const post = body => ({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  assert.equal((await request('/v1/contacts', post({ name: 'Contato', email: ' User@Example.COM ', phone: '+55 (11) 99999-9999' }))).status, 201)
  assert.deepEqual(saved[0], { userId: 'owner', tenantId: tenant, name: 'Contato', email: 'user@example.com', phone: '+5511999999999' })
  assert.equal((await request('/v1/contacts', post({ name: 'Contato', email: 'a@b.com', tenant_id: other }))).status, 400)
  assert.equal((await request('/v1/contacts', post({ name: 'Contato', phone: '11999999999' }))).status, 400)
  assert.equal((await request(`/v1/contacts/${other}/history`)).status, 404)
  const malicious = Buffer.from(JSON.stringify({ time: '2026-01-01T00:00:00Z),or(id.neq.null', id: own })).toString('base64url')
  assert.equal((await request(`/v1/contacts/${own}/history?before=${malicious}`)).status, 400)
  assert.equal((await request('/v1/contacts?page=-1')).status, 400)
  assert.equal((await request('/v1/contacts', { headers: { 'X-Fluxo-Tenant-Id': other } })).status, 403)
})
