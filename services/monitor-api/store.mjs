import { createClient } from '@supabase/supabase-js'
import { ApiError } from './errors.mjs'

const fields = 'id,name,url,hostname,enabled,created_at,last_requested_at'
const options = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  global: { fetch: (url, init) => fetch(url, { ...init, signal: AbortSignal.timeout(8000) }) } }

function databaseError(error) {
  if (!error) return
  const known = {
    ADMIN_REQUIRED: [403, 'Área exclusiva do Super Admin.'],
    LAST_OWNER: [409, 'Defina outro responsável antes de alterar o último proprietário.'],
    MEMBER_NOT_FOUND: [404, 'Membro não encontrado neste tenant.'],
    PROVIDER_NOT_FOUND: [404, 'Provedor não encontrado.'],
    IDENTITY_CONFLICT: [409, 'O e-mail e o telefone pertencem a contatos diferentes. Revise os cadastros; nenhuma fusão foi realizada.'],
    INVALID_CONTACT: [400, 'Informe nome e e-mail ou telefone internacional válidos.']
  }[error.message]
  if (known) throw new ApiError(known[0], error.message, known[1])
  if (error.code === '23505') throw new ApiError(409, 'DUPLICATE', 'Esse endereço já está cadastrado.')
  if (error.message === 'FREE_MONITOR_LIMIT') throw new ApiError(409, 'PLAN_LIMIT', 'Nesta etapa, sua conta permite duas páginas de um mesmo site.')
  if (error.message === 'TENANT_ACCESS_DENIED') throw new ApiError(403, 'TENANT_DENIED', 'Esse espaço não está disponível para sua conta.')
  throw new ApiError(503, 'DATABASE_UNAVAILABLE', 'Não foi possível acessar seus dados. Tente novamente em instantes.')
}

