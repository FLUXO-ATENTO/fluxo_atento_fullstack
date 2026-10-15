import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { CAPTCHA_MAX_AGE_MS, captchaIsEnabled, captchaProofIsFresh, captchaRequestOptions, submitEmailAuth } from '../../app/utils/auth-captcha.ts'

test('CAPTCHA is an explicit opt-in and disabled mode sends no token', () => {
  for (const value of [undefined, '', 'false', false, '1']) assert.equal(captchaIsEnabled(value), false)
  for (const value of [true, 'true']) assert.equal(captchaIsEnabled(value), true)
  assert.deepEqual(captchaRequestOptions(false, null), {})
})

test('required CAPTCHA rejects absent, malformed, expired and future proofs', () => {
  const now = 500_000
  for (const proof of [null, { token: '', issuedAt: now }, { token: ' ', issuedAt: now },
    { token: 'x'.repeat(2049), issuedAt: now }, { token: 'synthetic', issuedAt: now - CAPTCHA_MAX_AGE_MS },
    { token: 'synthetic', issuedAt: now + 1 }, { token: 'synthetic', issuedAt: NaN }]) {
    assert.equal(captchaProofIsFresh(proof, now), false)
    assert.throws(() => captchaRequestOptions(true, proof, now), /verificação de segurança/)
  }
  const proof = { token: 'synthetic', issuedAt: now - 1 }
  assert.deepEqual(captchaRequestOptions(true, proof, now), { captchaToken: 'synthetic' })
})

for (const mode of ['login', 'signup', 'recover']) {
  test(`${mode} passes the challenge to the matching Supabase Auth method`, async () => {
    const calls = []
    const record = name => async (...args) => { calls.push({ name, args }); return { data: { session: null }, error: null } }
    const client = { signInWithPassword: record('password'), signUp: record('signup'), resetPasswordForEmail: record('recover') }
    const input = { mode, email: ' qa@example.test ', password: 'synthetic-password', fullName: ' QA ', origin: 'https://app.example.test' }
    await assert.rejects(submitEmailAuth(client, input, true, null), /verificação/)
    assert.equal(calls.length, 0, 'must fail before any Auth request')
    const proof = { token: 'test-proof', issuedAt: Date.now() }
    assert.deepEqual(await submitEmailAuth(client, input, true, proof), { error: null, session: null })
    assert.equal(calls.length, 1)
    const request = calls[0]
    assert.equal(request.name, mode === 'login' ? 'password' : mode)
    const options = mode === 'recover' ? request.args[1] : request.args[0].options
    assert.equal(options.captchaToken, proof.token)
    if (mode === 'signup') {
      assert.deepEqual(options.data, { full_name: 'QA' })
      assert.equal(options.emailRedirectTo, 'https://app.example.test/auth/callback')
    }
    if (mode === 'recover') assert.equal(options.redirectTo, 'https://app.example.test/recuperar-acesso')
  })
}

test('challenge failure is returned, not converted into an authenticated session', async () => {
  const error = { code: 'captcha_failed' }
  const client = { signInWithPassword: async () => ({ data: { session: null }, error }) }
  const result = await submitEmailAuth(client, { mode: 'login', email: 'qa@example.test', password: 'fixture', fullName: '', origin: 'https://app.example.test' }, true, { token: 'test-proof', issuedAt: Date.now() })
  assert.equal(result.error, error)
  assert.equal(result.session, null)
})

test('widget lifecycle and login reset remove a previously consumed proof', () => {
  const widget = readFileSync(new URL('../../app/components/AuthTurnstile.vue', import.meta.url), 'utf8')
  const login = readFileSync(new URL('../../app/pages/login.vue', import.meta.url), 'utf8')
  assert.match(widget, /'expired-callback':.*invalidate\('expired'\)/)
  assert.match(widget, /'error-callback':.*invalidate\('error'\)/)
  assert.match(widget, /onBeforeUnmount\(.*clearWidget\(\)/)
  assert.match(widget, /props\.action, props\.resetKey, effectiveTheme\.value/)
  assert.match(widget, /setTimeout\(.*CAPTCHA_MAX_AGE_MS/)
  assert.match(login, /finally \{ busy\.value = false; password\.value = ''; resetCaptcha\(\)/)
  assert.match(login, /function setMode[^\n]+resetCaptcha\(\)/)
})

test('dashboard CSP allows only the Cloudflare script/frame host, not arbitrary scripts', () => {
  const nginx = readFileSync(new URL('../../ops/dashboard-vps/nginx-app-https.conf', import.meta.url), 'utf8')
  assert.match(nginx, /script-src 'self' https:\/\/challenges\.cloudflare\.com;/)
  assert.match(nginx, /frame-src https:\/\/challenges\.cloudflare\.com;/)
  assert.doesNotMatch(nginx, /script-src[^;]*(?:unsafe-inline|unsafe-eval|\*)/)
})
