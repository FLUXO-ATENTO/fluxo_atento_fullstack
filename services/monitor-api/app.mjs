import { ApiError } from './errors.mjs'
import { normalizeTarget, resolveTarget, checkWebsite } from './probe.mjs'
import { createGoogleService } from './google-service.mjs'

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
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

export function createHandler({ store, allowedOrigins, probe = checkWebsite, validate = resolveTarget, google = createGoogleService({ store: store.google }) }) {
  const requests = new Map()
  let activeChecks = 0
  return async function handler(request, response) {
    const reply = (status, body) => {
      response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer' })
      response.end(JSON.stringify(body))
    }
    try {
      const requestUrl = new URL(request.url, 'http://localhost')
      const path = requestUrl.pathname.replace(/\/$/, '')
      const googleRoute = path === '/v1/admin/google' || path === '/v1/integrations/google' || path.startsWith('/v1/integrations/google/')
      const origin = request.headers.origin
      if (origin && !allowedOrigins.includes(origin)) throw new ApiError(403, 'ORIGIN_DENIED', 'Este endereço de acesso não foi autorizado.')
      response.setHeader('Vary', 'Origin')
      if (origin) {
        response.setHeader('Access-Control-Allow-Origin', origin)
        if (googleRoute) response.setHeader('Access-Control-Allow-Credentials', 'true')
      }
      if (request.method === 'OPTIONS') {
        response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS')
        response.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-Fluxo-Tenant-Id')
        response.setHeader('Access-Control-Max-Age', '600')
        response.writeHead(204); response.end(); return
      }
      if (path === '/v1/health' && request.method === 'GET') return reply(200, { status: 'ok', service: 'fluxo-atento-monitor', contract: 1 })
      if (!path.startsWith('/v1/')) throw new ApiError(404, 'NOT_FOUND', 'Rota não encontrada.')
      // Google redirects have no Supabase Bearer token. State + host-only nonce
      // authenticate this one callback; every other integration route uses Bearer.
      if (path === '/v1/integrations/google/callback' && request.method === 'GET') {
        const result = await google.callback(requestUrl.searchParams, request.headers.cookie, request.socket.remoteAddress)
        response.writeHead(303, { Location: result.location, 'Set-Cookie': result.cookie, 'Cache-Control': 'no-store',
          'Referrer-Policy': 'no-referrer', 'X-Content-Type-Options': 'nosniff' })
        response.end(); return
      }
      const token = /^Bearer ([A-Za-z0-9._-]+)$/.exec(request.headers.authorization || '')?.[1]
      if (!token || token.length > 8192) throw new ApiError(401, 'UNAUTHORIZED', 'Entre na sua conta para continuar.')
      const context = await store.authenticate(token)
      const requestedTenantId = request.headers['x-fluxo-tenant-id']
      if (requestedTenantId && (typeof requestedTenantId !== 'string' || !uuid.test(requestedTenantId))) throw new ApiError(400, 'INVALID_TENANT', 'O espaço informado não é válido.')
      if (path === '/v1/admin/google' && request.method === 'GET') return reply(200, await google.adminStatus(context))
      if (path === '/v1/admin/google' && request.method === 'PATCH') {
        const body = await readJson(request)
        if (Object.keys(body).length !== 1 || typeof body.enabled !== 'boolean') throw new ApiError(400, 'INVALID_FIELDS', 'Informe somente se a integração Google está habilitada.')
        return reply(200, await google.setEnabled(context, body.enabled))
      }
      const workspace = await store.workspace(context, requestedTenantId)
      if (path === '/v1/workspace' && request.method === 'GET') return reply(200, {
        active_tenant: workspace.activeTenant,
        tenants: workspace.tenants,
        platform_admin: workspace.platformAdmin
      })
      if (path === '/v1/admin/tenants' && request.method === 'GET') return reply(200, { tenants: await store.adminTenants(context) })
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
      if (path === '/v1/integrations/google' && request.method === 'GET') return reply(200, await google.status(context, tenantId))
      if (path === '/v1/integrations/google/resources' && request.method === 'GET') return reply(200, await google.resources(context, tenantId))
      if (['/v1/integrations/google/authorize', '/v1/integrations/google/disconnect'].includes(path) && request.method === 'POST') {
        const body = await readJson(request)
        if (Object.keys(body).length) throw new ApiError(400, 'INVALID_FIELDS', 'Envie um objeto vazio, sem credenciais ou identificadores.')
        if (path.endsWith('/authorize')) {
          const result = await google.authorize(context, tenantId, request.headers.cookie)
          response.setHeader('Set-Cookie', result.cookie)
          return reply(200, result.body)
        }
        return reply(200, await google.disconnect(context, tenantId))
      }
      if (googleRoute) throw new ApiError(405, 'METHOD_NOT_ALLOWED', 'Esta ação não está disponível.')
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
      const now = Date.now()
      for (const [key, entry] of requests) if (entry.until <= now) requests.delete(key)
      if (!requests.has(context.userId) && requests.size >= 5000) throw new ApiError(503, 'BUSY', 'Tente novamente em instantes.')
      const counter = requests.get(context.userId) || { count: 0, until: now + 60000 }
      counter.count++; requests.set(context.userId, counter)
      if (counter.count > 30) throw new ApiError(429, 'RATE_LIMIT', 'Muitas solicitações. Aguarde um minuto e tente novamente.')
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
