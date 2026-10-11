import { ApiError } from './errors.mjs'
import { normalizeTarget, resolveTarget, checkWebsite } from './probe.mjs'

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
function pageNumber(value) {
  if (value === null) return 0
  if (!/^\d{1,5}$/.test(value)) throw new ApiError(400, 'INVALID_PAGE', 'Página inválida.')
  return Number(value)
}
function historyCursor(value) {
  if (!value) return null
  try {
    if (!/^[A-Za-z0-9_-]{1,256}$/.test(value)) throw new Error()
    const cursor = JSON.parse(Buffer.from(value, 'base64url').toString())
    if (typeof cursor.id !== 'string' || !uuid.test(cursor.id) || typeof cursor.time !== 'string'
      || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|\+00:00)$/.test(cursor.time)
      || !Number.isFinite(Date.parse(cursor.time))) throw new Error()
    return cursor
  } catch { throw new ApiError(400, 'INVALID_CURSOR', 'Atualize o histórico para continuar.') }
}
async function readJson(request) {
  if (!request.headers['content-type']?.startsWith('application/json')) throw new ApiError(415, 'JSON_REQUIRED', 'Envie os dados em JSON.')
  if (Number(request.headers['content-length'] || 0) > 8192) throw new ApiError(413, 'TOO_LARGE', 'Os dados enviados são grandes demais.')
  const chunks = []; let length = 0
  for await (const chunk of request) {
    length += chunk.length
    if (length > 8192) throw new ApiError(413, 'TOO_LARGE', 'Os dados enviados são grandes demais.')
    chunks.push(chunk)
  }
  try {
    const body = JSON.parse(Buffer.concat(chunks).toString())
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error()
    return body
  } catch { throw new ApiError(400, 'INVALID_JSON', 'Confira os dados enviados.') }
}

