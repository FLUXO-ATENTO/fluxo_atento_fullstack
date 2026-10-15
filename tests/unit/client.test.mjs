import test from 'node:test'
import assert from 'node:assert/strict'
import { publicSupabaseConfig, safeReturnPath } from '../../app/utils/auth-config.ts'
import { publicErrorMessage } from '../../app/utils/monitor-response.ts'
import { normalizeWebsiteUrl } from '../../app/utils/website.ts'
const jwt = role => 'eyJhbGciOiJIUzI1NiJ9.' + Buffer.from(JSON.stringify({ role })).toString('base64url') + '.signature'
test('frontend accepts public keys only; no admin keys, credentials in URL or malformed legacy JWT', () => {
  assert.ok(publicSupabaseConfig('https://project.supabase.co', 'sb_publishable_test'))
  assert.ok(publicSupabaseConfig('https://project.supabase.co', jwt('anon')))
  for (const key of ['sb_secret_test', jwt('service_role'), jwt('authenticated'), 'eyJbroken', '', undefined]) assert.equal(publicSupabaseConfig('https://project.supabase.co', key), null)
  assert.equal(publicSupabaseConfig('https://' + ['user', 'pass'].join(':') + '@project.supabase.co', 'sb_publishable_test'), null)
})
test('login return path cannot be used for an open redirect or token forwarding', () => {
  assert.equal(safeReturnPath('/dashboard/monitores'), '/dashboard/monitores')
  for (const path of ['//evil.test', '/dashboard/../evil', 'https://evil.test', '/dashboard?token=x', '/dashboard%2f..', null]) assert.equal(safeReturnPath(path), '/dashboard')
})
test('dedicated dashboard accepts only local application paths after login', () => {
  assert.equal(safeReturnPath('/', true), '/')
  assert.equal(safeReturnPath('/monitores', true), '/monitores')
  assert.equal(safeReturnPath('/modulos/recuperaia', true), '/modulos/recuperaia')
  for (const path of ['//evil.test', '/monitores?token=x', '/modulos/../login', 'https://evil.test', null]) assert.equal(safeReturnPath(path, true), '/')
})
test('remote errors are mapped to public text, never printed verbatim', () => {
  assert.doesNotMatch(publicErrorMessage(503, { error: { message: 'password=secret' } }), /secret/)
  assert.match(publicErrorMessage(404, null), /não está disponível/)
  assert.match(publicErrorMessage(429, null), /Aguarde/)
})
test('frontend input validation catches credentials and normalizes URLs', () => {
  assert.deepEqual(normalizeWebsiteUrl('loja.com.br'), { valid: true, url: 'https://loja.com.br/' })
  assert.equal(normalizeWebsiteUrl('https://' + ['u', 'p'].join(':') + '@loja.com.br').valid, false)
})
