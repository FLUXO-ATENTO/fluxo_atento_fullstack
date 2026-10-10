import test from 'node:test'
import assert from 'node:assert/strict'
import { publicAddress, normalizeTarget, resolveTarget, checkWebsite } from '../../services/monitor-api/probe.mjs'

test('blocks private, reserved, metadata, mapped IPv6 and the VPS itself', () => {
  for (const value of ['127.0.0.1', '10.2.3.4', '172.31.1.2', '192.168.1.1', '169.254.169.254', '100.64.0.1', '0.0.0.0', '224.0.0.1', '198.19.0.1', '192.0.2.1', '::1', '::ffff:8.8.8.8', 'fc00::1', 'fe80::1', '2001:db8::1', '2002:0808:0808::1', '3fff::1', '2.25.230.180']) {
    assert.equal(publicAddress(value, ['2.25.230.180']), false, value)
  }
  assert.equal(publicAddress('8.8.8.8'), true)
  assert.equal(publicAddress('2606:4700:4700::1111'), true)
})
test('normalizes allowed addresses and rejects credentials, port, query, local and numeric hosts', () => {
  assert.equal(normalizeTarget(' loja.example.com/contato ').href, 'https://loja.example.com/contato')
  for (const value of ['http://127.1', 'http://2130706433', 'http://0x7f000001', 'http://[::1]', 'https://user:pass@site.com', 'https://site.com?token=abc', 'https://site.com#secret', 'http://site.com:5678', 'file:///etc/passwd', 'https://host.local', 'https://localhost', 'https://host.internal', 'https://site.com.', 'a b.com', '', null]) {
    assert.throws(() => normalizeTarget(value), undefined, String(value))
  }
})
test('rejects the entire DNS set if any answer is private', async () => {
  await assert.rejects(resolveTarget('https://site.com', { resolver: async () => [{ address: '8.8.8.8', family: 4 }, { address: '127.0.0.1', family: 4 }] }), { code: 'BLOCKED_TARGET' })
})
test('pins the validated address, validates every redirect, and never requests a private redirect', async () => {
  const requested = []
  const result = await checkWebsite('https://site.com', {
    resolver: async host => [{ address: host === 'private.com' ? '10.0.0.1' : '8.8.8.8', family: 4 }],
    request: async target => { requested.push(target.address); return { status: 302, location: 'https://private.com/secret' } }
  })
  assert.deepEqual(requested, ['8.8.8.8'])
  assert.equal(result.status, 'failed')
  assert.equal(result.http_status, null)
})
test('a 200 observation is limited to HTTP; 405 is not reported as site down', async () => {
  const resolver = async () => [{ address: '8.8.8.8', family: 4 }]
  const ok = await checkWebsite('site.com', { resolver, request: async () => ({ status: 200 }) })
  assert.equal(ok.status, 'ok'); assert.match(ok.detail, /não testa formulários/)
  const unsupported = await checkWebsite('site.com', { resolver, request: async () => ({ status: 405 }) })
  assert.equal(unsupported.status, 'attention'); assert.match(unsupported.detail, /não comprova/)
})
test('redirect loops stop and infrastructure errors never leak stack traces', async () => {
  let calls = 0
  const resolver = async () => [{ address: '8.8.8.8', family: 4 }]
  const result = await checkWebsite('site.com', { resolver, request: async () => { calls++; return { status: 301, location: '/' } } })
  assert.equal(calls, 4); assert.equal(result.status, 'failed')
  const failed = await checkWebsite('site.com', { resolver: async () => { throw new Error('secret database URL') } })
  assert.doesNotMatch(JSON.stringify(failed), /secret database URL/)
})