export function createHandler({ store, allowedOrigins, probe = checkWebsite, validate = resolveTarget }) {
  const requests = new Map()
  let activeChecks = 0
  return async function handler(request, response) {
    const reply = (status, body) => {
      response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer' })
      response.end(JSON.stringify(body))
    }
    try {
      const origin = request.headers.origin
      if (origin && !allowedOrigins.includes(origin)) throw new ApiError(403, 'ORIGIN_DENIED', 'Este endereço de acesso não foi autorizado.')
      response.setHeader('Vary', 'Origin')
      if (origin) response.setHeader('Access-Control-Allow-Origin', origin)
      if (request.method === 'OPTIONS') {
        response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS')
        response.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-Fluxo-Tenant-Id')
        response.setHeader('Access-Control-Max-Age', '600')
        response.writeHead(204); response.end(); return
      }
      const requestUrl = new URL(request.url, 'http://localhost')
      const path = requestUrl.pathname.replace(/\/$/, '')
      if (path === '/v1/health' && request.method === 'GET') return reply(200, { status: 'ok', service: 'fluxo-atento-monitor', contract: 1 })
      if (!path.startsWith('/v1/')) throw new ApiError(404, 'NOT_FOUND', 'Rota não encontrada.')
      const token = /^Bearer ([A-Za-z0-9._-]+)$/.exec(request.headers.authorization || '')?.[1]
      if (!token || token.length > 8192) throw new ApiError(401, 'UNAUTHORIZED', 'Entre na sua conta para continuar.')
      const context = await store.authenticate(token)
      const now = Date.now()
      for (const [key, entry] of requests) if (entry.until <= now) requests.delete(key)
      const rateKey = context.userId + (request.method === 'GET' ? ':read' : ':write')
      if (!requests.has(rateKey) && requests.size >= 5000) throw new ApiError(503, 'BUSY', 'Tente novamente em instantes.')
      const counter = requests.get(rateKey) || { count: 0, until: now + 60000 }
      counter.count++; requests.set(rateKey, counter)
      if (counter.count > (request.method === 'GET' ? 120 : 30)) throw new ApiError(429, 'RATE_LIMIT', 'Muitas solicitações. Aguarde um minuto e tente novamente.')
      if (path.startsWith('/v1/admin/')) await store.requirePlatformAdmin(context)
      const requestedTenantId = request.headers['x-fluxo-tenant-id']
      if (requestedTenantId && (typeof requestedTenantId !== 'string' || !uuid.test(requestedTenantId))) throw new ApiError(400, 'INVALID_TENANT', 'O espaço informado não é válido.')
      const workspace = await store.workspace(context, requestedTenantId)
      if (path === '/v1/workspace' && request.method === 'GET') return reply(200, {
        active_tenant: workspace.activeTenant,
        tenants: workspace.tenants,
        platform_admin: workspace.platformAdmin
      })
      if (path === '/v1/admin/tenants' && request.method === 'GET') return reply(200, await store.adminTenants(context, pageNumber(requestUrl.searchParams.get('page'))))
      if (path === '/v1/admin/audit' && request.method === 'GET') return reply(200, { events: await store.adminAudit(context) })
      const memberRoute = /^\/v1\/admin\/tenants\/([^/]+)\/members(?:\/([^/]+))?$/.exec(path)
      if (memberRoute && uuid.test(memberRoute[1])) {
        if (!memberRoute[2] && request.method === 'GET') return reply(200, { members: await store.adminMembers(context, memberRoute[1]) })
        if (memberRoute[2] && uuid.test(memberRoute[2]) && request.method === 'PATCH') {
          const body = await readJson(request)
          if (Object.keys(body).some(key => key !== 'role') || !['owner', 'admin', 'member'].includes(body.role)) throw new ApiError(400, 'INVALID_ROLE', 'Escolha uma permissão de tenant válida.')
          return reply(200, await store.setMemberRole(context, memberRoute[1], memberRoute[2], body.role))
        }
      }
      const providerRoute = /^\/v1\/admin\/providers\/([^/]+)$/.exec(path)
      if (providerRoute && uuid.test(providerRoute[1]) && request.method === 'PATCH') {
        const body = await readJson(request)
        if (Object.keys(body).some(key => key !== 'status') || !['pending', 'disabled'].includes(body.status)) throw new ApiError(400, 'INVALID_STATUS', 'A validação exige um teste real de conexão. Você pode desativar ou devolver à configuração.')
        return reply(200, await store.setProviderStatus(context, providerRoute[1], body.status))
      }
      if (path === '/v1/admin/providers' && request.method === 'GET') return reply(200, { providers: await store.adminProviders(context) })
      if (path === '/v1/admin/providers' && request.method === 'POST') {
        const body = await readJson(request)
        if (Object.keys(body).some(key => !['provider_key', 'display_name', 'channel', 'credential_reference'].includes(key))
          || typeof body.provider_key !== 'string' || !/^[a-z0-9][a-z0-9_-]{2,62}$/.test(body.provider_key)
          || typeof body.display_name !== 'string' || body.display_name.trim().length < 1 || body.display_name.trim().length > 120
          || !['whatsapp_waba', 'email_smtp'].includes(body.channel)
          || typeof body.credential_reference !== 'string' || !/^[A-Z][A-Z0-9_]{2,127}$/.test(body.credential_reference)) {
          throw new ApiError(400, 'INVALID_PROVIDER', 'Informe chave, nome, canal e referência segura válidos.')
        }
        return reply(201, { provider: await store.createProvider(context, {
          provider_key: body.provider_key, display_name: body.display_name.trim(), channel: body.channel,
          credential_reference: body.credential_reference, status: 'pending', updated_at: new Date().toISOString()
        }) })
      }
      if (path === '/v1/admin/users' && request.method === 'POST') {
        const body = await readJson(request)
        if (Object.keys(body).some(key => !['email', 'name', 'tenant_name'].includes(key))
          || typeof body.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email) || body.email.length > 254
          || typeof body.name !== 'string' || body.name.trim().length < 1 || body.name.trim().length > 120
          || typeof body.tenant_name !== 'string' || body.tenant_name.trim().length < 1 || body.tenant_name.trim().length > 120) {
          throw new ApiError(400, 'INVALID_USER', 'Informe nome, e-mail e nome do espaço válidos.')
        }
        return reply(201, await store.inviteUser(context, { email: body.email.trim().toLowerCase(), name: body.name.trim(), tenantName: body.tenant_name.trim() }))
      }
      const tenantId = workspace.activeTenant.id
      if (path === '/v1/contacts' && request.method === 'GET') return reply(200, await store.contacts(context, tenantId, pageNumber(requestUrl.searchParams.get('page'))))
      if (path === '/v1/contacts' && request.method === 'POST') {
        const body = await readJson(request)
        const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
        const phone = typeof body.phone === 'string' ? body.phone.replace(/[\s().-]/g, '') : ''
        if (Object.keys(body).some(key => !['name', 'email', 'phone'].includes(key))
          || typeof body.name !== 'string' || body.name.trim().length < 1 || body.name.trim().length > 160
          || (body.email !== undefined && typeof body.email !== 'string') || (body.phone !== undefined && typeof body.phone !== 'string')
          || (!email && !phone) || (email && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254))
          || (phone && !/^\+[1-9][0-9]{7,14}$/.test(phone))) throw new ApiError(400, 'INVALID_CONTACT', 'Informe nome e e-mail ou telefone com código do país, como +5511999999999.')
        const contact = await store.saveContact(context, tenantId, { name: body.name.trim(), email, phone })
        return reply(contact.created ? 201 : 200, contact)
      }
      const historyRoute = /^\/v1\/contacts\/([^/]+)\/history$/.exec(path)
      if (historyRoute && uuid.test(historyRoute[1]) && request.method === 'GET') return reply(200, await store.contactHistory(context, tenantId, historyRoute[1], historyCursor(requestUrl.searchParams.get('before'))))
      if (path === '/v1/integrations' && request.method === 'GET') return reply(200, { connections: await store.integrations(context, tenantId) })
      if (path === '/v1/integrations' && request.method === 'POST') {
        const body = await readJson(request)
        if (Object.keys(body).some(key => !['channel', 'provider_id', 'account_reference'].includes(key))
          || !['whatsapp_waba', 'email_smtp'].includes(body.channel)
          || typeof body.provider_id !== 'string' || !uuid.test(body.provider_id)
          || (body.account_reference !== undefined && (typeof body.account_reference !== 'string' || body.account_reference.trim().length > 255))) {
          throw new ApiError(400, 'INVALID_CONNECTION', 'Informe um canal e uma referência de conta válidos.')
        }
        return reply(201, { connection: await store.requestIntegration(context, workspace, { channel: body.channel, providerId: body.provider_id, accountReference: body.account_reference?.trim() }) })
      }
      if (!path.startsWith('/v1/monitors')) throw new ApiError(404, 'NOT_FOUND', 'Rota não encontrada.')
      if (path === '/v1/monitors' && request.method === 'GET') return reply(200, { monitors: await store.list(context, tenantId) })
      if (path === '/v1/monitors' && request.method === 'POST') {
        const body = await readJson(request)
        if (Object.keys(body).some(key => key !== 'url')) throw new ApiError(400, 'INVALID_FIELDS', 'Envie somente o endereço da página.')
        const url = normalizeTarget(body.url)
        await validate(url.toString(), { signal: AbortSignal.timeout(4000) })
        return reply(201, await store.create(context, tenantId, url))
      }
      const match = /^\/v1\/monitors\/([^/]+)(\/check)?$/.exec(path)
      if (!match || !uuid.test(match[1])) throw new ApiError(404, 'NOT_FOUND', 'Monitor não encontrado.')
      if (!match[2] && request.method === 'PATCH') {
        const body = await readJson(request)
        if (typeof body.enabled !== 'boolean' || Object.keys(body).some(key => key !== 'enabled')) throw new ApiError(400, 'INVALID_FIELDS', 'Informe apenas se o monitor está ativo.')
        return reply(200, await store.setEnabled(context, tenantId, match[1], body.enabled))
      }
      if (match[2] && request.method === 'POST') {
        if (activeChecks >= 4) throw new ApiError(503, 'BUSY', 'Há verificações em andamento. Tente novamente em instantes.')
        activeChecks++
        try {
          const monitor = await store.claim(context, tenantId, match[1])
          const result = await probe(monitor.url)
          return reply(200, { check: await store.record(context, tenantId, match[1], result) })
        } finally { activeChecks-- }
      }
      throw new ApiError(405, 'METHOD_NOT_ALLOWED', 'Esta ação não está disponível.')
    } catch (error) {
      if (error.status === 429) response.setHeader('Retry-After', '60')
      reply(error instanceof ApiError ? error.status : 503, { error: {
        code: error instanceof ApiError ? error.code : 'UNAVAILABLE',
        message: error instanceof ApiError ? error.message : 'Não foi possível concluir a solicitação. Tente novamente.'
      } })
    }
  }
}
