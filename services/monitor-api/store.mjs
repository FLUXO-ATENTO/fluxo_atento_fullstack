import { createClient } from '@supabase/supabase-js'
import { ApiError } from './errors.mjs'
import { createGoogleStore } from './google-store.mjs'

const fields = 'id,name,url,hostname,enabled,created_at,last_requested_at'
const options = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  global: { fetch: (url, init) => fetch(url, { ...init, signal: AbortSignal.timeout(8000) }) } }

function databaseError(error) {
  if (!error) return
  if (error.code === '23505') throw new ApiError(409, 'DUPLICATE', 'Esse endereço já está cadastrado.')
  if (error.message === 'FREE_MONITOR_LIMIT') throw new ApiError(409, 'PLAN_LIMIT', 'Nesta etapa, sua conta permite duas páginas de um mesmo site.')
  if (error.message === 'TENANT_ACCESS_DENIED') throw new ApiError(403, 'TENANT_DENIED', 'Esse espaço não está disponível para sua conta.')
  throw new ApiError(503, 'DATABASE_UNAVAILABLE', 'Não foi possível acessar seus dados. Tente novamente em instantes.')
}

export function createStore({ supabaseUrl, publicKey, secretKey, authRedirectUrl }) {
  const auth = createClient(supabaseUrl, publicKey, options)
  const writer = createClient(supabaseUrl, secretKey, options)
  const reader = token => createClient(supabaseUrl, publicKey, {
    ...options, global: { ...options.global, headers: { Authorization: `Bearer ${token}` } }
  })
  async function requirePlatformAdmin(context) {
    const admin = await writer.from('platform_administrators').select('user_id').eq('user_id', context.userId).maybeSingle()
    databaseError(admin.error)
    if (!admin.data) throw new ApiError(403, 'ADMIN_REQUIRED', 'Esta área é exclusiva da administração do FLUXO.')
  }
  return {
    google: createGoogleStore(writer),
    async authenticate(token) {
      const { data, error } = await auth.auth.getUser(token)
      if (error || !data.user || data.user.is_anonymous) {
        if (error?.status >= 500 || error?.name === 'AuthRetryableFetchError') throw new ApiError(503, 'AUTH_UNAVAILABLE', 'Não foi possível confirmar seu acesso. Tente novamente.')
        throw new ApiError(401, 'UNAUTHORIZED', 'Entre na sua conta para continuar.')
      }
      return { userId: data.user.id, token }
    },
    async workspace(context, requestedTenantId) {
      let { data: memberships, error } = await writer.from('tenant_members')
        .select('tenant_id,role,created_at,tenants(id,name,created_at)')
        .eq('user_id', context.userId)
        .order('created_at')
      databaseError(error)
      if (!memberships?.length) {
        const provisioned = await writer.rpc('ensure_personal_tenant', { p_user_id: context.userId })
        databaseError(provisioned.error)
        ;({ data: memberships, error } = await writer.from('tenant_members')
          .select('tenant_id,role,created_at,tenants(id,name,created_at)')
          .eq('user_id', context.userId)
          .order('created_at'))
        databaseError(error)
      }
      const tenants = (memberships || []).map(item => ({
        id: item.tenant_id,
        name: item.tenants?.name || 'Espaço sem nome',
        role: item.role,
        created_at: item.created_at
      }))
      const activeTenant = tenants.find(item => item.id === requestedTenantId) || (!requestedTenantId ? tenants[0] : null)
      if (!activeTenant) throw new ApiError(403, 'TENANT_DENIED', 'Esse espaço não está disponível para sua conta.')
      const admin = await writer.from('platform_administrators').select('user_id').eq('user_id', context.userId).maybeSingle()
      databaseError(admin.error)
      return { activeTenant, tenants, platformAdmin: Boolean(admin.data) }
    },
    async adminTenants(context) {
      await requirePlatformAdmin(context)
      const { data, error } = await writer.from('tenants').select('id,name,created_at,created_by').order('created_at', { ascending: false }).limit(100)
      databaseError(error)
      return data || []
    },
    async adminProviders(context) {
      await requirePlatformAdmin(context)
      const { data, error } = await writer.from('platform_providers')
        .select('id,provider_key,display_name,channel,credential_reference,status,created_at,updated_at')
        .order('created_at', { ascending: false })
      databaseError(error)
      return data || []
    },
    async createProvider(context, provider) {
      await requirePlatformAdmin(context)
      const { data, error } = await writer.from('platform_providers').insert({ ...provider, created_by: context.userId })
        .select('id,provider_key,display_name,channel,credential_reference,status,created_at,updated_at').single()
      if (error?.code === '23505') throw new ApiError(409, 'PROVIDER_EXISTS', 'Já existe um provedor com essa chave.')
      databaseError(error)
      return data
    },
    async integrations(context, tenantId) {
      const client = reader(context.token)
      const { data, error } = await client.from('tenant_channel_connections')
        .select('id,channel,status,account_reference,created_at,updated_at,platform_providers(id,display_name,provider_key,status)')
        .eq('tenant_id', tenantId).order('channel')
      databaseError(error)
      return data || []
    },
    async requestIntegration(context, workspace, { channel, providerId, accountReference }) {
      if (!['owner', 'admin'].includes(workspace.activeTenant.role)) throw new ApiError(403, 'TENANT_ADMIN_REQUIRED', 'Apenas responsáveis pelo tenant podem preparar conexões.')
      const provider = await writer.from('platform_providers').select('id').eq('id', providerId).eq('channel', channel).eq('status', 'validated').maybeSingle()
      databaseError(provider.error)
      if (!provider.data) throw new ApiError(409, 'PROVIDER_UNAVAILABLE', 'Escolha um provedor global validado para este canal.')
      const { data, error } = await writer.from('tenant_channel_connections').upsert({
        tenant_id: workspace.activeTenant.id,
        provider_id: provider.data.id,
        channel,
        status: 'pending',
        account_reference: accountReference || null,
        created_by: context.userId,
        updated_at: new Date().toISOString()
      }, { onConflict: 'tenant_id,channel' }).select('id,channel,status,account_reference,created_at,updated_at,provider_id').single()
      databaseError(error)
      return data
    },
    async inviteUser(context, { email, name, tenantName }) {
      await requirePlatformAdmin(context)
      const invitation = await writer.auth.admin.inviteUserByEmail(email, {
        data: { full_name: name },
        redirectTo: authRedirectUrl
      })
      if (invitation.error || !invitation.data.user) {
        if (invitation.error?.status === 429) throw new ApiError(429, 'INVITE_LIMIT', 'Aguarde antes de enviar outro convite.')
        throw new ApiError(409, 'INVITE_FAILED', 'Não foi possível preparar o acesso deste usuário. Confira o e-mail e tente novamente.')
      }
      const createdUser = invitation.data.user
      const tenant = await writer.from('tenants').insert({ name: tenantName, created_by: createdUser.id }).select('id,name').single()
      databaseError(tenant.error)
      const membership = await writer.from('tenant_members').insert({ tenant_id: tenant.data.id, user_id: createdUser.id, role: 'owner' })
      databaseError(membership.error)
      return { user: { id: createdUser.id, email: createdUser.email }, tenant: tenant.data }
    },
    async list(context, tenantId) {
      const client = reader(context.token)
      const [monitors, checks] = await Promise.all([
        client.from('monitors').select(fields).eq('tenant_id', tenantId).order('created_at').limit(30),
        client.from('monitor_checks').select('id,monitor_id,status,http_status,duration_ms,detail,checked_at')
          .eq('tenant_id', tenantId).order('checked_at', { ascending: false }).limit(50)
      ])
      databaseError(monitors.error); databaseError(checks.error)
      return monitors.data.map(monitor => ({ ...monitor, checks: checks.data.filter(check => check.monitor_id === monitor.id).slice(0, 5) }))
    },
    async create(context, tenantId, url) {
      const { data, error } = await writer.rpc('create_monitor_for_tenant', {
        p_tenant_id: tenantId, p_user_id: context.userId, p_url: url.toString(), p_hostname: url.hostname
      })
      databaseError(error)
      return { id: data }
    },
    async setEnabled(context, tenantId, id, enabled) {
      const { data, error } = await writer.from('monitors').update({ enabled })
        .eq('id', id).eq('tenant_id', tenantId).select('id').maybeSingle()
      databaseError(error)
      if (!data) throw new ApiError(404, 'NOT_FOUND', 'Esse monitor não está disponível na sua conta.')
      return data
    },
    async claim(context, tenantId, id) {
      const client = reader(context.token)
      const { data: monitor, error } = await client.from('monitors').select('id,url,enabled')
        .eq('id', id).eq('tenant_id', tenantId).maybeSingle()
      databaseError(error)
      if (!monitor) throw new ApiError(404, 'NOT_FOUND', 'Esse monitor não está disponível na sua conta.')
      if (!monitor.enabled) throw new ApiError(409, 'PAUSED', 'Reative o monitor antes de verificar.')
      const cutoff = new Date(Date.now() - 60000).toISOString()
      const { data: claimed, error: claimError } = await writer.from('monitors')
        .update({ last_requested_at: new Date().toISOString() }).eq('id', id).eq('tenant_id', tenantId).eq('enabled', true)
        .or(`last_requested_at.is.null,last_requested_at.lt.${cutoff}`).select('id,url').maybeSingle()
      databaseError(claimError)
      if (!claimed) throw new ApiError(429, 'CHECK_COOLDOWN', 'Aguarde um minuto entre verificações deste endereço.')
      return claimed
    },
    async record(context, tenantId, id, result) {
      const { data, error } = await writer.from('monitor_checks').insert({ ...result, monitor_id: id, tenant_id: tenantId, user_id: context.userId })
        .select('id,monitor_id,status,http_status,duration_ms,detail,checked_at').single()
      databaseError(error)
      return data
    }
  }
}