export function createStore({ supabaseUrl, publicKey, secretKey, authRedirectUrl, clientFactory = createClient }) {
  const auth = clientFactory(supabaseUrl, publicKey, options)
  const writer = clientFactory(supabaseUrl, secretKey, options)
  const reader = token => clientFactory(supabaseUrl, publicKey, {
    ...options, global: { ...options.global, headers: { Authorization: `Bearer ${token}` } }
  })
  async function requirePlatformAdmin(context) {
    const admin = await writer.from('platform_administrators').select('user_id').eq('user_id', context.userId).maybeSingle()
    databaseError(admin.error)
    if (!admin.data) throw new ApiError(403, 'ADMIN_REQUIRED', 'Esta área é exclusiva da administração do FLUXO.')
  }
  return {
    requirePlatformAdmin,
    async authenticate(token) {
      const { data, error } = await auth.auth.getUser(token)
      if (error || !data.user || data.user.is_anonymous) {
        if (error?.status >= 500 || error?.name === 'AuthRetryableFetchError') throw new ApiError(503, 'AUTH_UNAVAILABLE', 'Não foi possível confirmar seu acesso. Tente novamente.')
        throw new ApiError(401, 'UNAUTHORIZED', 'Entre na sua conta para continuar.')
      }
      return { userId: data.user.id, token }
    },
    async workspace(context, requestedTenantId) {
      const admin = await writer.from('platform_administrators').select('user_id').eq('user_id', context.userId).maybeSingle()
      databaseError(admin.error)
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
      let activeTenant = tenants.find(item => item.id === requestedTenantId) || (!requestedTenantId ? tenants[0] : null)
      if (requestedTenantId && admin.data && !activeTenant) {
        const selected = await writer.from('tenants').select('id,name,created_at').eq('id', requestedTenantId).maybeSingle()
        databaseError(selected.error)
        if (selected.data) {
          activeTenant = { ...selected.data, role: 'platform_admin' }
          tenants.push(activeTenant)
        }
      }
      if (!activeTenant) throw new ApiError(403, 'TENANT_DENIED', 'Esse espaço não está disponível para sua conta.')
      return { activeTenant, tenants, platformAdmin: Boolean(admin.data) }
    },
    async adminTenants(context, page = 0) {
      await requirePlatformAdmin(context)
      const { data, error, count } = await writer.from('tenants').select('id,name,created_at,created_by', { count: 'exact' }).order('created_at', { ascending: false }).order('id').range(page * 25, page * 25 + 24)
      databaseError(error)
      return { tenants: data || [], total: count || 0, page }
    },
    async adminMembers(context, tenantId) {
      await requirePlatformAdmin(context)
      const { data, error } = await writer.from('tenant_members').select('user_id,role,created_at').eq('tenant_id', tenantId).order('created_at').limit(100)
      databaseError(error)
      const members = []
      for (let index = 0; index < (data || []).length; index += 5) {
        const batch = await Promise.all(data.slice(index, index + 5).map(async member => {
          const account = await writer.auth.admin.getUserById(member.user_id)
          if (account.error) throw new ApiError(503, 'MEMBERS_UNAVAILABLE', 'Não foi possível consultar os membros agora.')
          return { ...member, email: account.data.user?.email || null }
        }))
        members.push(...batch)
      }
      return members
    },
    async setMemberRole(context, tenantId, userId, role) {
      await requirePlatformAdmin(context)
      const { error } = await writer.rpc('admin_set_member_role', { p_actor_id: context.userId, p_tenant_id: tenantId, p_user_id: userId, p_role: role })
      databaseError(error)
      return { updated: true }
    },
    async adminAudit(context) {
      await requirePlatformAdmin(context)
      const { data, error } = await writer.from('platform_audit_events').select('id,actor_id,tenant_id,action,subject_id,details,created_at').order('created_at', { ascending: false }).order('id', { ascending: false }).limit(100)
      databaseError(error)
      return data || []
    },
    async setProviderStatus(context, providerId, status) {
      await requirePlatformAdmin(context)
      const { error } = await writer.rpc('admin_set_provider_status', { p_actor_id: context.userId, p_provider_id: providerId, p_status: status })
      databaseError(error)
      return { updated: true }
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
      // workspace() has authorized tenantId; the service performs the private
      // provider join, projecting no credential_reference to tenant users.
      const { data, error } = await writer.from('tenant_channel_connections')
        .select('id,channel,status,account_reference,created_at,updated_at,platform_providers(id,display_name,provider_key,status)')
        .eq('tenant_id', tenantId).order('channel')
      databaseError(error)
      return data || []
    },
    async requestIntegration(context, workspace, { channel, providerId, accountReference }) {
      if (!workspace.platformAdmin && !['owner', 'admin'].includes(workspace.activeTenant.role)) throw new ApiError(403, 'TENANT_ADMIN_REQUIRED', 'Apenas responsáveis pelo tenant podem preparar conexões.')
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
        redirectTo: new URL('/recuperar-acesso', authRedirectUrl).href
      })
      if (invitation.error || !invitation.data.user) {
        if (invitation.error?.status === 429) throw new ApiError(429, 'INVITE_LIMIT', 'Aguarde antes de enviar outro convite.')
        throw new ApiError(409, 'INVITE_FAILED', 'Não foi possível preparar o acesso deste usuário. Confira o e-mail e tente novamente.')
      }
      const createdUser = invitation.data.user
      const initial = await writer.rpc('ensure_personal_tenant', { p_user_id: createdUser.id })
      databaseError(initial.error)
      const tenant = await writer.from('tenants').update({ name: tenantName }).eq('id', initial.data).eq('created_by', createdUser.id).select('id,name').single()
      databaseError(tenant.error)
      return { user: { id: createdUser.id, email: createdUser.email }, tenant: tenant.data }
    },
    async contacts(context, tenantId, page = 0) {
      const { data, error, count } = await reader(context.token).from('contacts')
        .select('id,display_name,status,source,created_at,contact_identities(kind,normalized_value)', { count: 'exact' })
        .eq('tenant_id', tenantId).order('created_at', { ascending: false }).order('id').range(page * 25, page * 25 + 24)
      databaseError(error)
      return { contacts: data || [], total: count || 0, page }
    },
    async saveContact(context, tenantId, contact) {
      const { data, error } = await writer.rpc('save_contact', { p_actor_id: context.userId, p_tenant_id: tenantId, p_name: contact.name, p_email: contact.email || null, p_phone: contact.phone || null })
      databaseError(error)
      return data
    },
    async contactHistory(context, tenantId, contactId, before) {
      const client = reader(context.token)
      const contact = await client.from('contacts').select('id').eq('tenant_id', tenantId).eq('id', contactId).maybeSingle()
      databaseError(contact.error)
      if (!contact.data) throw new ApiError(404, 'CONTACT_NOT_FOUND', 'Contato não encontrado neste espaço.')
      let query = client.from('messages').select('id,direction,body_text,occurred_at,conversations!inner(contact_id,subject)')
        .eq('tenant_id', tenantId).eq('conversations.contact_id', contactId)
        .order('occurred_at', { ascending: false }).order('id', { ascending: false }).limit(51)
      if (before) query = query.or(`occurred_at.lt.${before.time},and(occurred_at.eq.${before.time},id.lt.${before.id})`)
      const { data, error } = await query
      databaseError(error)
      const messages = (data || []).slice(0, 50)
      const last = messages.at(-1)
      return { messages, next_cursor: data?.length > 50 && last ? Buffer.from(JSON.stringify({ time: last.occurred_at, id: last.id })).toString('base64url') : null }
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
