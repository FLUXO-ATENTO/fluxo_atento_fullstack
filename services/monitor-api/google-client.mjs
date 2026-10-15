import { ApiError } from './errors.mjs'
import { GOOGLE_CALLBACK_URL, GOOGLE_SCOPES, exactGoogleScopes, pkceChallenge } from './google-crypto.mjs'

const AUTHORIZE_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const REVOKE_URL = 'https://oauth2.googleapis.com/revoke'
const ANALYTICS_URL = 'https://analyticsadmin.googleapis.com/v1beta/accountSummaries'
const SEARCH_URL = 'https://www.googleapis.com/webmasters/v3/sites'
const malformed = () => new ApiError(502, 'GOOGLE_INVALID_RESPONSE', 'O Google retornou uma resposta inesperada. Tente novamente.')
const validString = (value, maximum = 8192) => typeof value === 'string' && value.length > 0 && value.length <= maximum && !/[\u0000-\u0020\u007f]/.test(value)
const object = value => value && typeof value === 'object' && !Array.isArray(value)

function tokensFromResponse(data, { previous, now }) {
  if (!object(data) || !validString(data.access_token) || typeof data.token_type !== 'string' || data.token_type.toLowerCase() !== 'bearer'
    || !Number.isInteger(data.expires_in) || data.expires_in < 1 || data.expires_in > 86400) throw malformed()
  const refreshToken = data.refresh_token === undefined ? previous?.refresh_token : data.refresh_token
  // A new authorization must bring its own refresh token; never mix two Google identities.
  if (!validString(refreshToken)) throw new ApiError(409, 'GOOGLE_OFFLINE_ACCESS_REQUIRED', 'Reconecte e autorize o acesso Google para continuar.')
  const scopes = exactGoogleScopes(data.scope === undefined && previous ? previous.scopes : data.scope)
  return { access_token: data.access_token, refresh_token: refreshToken, expires_at: now + data.expires_in * 1000, scopes }
}

