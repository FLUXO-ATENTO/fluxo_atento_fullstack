import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { googleAuthorizationUrl, googleConnectionLabel, googleReturnMessage, googleApiError, googleDisconnectMessage } from '../../app/utils/google-integration.ts'

test('Google authorization accepts only the official HTTPS code-flow endpoint', () => {
  const valid = 'https://accounts.google.com/o/oauth2/v2/auth?response_type=code&state=fixture'
  assert.equal(googleAuthorizationUrl(valid), valid)
  for (const input of [undefined, '', '//accounts.google.com/o/oauth2/v2/auth', 'javascript:alert(1)', 'https://accounts.google.com.evil.test/o/oauth2/v2/auth?response_type=code', 'https://accounts.google.com@evil.test/o/oauth2/v2/auth?response_type=code', 'https://accounts.google.com/o/oauth2/v2/auth?response_type=token', valid + '#token', valid.replace('https:', 'http:')]) assert.equal(googleAuthorizationUrl(input), null)
})

test('Return query cannot mark a Google connection as successful or reflect raw errors', () => {
  assert.equal(googleConnectionLabel(null), 'Situação não confirmada')
  assert.equal(googleConnectionLabel({ available: false, connection: null }), 'Aguardando liberação')
  assert.equal(googleConnectionLabel({ available: true, connection: null }), 'Pronta para conectar')
  assert.equal(googleReturnMessage('<script>bad</script>'), '')
  assert.equal(googleReturnMessage(['connected']), '')
  assert.match(googleReturnMessage('connected'), /Confira abaixo/)
  assert.doesNotMatch(googleReturnMessage('connected'), /sucesso|conectada/i)
  assert.match(googleApiError(404), /ainda não foi publicada/)
  assert.match(googleApiError(409, 'GOOGLE_OAUTH_IN_PROGRESS'), /autorização Google em andamento/)
  assert.doesNotMatch(googleApiError(503, 'private-server-error'), /private-server/)
})

test('Connection controls use server status, a tenant-scoped API and review confirmations', () => {
  const tenant = readFileSync(new URL('../../app/components/workspace/GoogleTenantPanel.vue', import.meta.url), 'utf8')
  const provider = readFileSync(new URL('../../app/components/workspace/GoogleProviderPanel.vue', import.meta.url), 'utf8')
  const api = readFileSync(new URL('../../app/composables/useGoogleApi.ts', import.meta.url), 'utf8')
  assert.match(tenant, /googleAuthorizationUrl\(result.authorization_url\)/)
  assert.match(tenant, /v-model:open="connectOpen"/)
  assert.match(tenant, /v-model:open="disconnectOpen"/)
  assert.match(tenant, /resources\.errors\?\.analytics/)
  assert.match(provider, /v-model:open="confirmOpen"/)
  assert.match(provider, /não comprova configuração/)
  assert.match(api, /'X-Fluxo-Tenant-Id': tenant.id/)
  assert.match(api, /credentials: 'include'/)
  assert.match(api, /workspace.activeTenant.value\?\.id !== tenant.id/)
  assert.doesNotMatch(tenant + provider, /type="password"|v-model=".*secret/i)
})

test('Disconnect reports the real revocation contract, including broader Google grants', () => {
  assert.match(googleDisconnectMessage({ disconnected: true, revocation: 'failed' }), /não foi confirmada/)
  assert.match(googleDisconnectMessage({ disconnected: true, revocation: 'succeeded' }), /Outras conexões/)
  assert.match(googleDisconnectMessage({ disconnected: true, revocation: 'not_needed' }), /não pôde ser confirmado/)
  assert.match(googleDisconnectMessage({ disconnected: false, revocation: 'failed' }), /remoção não foi confirmada/)
})

test('Deployment proxy template avoids OAuth URL logs and allows bounded discovery', () => {
  const proxy = readFileSync(new URL('../../ops/nginx-monitor-location.conf', import.meta.url), 'utf8')
  const callback = proxy.match(/location = \/v1\/integrations\/google\/callback \{([^}]+)\}/)?.[1] || ''
  assert.match(callback, /access_log off;/)
  assert.match(callback, /error_log \/dev\/null;/)
  assert.match(proxy, /proxy_read_timeout 60s;/)
})
