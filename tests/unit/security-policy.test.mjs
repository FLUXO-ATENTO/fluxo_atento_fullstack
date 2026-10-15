import test from 'node:test'
import assert from 'node:assert/strict'
import { publicEnvironmentFindings, sensitiveTextFindings } from '../../scripts/security-policy.mjs'

const fakeKey = () => ['sk', 'proj', 'x'.repeat(32)].join('-')
const jwt = role => 'eyJhbGciOiJIUzI1NiJ9.' + Buffer.from(JSON.stringify({ role })).toString('base64url') + '.signature'

test('public configuration uses an explicit allowlist, including innocently named variables', () => {
  assert.equal(publicEnvironmentFindings({ NUXT_PUBLIC_SUPABASE_URL: 'https://project.supabase.co', NUXT_PUBLIC_SUPABASE_KEY: 'sb_publishable_fixture', NUXT_PUBLIC_APP_MODE: 'dashboard' }).length, 0)
  for (const name of ['NUXT_PUBLIC_OPENAI_API_KEY', 'NUXT_PUBLIC_ANALYTICS', 'NUXT_PUBLIC_TOKEN']) {
    assert.equal(publicEnvironmentFindings({ [name]: 'any-value' }).length, 1)
  }
  assert.equal(publicEnvironmentFindings({ OPENAI_API_KEY: fakeKey() }).length, 0)
})

test('keys cannot be smuggled through an approved public variable', () => {
  for (const value of [fakeKey(), 'sb_' + 'secret_' + 'x'.repeat(32), jwt('service_role'), jwt('authenticated'), 'not-a-key']) {
    assert.equal(publicEnvironmentFindings({ NUXT_PUBLIC_SUPABASE_KEY: value }).length, 1)
  }
  assert.equal(publicEnvironmentFindings({ NUXT_PUBLIC_SUPABASE_KEY: jwt('anon') }).length, 0)
})

test('public URLs reject embedded credentials and token query parameters', () => {
  for (const value of ['https://' + ['u', 'p'].join(':') + '@site.test/', 'https://site.test/?token=example', 'https://site.test/#access_token=example', 'javascript:alert(1)']) {
    assert.equal(publicEnvironmentFindings({ NUXT_PUBLIC_API_BASE: value }).length, 1)
  }
})

test('dashboard entry rollout accepts only the two declared modes', () => {
  for (const mode of ['login', 'guided']) {
    assert.deepEqual(publicEnvironmentFindings({ NUXT_PUBLIC_DASHBOARD_ENTRY_MODE: mode }), [])
  }
  for (const mode of ['true', '/acessar', 'https://evil.test', 'invalid']) {
    assert.deepEqual(publicEnvironmentFindings({ NUXT_PUBLIC_DASHBOARD_ENTRY_MODE: mode }), [
      { name: 'NUXT_PUBLIC_DASHBOARD_ENTRY_MODE', type: 'invalid-dashboard-entry-mode' }
    ])
  }
})

test('artifact findings contain categories and line numbers, never values', () => {
  const secret = fakeKey()
  const findings = sensitiveTextFindings('public line\n' + secret)
  assert.deepEqual(findings, [{ type: 'provider-secret', line: 2 }])
  assert.equal(JSON.stringify(findings).includes(secret), false)
  assert.equal(sensitiveTextFindings('sb_publishable_fixture').length, 0)
  assert.equal(sensitiveTextFindings(jwt('anon')).length, 0)
  assert.equal(sensitiveTextFindings(jwt('service_role')).length, 1)
})

test('Turnstile accepts only a public site key and requires it when enabled', () => {
  const publicKey = '0x' + 'A'.repeat(22)
  assert.deepEqual(publicEnvironmentFindings({ NUXT_PUBLIC_TURNSTILE_ENABLED: 'true', NUXT_PUBLIC_TURNSTILE_SITE_KEY: publicKey }), [])
  assert.equal(publicEnvironmentFindings({ NUXT_PUBLIC_TURNSTILE_ENABLED: 'true' }).length, 1)
  assert.equal(publicEnvironmentFindings({ NUXT_PUBLIC_TURNSTILE_ENABLED: 'yes' }).length, 1)
  assert.equal(publicEnvironmentFindings({ NUXT_PUBLIC_TURNSTILE_SITE_KEY: '0x4' + 'A'.repeat(32) }).length, 1)
  assert.equal(publicEnvironmentFindings({ NUXT_PUBLIC_TURNSTILE_SECRET_KEY: 'anything' }).length, 1)
  const testKey = '1x' + '0'.repeat(18) + 'AA'
  assert.deepEqual(publicEnvironmentFindings({ NUXT_PUBLIC_TURNSTILE_SITE_KEY: testKey }), [])
  assert.equal(publicEnvironmentFindings({ NUXT_PUBLIC_TURNSTILE_SITE_KEY: testKey, NODE_ENV: 'production' }).length, 1)
  assert.equal(publicEnvironmentFindings({ NUXT_PUBLIC_TURNSTILE_SITE_KEY: testKey, CONTEXT: 'production' }).length, 1)
  assert.deepEqual(sensitiveTextFindings('0x4' + 'A'.repeat(32)), [{ type: 'turnstile-secret', line: 1 }])
})
