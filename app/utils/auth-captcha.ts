import type { SupabaseClient } from '@supabase/supabase-js'

export type CaptchaProof = { token: string; issuedAt: number }
export type EmailAuthMode = 'login' | 'signup' | 'recover'
export const CAPTCHA_MAX_AGE_MS = 295_000

export function captchaIsEnabled(value: unknown): boolean {
  return value === true || value === 'true'
}

// UX guard only. Supabase Auth must enforce the challenge on the server.
export function captchaProofIsFresh(proof: CaptchaProof | null, now = Date.now()): boolean {
  return Boolean(proof && typeof proof.token === 'string' && proof.token.trim().length > 0
    && proof.token.length <= 2048 && Number.isFinite(proof.issuedAt)
    && now >= proof.issuedAt && now - proof.issuedAt < CAPTCHA_MAX_AGE_MS)
}

export function captchaRequestOptions(required: boolean, proof: CaptchaProof | null, now = Date.now()): { captchaToken?: string } {
  if (!required) return {}
  if (!captchaProofIsFresh(proof, now)) throw new Error('Conclua a verificação de segurança antes de continuar.')
  return { captchaToken: proof!.token }
}

type EmailAuthClient = Pick<SupabaseClient['auth'], 'signInWithPassword' | 'signUp' | 'resetPasswordForEmail'>
type EmailAuthInput = { mode: EmailAuthMode; email: string; password: string; fullName: string; origin: string }

export async function submitEmailAuth(auth: EmailAuthClient, input: EmailAuthInput, required: boolean, proof: CaptchaProof | null) {
  const captcha = captchaRequestOptions(required, proof)
  const email = input.email.trim()
  if (input.mode === 'recover') {
    const result = await auth.resetPasswordForEmail(email, { redirectTo: input.origin + '/recuperar-acesso', ...captcha })
    return { error: result.error, session: null }
  }
  if (input.mode === 'signup') {
    const result = await auth.signUp({ email, password: input.password, options: {
      emailRedirectTo: input.origin + '/auth/callback', data: { full_name: input.fullName.trim() }, ...captcha
    } })
    return { error: result.error, session: result.data.session }
  }
  const result = await auth.signInWithPassword({ email, password: input.password, options: captcha })
  return { error: result.error, session: result.data.session }
}
