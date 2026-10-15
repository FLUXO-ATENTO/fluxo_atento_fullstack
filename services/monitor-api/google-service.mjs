import { ApiError } from './errors.mjs'
import { createGoogleClient } from './google-client.mjs'
import { GOOGLE_CALLBACK_URL, GOOGLE_RETURN_URL, GOOGLE_SCOPES, configurationChecks, googleConfigFromEnv,
  randomOpaque, sha256, encryptGoogleSecret, decryptGoogleSecret, exactGoogleScopes, oauthCookie, readOAuthCookie } from './google-crypto.mjs'

const disabled = () => new ApiError(409, 'GOOGLE_DISABLED', 'A integração Google ainda não está disponível.')
const changed = () => new ApiError(409, 'GOOGLE_CONNECTION_CHANGED', 'A conexão foi alterada. Atualize a página e tente novamente.')
const reconnect = () => new ApiError(409, 'GOOGLE_RECONNECT_REQUIRED', 'Reconecte o Google para continuar.')

export function createGoogleService({ store, config = googleConfigFromEnv(), fetchImpl = fetch, now = Date.now, timeoutMs = 8000, maxPages, maxResources }) {
  const client = createGoogleClient({ config, fetchImpl, now, timeoutMs, maxPages, maxResources })
  const counters = new Map()
  const callbackCounters = new Map()
  const busy = new Set()
  let activeOperations = 0

  function rateLimit(key, maximum = 20, bucket = counters) {
    const time = now()
    for (const [id, entry] of bucket) if (entry.until <= time) bucket.delete(id)
    if (!bucket.has(key) && bucket.size >= 5000) throw new ApiError(503, 'GOOGLE_BUSY', 'Tente novamente em instantes.')
    const entry = bucket.get(key) || { count: 0, until: time + 60000 }
    entry.count++; bucket.set(key, entry)
    if (entry.count > maximum) throw new ApiError(429, 'RATE_LIMIT', 'Muitas solicitações. Aguarde um minuto.')
  }

  async function inspect() {
    const db = store ? await store.inspect() : { schemaAvailable: false, enabled: false }
    const checks = [...configurationChecks(config), { id: 'schema', label: 'Persistência privada Google disponível', configured: db.schemaAvailable }]
    return { enabled: db.enabled, ready: checks.every(check => check.configured), checks, callback_url: GOOGLE_CALLBACK_URL,
      scopes: [...GOOGLE_SCOPES], external_apis_verified: false, updated_at: db.updated_at || null, updated_by: db.updated_by || null }
  }

  async function available() {
    const status = await inspect()
    if (!status.enabled || !status.ready) throw disabled()
    return status
  }

  async function assertMember(context, tenantId, admin = false) {
    if (!store) throw disabled()
    await store.assertMember(tenantId, context.userId, admin)
  }

  function encryptTokens(tokens, tenantId, userId) {
    return encryptGoogleSecret(config.encryptionKey, tokens, { purpose: 'tokens', tenantId, userId })
  }
  function readTokens(connection) {
    const tokens = decryptGoogleSecret(config.encryptionKey, connection.token_envelope,
      { purpose: 'tokens', tenantId: connection.tenant_id, userId: connection.authorized_by })
    exactGoogleScopes(connection.scopes)
    exactGoogleScopes(tokens?.scopes)
    if (typeof tokens?.access_token !== 'string' || !/^[^\s\u0000-\u001f\u007f]{1,8192}$/.test(tokens.access_token)
      || typeof tokens.refresh_token !== 'string' || !/^[^\s\u0000-\u001f\u007f]{1,8192}$/.test(tokens.refresh_token)
      || !Number.isSafeInteger(tokens.expires_at)) throw reconnect()
    return tokens
  }

  async function limited(operation, tenantId) {
    if (activeOperations >= 8 || (tenantId && busy.has(tenantId))) throw new ApiError(503, 'GOOGLE_BUSY', 'Há uma operação Google em andamento. Tente novamente.')
    activeOperations++
    if (tenantId) busy.add(tenantId)
    try { return await operation() } finally { activeOperations--; if (tenantId) busy.delete(tenantId) }
  }

  async function markReconnect(context, connection) {
    await store.updateConnection(connection.tenant_id, context.userId, connection.revision, { status: 'needs_reconnect' })
  }

  return {
    // No feature configuration or credential hints are visible to a non-admin.
    async adminStatus(context) {
      if (!store) throw disabled()
      await store.assertPlatformAdmin(context.userId)
      rateLimit(`admin:${context.userId}`, 40)
      return inspect()
    },
    async setEnabled(context, enabled) {
      if (!store) throw disabled()
      await store.assertPlatformAdmin(context.userId)
      rateLimit(`admin-write:${context.userId}`, 10)
      const status = await inspect()
      if (!status.checks.find(check => check.id === 'schema').configured) throw new ApiError(503, 'GOOGLE_SCHEMA_UNAVAILABLE', 'A migração Google precisa ser revisada e aplicada antes desta ação.')
      if (enabled && !status.ready) throw new ApiError(409, 'GOOGLE_CONFIG_REQUIRED', 'Complete a configuração privada no servidor antes de habilitar o Google.')
      await store.setEnabled(context.userId, enabled)
      return inspect()
    },
    async status(context, tenantId) {
      await assertMember(context, tenantId)
      rateLimit(`status:${context.userId}`, 40)
      const status = await inspect()
      const connection = status.checks.find(check => check.id === 'schema').configured ? await store.readConnection(tenantId) : null
      let connectionStatus = connection?.status
      if (connection) {
        try {
          readTokens(connection)
          await store.assertMember(tenantId, connection.authorized_by, true)
        } catch (error) {
          if (error instanceof ApiError && [403, 409].includes(error.status)) connectionStatus = 'needs_reconnect'
          else throw error
        }
      }
      return { available: status.enabled && status.ready, connection: connection ? {
        status: connectionStatus === 'connected' ? 'connected' : 'needs_reconnect', connected_at: connection.connected_at,
        last_checked_at: connection.last_checked_at, scopes: [...GOOGLE_SCOPES]
      } : null }
    },
    async authorize(context, tenantId, cookieHeader) {
      await assertMember(context, tenantId, true)
      rateLimit(`authorize:${context.userId}`, 5)
      await available()
      const state = randomOpaque(); const verifier = randomOpaque(); const nonce = randomOpaque()
      const stateHash = sha256(state)
      const previousNonce = readOAuthCookie(cookieHeader)
      await store.beginAttempt({ state_hash: stateHash, tenant_id: tenantId, user_id: context.userId,
        browser_hash: sha256(nonce), previous_browser_hash: previousNonce ? sha256(previousNonce) : null,
        verifier_envelope: encryptGoogleSecret(config.encryptionKey, { verifier }, { purpose: `pkce:${stateHash}`, tenantId, userId: context.userId }) })
      return { body: { authorization_url: client.authorizationUrl(state, verifier) }, cookie: oauthCookie(nonce) }
    },
    async callback(query, cookieHeader) {
      const state = query.get('state'); const nonce = readOAuthCookie(cookieHeader)
      // Reject malformed requests before counters, concurrency slots or storage.
      if (query.getAll('state').length !== 1 || !/^[A-Za-z0-9_-]{43}$/.test(state || '') || !nonce) {
        return { location: `${GOOGLE_RETURN_URL}?google=error`, cookie: oauthCookie() }
      }
      let attempt = null
      let outcome = 'error'
      try {
        await limited(async () => {
          if (!store) throw disabled()
          attempt = await store.consumeAttempt(sha256(state), sha256(nonce))
          if (!attempt || Date.parse(attempt.expires_at) <= now()) return
          // Only an atomically validated state+HttpOnly nonce can allocate a
          // counter. Random cookies, forged states and replays cost no entries.
          // The identity comes from storage, never the socket or forwarded IP.
          rateLimit(attempt.user_id, 60, callbackCounters)
          await available()
          if (query.has('error')) {
            if (query.getAll('error').length === 1 && query.get('error') === 'access_denied' && !query.has('code')) outcome = 'cancelled'
            return
          }
          const code = query.get('code')
          if (query.getAll('code').length !== 1 || typeof code !== 'string' || !/^[^\s\u0000-\u001f\u007f]{1,4096}$/.test(code)) return
          await store.assertMember(attempt.tenant_id, attempt.user_id, true)
          const secret = decryptGoogleSecret(config.encryptionKey, attempt.verifier_envelope,
            { purpose: `pkce:${attempt.state_hash}`, tenantId: attempt.tenant_id, userId: attempt.user_id })
          if (!/^[A-Za-z0-9_-]{43}$/.test(secret?.verifier || '')) return
          const tokens = await client.exchange(code, secret.verifier)
          // Membership, enabled flag, invalidation and expiry are checked again
          // atomically after the network operation. Never revoke on rejection:
          // Google revocation can affect other tenants/clients of the project.
          const accepted = await store.finishAttempt(attempt, { token_envelope: encryptTokens(tokens, attempt.tenant_id, attempt.user_id),
            scopes: tokens.scopes, expires_at: new Date(tokens.expires_at).toISOString() })
          if (accepted) outcome = 'connected'
        })
      } catch { /* Deliberately no log of URL/code/token/provider details. */ }
      finally {
        if (attempt) {
          try { await store.discardAttempt(attempt.state_hash) } catch { /* Retain the consumed guard; operational reconciliation is required. */ }
        }
      }
      return { location: `${GOOGLE_RETURN_URL}?google=${outcome}`, cookie: oauthCookie() }
    },
    async resources(context, tenantId) {
      await assertMember(context, tenantId, true)
      rateLimit(`resources:${context.userId}:${tenantId}`, 10)
      await available()
      return limited(async () => {
        let connection = await store.readConnection(tenantId)
        if (!connection || connection.status !== 'connected') throw reconnect()
        let tokens
        try {
          await store.assertMember(tenantId, connection.authorized_by, true)
          tokens = readTokens(connection)
        } catch (error) {
          if (error instanceof ApiError && [403, 409].includes(error.status)) { await markReconnect(context, connection); throw reconnect() }
          throw error
        }
        if (tokens.expires_at <= now() + 60000) {
          try { tokens = await client.refresh(tokens) }
          catch (error) {
            if (['GOOGLE_RECONNECT_REQUIRED', 'GOOGLE_SCOPES_REQUIRED'].includes(error.code)) await markReconnect(context, connection)
            throw error
          }
          const encrypted = encryptTokens(tokens, tenantId, connection.authorized_by)
          const updated = await store.updateConnection(tenantId, context.userId, connection.revision,
            { token_envelope: encrypted, expires_at: new Date(tokens.expires_at).toISOString() })
          if (!updated) throw changed()
          const fresh = await store.readConnection(tenantId)
          if (!fresh || fresh.token_envelope.ciphertext !== encrypted.ciphertext) throw changed()
          connection = fresh
        }
        const results = await Promise.allSettled([client.analytics(tokens.access_token), client.searchConsole(tokens.access_token)])
        const errors = {}; const values = { analytics: [], search_console: [] }; let truncated = false; let needsReconnect = false
        for (const [index, source] of ['analytics', 'search_console'].entries()) {
          const result = results[index]
          if (result.status === 'fulfilled') { values[source] = result.value.items; truncated ||= result.value.truncated }
          else {
            errors[source] = result.reason instanceof ApiError ? result.reason.code : 'GOOGLE_UNAVAILABLE'
            needsReconnect ||= errors[source] === 'GOOGLE_RECONNECT_REQUIRED'
          }
        }
        const checkedAt = new Date(now()).toISOString()
        // Never return observations after an intervening disconnect or role change.
        const updated = await store.updateConnection(tenantId, context.userId, connection.revision,
          { status: needsReconnect ? 'needs_reconnect' : 'connected', returning_resources: true,
            ...(Object.keys(errors).length === 0 ? { last_checked_at: checkedAt } : {}) })
        if (!updated) throw changed()
        return { ...values, checked_at: checkedAt, errors, truncated }
      }, tenantId)
    },
    async disconnect(context, tenantId) {
      await assertMember(context, tenantId, true)
      rateLimit(`disconnect:${context.userId}`, 10)
      return limited(async () => {
        // The transaction refuses consumed attempts until their callbacks finish,
        // even if expired or globally disabled. Unconsumed attempts are cancelled.
        const connection = await store.disconnect(tenantId, context.userId)
        if (!connection) return { disconnected: true, revocation: 'failed',
          warning: 'O acesso local foi removido, mas não há credencial local para confirmar a revogação externa. Revise a autorização na sua conta Google.' }
        try {
          const tokens = readTokens(connection)
          await client.revoke(tokens.refresh_token)
          return { disconnected: true, revocation: 'succeeded' }
        } catch {
          return { disconnected: true, revocation: 'failed', warning: 'O acesso local foi removido. Revise também a autorização na sua conta Google.' }
        }
      }, tenantId)
    }
  }
}
