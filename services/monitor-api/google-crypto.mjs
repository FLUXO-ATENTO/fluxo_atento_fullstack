import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'
import { ApiError } from './errors.mjs'

export const GOOGLE_SCOPES = Object.freeze([
  'https://www.googleapis.com/auth/analytics.readonly',
  'https://www.googleapis.com/auth/webmasters.readonly'
])
export const GOOGLE_CALLBACK_URL = 'https://api.fluxoatento.com.br/v1/integrations/google/callback'
export const GOOGLE_RETURN_URL = 'https://app.fluxoatento.com.br/canais'
export const GOOGLE_COOKIE = '__Host-fluxo-google-oauth'
export const OAUTH_TTL_SECONDS = 600
export const randomOpaque = () => randomBytes(32).toString('base64url')
export const sha256 = value => createHash('sha256').update(value).digest('hex')
export const pkceChallenge = verifier => createHash('sha256').update(verifier).digest('base64url')

export function googleConfigFromEnv(env = {}) {
  let encryptionKey = null
  const encoded = env.GOOGLE_TOKEN_ENCRYPTION_KEY || ''
  if (/^[A-Za-z0-9+/]{43}=$/.test(encoded)) {
    const decoded = Buffer.from(encoded, 'base64')
    if (decoded.length === 32 && decoded.toString('base64') === encoded) encryptionKey = decoded
  }
  const clientId = env.GOOGLE_INTEGRATION_CLIENT_ID || ''
  const clientSecret = env.GOOGLE_INTEGRATION_CLIENT_SECRET || ''
  return {
    clientId: /^[A-Za-z0-9_-]{3,200}\.apps\.googleusercontent\.com$/.test(clientId) ? clientId : '',
    clientSecret: typeof clientSecret === 'string' && clientSecret.length >= 16 && clientSecret.length <= 4096 && !/\s/.test(clientSecret) ? clientSecret : '',
    encryptionKey,
    callbackConfigured: env.GOOGLE_OAUTH_REDIRECT_URL === GOOGLE_CALLBACK_URL
  }
}

export function configurationChecks(config) {
  return [
    { id: 'client_id', label: 'Client ID Google de dados no servidor', configured: Boolean(config.clientId) },
    { id: 'client_secret', label: 'Client Secret Google de dados no servidor', configured: Boolean(config.clientSecret) },
    { id: 'encryption_key', label: 'Chave privada AES-256 de 32 bytes', configured: Buffer.isBuffer(config.encryptionKey) && config.encryptionKey.length === 32 },
    { id: 'callback_url', label: 'Callback HTTPS exato da API', configured: config.callbackConfigured === true }
  ]
}

const cryptoError = () => new ApiError(409, 'GOOGLE_RECONNECT_REQUIRED', 'Reconecte o Google para continuar.')
const aad = (purpose, tenantId, userId) => Buffer.from(JSON.stringify(['fluxo-google', 1, purpose, tenantId, userId]))

// Purpose and tenant/user identifiers authenticate the envelope, not merely its ciphertext.
export function encryptGoogleSecret(key, value, { purpose, tenantId, userId }) {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  cipher.setAAD(aad(purpose, tenantId, userId))
  const plaintext = Buffer.from(JSON.stringify(value))
  if (plaintext.length > 32768) throw cryptoError()
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()])
  return { v: 1, alg: 'A256GCM', iv: iv.toString('base64url'), tag: cipher.getAuthTag().toString('base64url'), ciphertext: ciphertext.toString('base64url') }
}

export function decryptGoogleSecret(key, envelope, { purpose, tenantId, userId }) {
  try {
    if (!envelope || envelope.v !== 1 || envelope.alg !== 'A256GCM'
      || !/^[\w-]{16}$/.test(envelope.iv) || !/^[\w-]{22}$/.test(envelope.tag)
      || typeof envelope.ciphertext !== 'string' || !/^[\w-]{1,44000}$/.test(envelope.ciphertext)) throw cryptoError()
    const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(envelope.iv, 'base64url'))
    decipher.setAAD(aad(purpose, tenantId, userId))
    decipher.setAuthTag(Buffer.from(envelope.tag, 'base64url'))
    return JSON.parse(Buffer.concat([decipher.update(Buffer.from(envelope.ciphertext, 'base64url')), decipher.final()]).toString('utf8'))
  } catch { throw cryptoError() }
}

export function exactGoogleScopes(value) {
  const scopes = typeof value === 'string' ? value.trim().split(/\s+/) : value
  if (!Array.isArray(scopes) || scopes.length !== GOOGLE_SCOPES.length || new Set(scopes).size !== scopes.length
    || scopes.some(scope => !GOOGLE_SCOPES.includes(scope))) {
    throw new ApiError(409, 'GOOGLE_SCOPES_REQUIRED', 'Autorize somente a leitura do Analytics e do Search Console.')
  }
  return [...GOOGLE_SCOPES]
}

export function oauthCookie(nonce = '') {
  return `${GOOGLE_COOKIE}=${nonce}; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=${nonce ? OAUTH_TTL_SECONDS : 0}`
}

export function readOAuthCookie(header = '') {
  if (typeof header !== 'string' || header.length > 8192) return null
  const values = header.split(';').map(value => value.trim()).filter(value => value.startsWith(`${GOOGLE_COOKIE}=`))
  if (values.length !== 1) return null
  const nonce = values[0].slice(GOOGLE_COOKIE.length + 1)
  return /^[A-Za-z0-9_-]{43}$/.test(nonce) ? nonce : null
}
