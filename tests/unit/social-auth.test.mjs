import test from 'node:test'
import assert from 'node:assert/strict'
import { enabledSocialProviders, socialAuthOptions } from '../../app/utils/social-auth.ts'
import { displayProfile, profileGreeting } from '../../app/utils/workspace-ui.ts'
import { publicEnvironmentFindings } from '../../scripts/security-policy.mjs'
import { readFileSync } from 'node:fs'

const login = readFileSync(new URL('../../app/pages/login.vue', import.meta.url), 'utf8')
const googleButton = readFileSync(new URL('../../app/components/GoogleAuthButton.vue', import.meta.url), 'utf8')

test('social login is off until explicitly enabled and Facebook is integration-only', () => {
  assert.deepEqual(enabledSocialProviders(''), [])
  assert.deepEqual(enabledSocialProviders('google,github,google,facebook'), ['google', 'github'])
  assert.equal(publicEnvironmentFindings({ NUXT_PUBLIC_AUTH_PROVIDERS: 'google,github' }).length, 0)
  assert.equal(publicEnvironmentFindings({ NUXT_PUBLIC_AUTH_PROVIDERS: 'facebook' })[0].type, 'invalid-auth-provider')
})
test('OAuth requests only login with an exact callback, never advertising or repository scopes', () => {
  for (const provider of ['google', 'github']) assert.deepEqual(socialAuthOptions(provider, 'https://app.fluxoatento.com.br'), { provider, options: { redirectTo: 'https://app.fluxoatento.com.br/auth/callback' } })
  assert.throws(() => socialAuthOptions('github', 'http://app.fluxoatento.com.br'))
  assert.throws(() => socialAuthOptions('google', 'https://example.test/path?next=evil'))
})
test('Google keeps the Supabase OAuth action while using a dedicated branded button', () => {
  assert.match(login, /<GoogleAuthButton v-if="googleEnabled"/)
  assert.match(login, /@activate="signInWithProvider\('google'\)"/)
  assert.match(login, /v-if="githubEnabled"/)
  assert.doesNotMatch(login, /v-for="provider/)
  assert.match(googleButton, /Continuar com o Google/)
  assert.match(googleButton, /fill="#4285f4"/)
  assert.match(googleButton, /#131314/)
  assert.match(googleButton, /#8e918f/)
})
test('password and social profiles populate the greeting, with a neutral fallback when name is absent', () => {
  assert.equal(profileGreeting(displayProfile({ id: 'one', user_metadata: { full_name: '  Ana Maria  ', role: 'superadmin' } })), 'Olá, Ana')
  assert.equal(profileGreeting(displayProfile({ id: 'two', user_metadata: { name: 'João Silva' } })), 'Olá, João')
  assert.equal(profileGreeting(displayProfile({ id: 'three', email: 'person@example.test' })), 'Boas-vindas')
  assert.equal(profileGreeting(null), 'Boas-vindas')
})