export function createGoogleClient({ config, fetchImpl = fetch, now = Date.now, timeoutMs = 8000, maxPages = 5, maxResources = 500 }) {
  // Limits are hard upper bounds even when a caller injects test settings.
  timeoutMs = Math.max(10, Math.min(timeoutMs, 8000))
  maxPages = Math.max(1, Math.min(maxPages, 5))
  maxResources = Math.max(1, Math.min(maxResources, 500))

  async function request(url, init = {}, { json = true, maxBytes = 524288 } = {}) {
    const controller = new AbortController()
    let timer
    const timeout = new Promise((_, reject) => {
      timer = setTimeout(() => {
        controller.abort()
        reject(new ApiError(504, 'GOOGLE_TIMEOUT', 'O Google demorou a responder. Tente novamente.'))
      }, timeoutMs)
    })
    try {
      return await Promise.race([timeout, (async () => {
        const response = await fetchImpl(url, { ...init, redirect: 'error', signal: controller.signal })
        if (Number(response.headers.get('content-length')) > maxBytes) throw malformed()
        const chunks = []; let length = 0
        if (response.body) {
          const reader = response.body.getReader()
          try {
            for (;;) {
              const { value, done } = await reader.read()
              if (done) break
              length += value.byteLength
              if (length > maxBytes) { await reader.cancel(); throw malformed() }
              chunks.push(Buffer.from(value))
            }
          } finally { reader.releaseLock() }
        }
        let data = null
        const text = Buffer.concat(chunks).toString('utf8')
        if (json || !response.ok) {
          try { data = text ? JSON.parse(text) : null } catch { throw malformed() }
        }
        if (!response.ok) {
          if (response.status === 401 || (url === TOKEN_URL && data?.error === 'invalid_grant')) {
            throw new ApiError(409, 'GOOGLE_RECONNECT_REQUIRED', 'Reconecte o Google para continuar.')
          }
          if (response.status === 403) throw new ApiError(502, 'GOOGLE_FORBIDDEN', 'Confira as APIs habilitadas e as permissões no Google.')
          if (response.status === 429) throw new ApiError(503, 'GOOGLE_RATE_LIMIT', 'O Google atingiu um limite temporário. Tente mais tarde.')
          throw new ApiError(502, 'GOOGLE_UNAVAILABLE', 'Não foi possível consultar o Google. Tente novamente.')
        }
        if (json && (!response.headers.get('content-type')?.toLowerCase().includes('application/json') || !object(data))) throw malformed()
        if (!json && response.status !== 200) throw malformed()
        return data
      })()])
    } catch (error) {
      if (error instanceof ApiError) throw error
      throw new ApiError(502, 'GOOGLE_UNAVAILABLE', 'Não foi possível consultar o Google. Tente novamente.')
    } finally { clearTimeout(timer); controller.abort() }
  }

  const form = body => ({ method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' }, body: new URLSearchParams(body).toString() })
  const headers = token => ({ headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } })

  return {
    authorizationUrl(state, verifier) {
      const url = new URL(AUTHORIZE_URL)
      url.search = new URLSearchParams({ client_id: config.clientId, redirect_uri: GOOGLE_CALLBACK_URL, response_type: 'code',
        scope: GOOGLE_SCOPES.join(' '), access_type: 'offline', prompt: 'consent', include_granted_scopes: 'false',
        state, code_challenge: pkceChallenge(verifier), code_challenge_method: 'S256' }).toString()
      return url.toString()
    },
    async exchange(code, verifier) {
      const data = await request(TOKEN_URL, form({ client_id: config.clientId, client_secret: config.clientSecret, code,
        code_verifier: verifier, redirect_uri: GOOGLE_CALLBACK_URL, grant_type: 'authorization_code' }), { maxBytes: 32768 })
      return tokensFromResponse(data, { now: now() })
    },
    async refresh(previous) {
      const data = await request(TOKEN_URL, form({ client_id: config.clientId, client_secret: config.clientSecret,
        refresh_token: previous.refresh_token, grant_type: 'refresh_token' }), { maxBytes: 32768 })
      return tokensFromResponse(data, { previous, now: now() })
    },
    async revoke(token) { await request(REVOKE_URL, form({ token }), { json: false, maxBytes: 16384 }) },
    async analytics(token) {
      const items = []; const seen = new Set(); const pages = new Set(); let pageToken = ''
      for (let page = 0; page < maxPages; page++) {
        const url = new URL(ANALYTICS_URL)
        url.searchParams.set('pageSize', '100')
        if (pageToken) url.searchParams.set('pageToken', pageToken)
        const data = await request(url.toString(), headers(token))
        if (Object.keys(data).some(key => !['accountSummaries', 'nextPageToken'].includes(key))) throw malformed()
        if (data.accountSummaries !== undefined && !Array.isArray(data.accountSummaries)) throw malformed()
        for (const account of data.accountSummaries || []) {
          if (!object(account) || (account.propertySummaries !== undefined && !Array.isArray(account.propertySummaries))) throw malformed()
          for (const property of account.propertySummaries || []) {
            if (!object(property) || typeof property.property !== 'string' || !/^properties\/[0-9]{1,30}$/.test(property.property)
              || typeof property.displayName !== 'string' || property.displayName.length > 500) throw malformed()
            if (!seen.has(property.property)) {
              if (items.length >= maxResources) return { items, truncated: true }
              seen.add(property.property)
              items.push({ id: property.property, name: property.displayName,
                ...(typeof account.displayName === 'string' ? { account_name: account.displayName.slice(0, 500) } : {}) })
            }
          }
        }
        if (data.nextPageToken === undefined || data.nextPageToken === '') return { items, truncated: false }
        if (!validString(data.nextPageToken, 2048) || pages.has(data.nextPageToken)) throw malformed()
        pageToken = data.nextPageToken; pages.add(pageToken)
      }
      return { items, truncated: true }
    },
    async searchConsole(token) {
      const data = await request(SEARCH_URL, headers(token))
      if (Object.keys(data).some(key => key !== 'siteEntry')) throw malformed()
      if (data.siteEntry !== undefined && !Array.isArray(data.siteEntry)) throw malformed()
      const items = []
      for (const site of (data.siteEntry || []).slice(0, maxResources)) {
        if (!object(site) || typeof site.siteUrl !== 'string' || site.siteUrl.length > 2048
          || !/^(https?:\/\/|sc-domain:)[^\s]+$/.test(site.siteUrl)
          || !['siteOwner', 'siteFullUser', 'siteRestrictedUser', 'siteUnverifiedUser'].includes(site.permissionLevel)) throw malformed()
        items.push({ id: site.siteUrl, name: site.siteUrl, permission: site.permissionLevel })
      }
      return { items, truncated: (data.siteEntry?.length || 0) > maxResources }
    }
  }
}
