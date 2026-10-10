import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { once } from 'node:events'
import { createHandler } from '../../services/monitor-api/app.mjs'
import { ApiError } from '../../services/monitor-api/errors.mjs'

const own = '11111111-1111-4111-8111-111111111111'
const other = '22222222-2222-4222-8222-222222222222'
async function fixture(t) {
  const saved = []
  const store = {
    authenticate: async token => { if (token !== 'valid.user.token') throw new ApiError(401, 'UNAUTHORIZED', 'Entre na sua conta.'); return { userId: 'owner', token } },
    list: async context => [{ id: own, user_id: context.userId }],
    create: async (context, url) => { saved.push({ userId: context.userId, url: url.href }); return { id: own } },
    setEnabled: async (context, id) => { if (id !== own) throw new ApiError(404, 'NOT_FOUND', 'Não encontrado.'); return { id } },
    claim: async (context, id) => { if (id !== own) throw new ApiError(404, 'NOT_FOUND', 'Não encontrado.'); return { id, url: 'https://site.com/' } },
    record: async (context, id, result) => { saved.push({ userId: context.userId, id, result }); return { ...result, monitor_id: id } }
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
})
test('invalid JSON, unsupported media and oversized bodies fail safely', async t => {
  const { request } = await fixture(t)
  assert.equal((await request('/v1/monitors', { method: 'POST', body: '{}' })).status, 415)
  assert.equal((await request('/v1/monitors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' })).status, 400)
  assert.equal((await request('/v1/monitors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: 'x'.repeat(9000) }) })).status, 413)
})
