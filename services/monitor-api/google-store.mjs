import { ApiError } from './errors.mjs'

const connectionFields = 'tenant_id,authorized_by,revision,status,token_envelope,scopes,expires_at,connected_at,last_checked_at'
const missingSchema = error => ['42P01', '42883', '42703', 'PGRST202', 'PGRST204', 'PGRST205', '42501'].includes(error?.code)
function databaseError(error) {
  if (!error) return
  if (error.message === 'GOOGLE_ADMIN_REQUIRED') throw new ApiError(403, 'ADMIN_REQUIRED', 'Esta área é exclusiva da administração do Fluxo Atento.')
  if (error.message === 'GOOGLE_TENANT_ADMIN_REQUIRED') throw new ApiError(403, 'TENANT_ADMIN_REQUIRED', 'Apenas responsáveis pela empresa podem gerenciar esta conexão.')
  if (error.message === 'GOOGLE_DISABLED') throw new ApiError(409, 'GOOGLE_DISABLED', 'A integração Google ainda não está disponível.')
  if (error.message === 'GOOGLE_OAUTH_IN_PROGRESS') throw new ApiError(409, 'GOOGLE_OAUTH_IN_PROGRESS', 'Uma autorização Google está em andamento ou aguarda confirmação de término. Aguarde e tente novamente.')
  throw new ApiError(503, 'GOOGLE_STORAGE_UNAVAILABLE', 'Não foi possível acessar a configuração Google. Tente novamente.')
}

// This adapter receives only the server's service-role client. It is never
// imported by app/ and never returns envelopes from an HTTP endpoint.
export function createGoogleStore(writer) {
  async function rpc(name, parameters) {
    const result = await writer.rpc(name, parameters)
    databaseError(result.error)
    return result.data
  }
  return {
    async assertPlatformAdmin(userId) {
      const { data, error } = await writer.from('platform_administrators').select('user_id').eq('user_id', userId).maybeSingle()
      databaseError(error)
      if (!data) throw new ApiError(403, 'ADMIN_REQUIRED', 'Esta área é exclusiva da administração do Fluxo Atento.')
    },
    async assertMember(tenantId, userId, admin = false) {
      const { data, error } = await writer.from('tenant_members').select('role').eq('tenant_id', tenantId).eq('user_id', userId).maybeSingle()
      databaseError(error)
      if (!data) throw new ApiError(403, 'TENANT_DENIED', 'Esse espaço não está disponível para sua conta.')
      if (admin && !['owner', 'admin'].includes(data.role)) throw new ApiError(403, 'TENANT_ADMIN_REQUIRED', 'Apenas responsáveis pela empresa podem gerenciar esta conexão.')
    },
    async inspect() {
      const result = await writer.rpc('google_data_status')
      if (missingSchema(result.error)) return { schemaAvailable: false, enabled: false }
      databaseError(result.error)
      if (result.data?.schema_version !== 1) return { schemaAvailable: false, enabled: false }
      // Verify the tables/columns and service grants without reading token rows.
      for (const [table, fields] of [
        ['google_tenant_connections', connectionFields], ['google_oauth_attempts', 'state_hash,browser_hash,verifier_envelope,consumed_at,invalidated_at,expires_at'],
        ['google_data_configuration_audit', 'actor_user_id,enabled,changed_at']
      ]) {
        const checked = await writer.from(table).select(fields).limit(0)
        if (missingSchema(checked.error)) return { schemaAvailable: false, enabled: false }
        databaseError(checked.error)
      }
      return { schemaAvailable: true, enabled: result.data.enabled === true, updated_at: result.data.updated_at, updated_by: result.data.updated_by }
    },
    async setEnabled(userId, enabled) { await rpc('google_data_set_enabled', { p_user_id: userId, p_enabled: enabled }) },
    async beginAttempt(attempt) {
      await rpc('google_oauth_begin', { p_tenant_id: attempt.tenant_id, p_user_id: attempt.user_id,
        p_state_hash: attempt.state_hash, p_browser_hash: attempt.browser_hash, p_previous_browser_hash: attempt.previous_browser_hash,
        p_verifier_envelope: attempt.verifier_envelope })
    },
    async consumeAttempt(stateHash, browserHash) {
      const data = await rpc('google_oauth_consume', { p_state_hash: stateHash, p_browser_hash: browserHash })
      return data?.[0] || null
    },
    async discardAttempt(stateHash) {
      const { error } = await writer.from('google_oauth_attempts').delete().eq('state_hash', stateHash)
      databaseError(error)
    },
    async finishAttempt(attempt, connection) {
      return await rpc('google_oauth_finish', { p_state_hash: attempt.state_hash, p_tenant_id: attempt.tenant_id, p_user_id: attempt.user_id,
        p_token_envelope: connection.token_envelope, p_scopes: connection.scopes, p_expires_at: connection.expires_at }) === true
    },
    async readConnection(tenantId) {
      const { data, error } = await writer.from('google_tenant_connections').select(connectionFields).eq('tenant_id', tenantId).maybeSingle()
      databaseError(error)
      return data
    },
    async updateConnection(tenantId, actorId, revision, changes) {
      return await rpc('google_connection_update', { p_tenant_id: tenantId, p_actor_id: actorId, p_revision: revision,
        p_status: changes.status || 'connected', p_token_envelope: changes.token_envelope || null,
        p_expires_at: changes.expires_at || null, p_checked_at: changes.last_checked_at || null,
        p_returning_resources: changes.returning_resources === true }) === true
    },
    async disconnect(tenantId, userId) {
      const data = await rpc('google_connection_disconnect', { p_tenant_id: tenantId, p_user_id: userId })
      return data?.[0] || null
    }
  }
}
