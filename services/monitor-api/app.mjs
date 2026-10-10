import { ApiError } from './errors.mjs'
import { normalizeTarget, resolveTarget, checkWebsite } from './probe.mjs'

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
        response.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type')
        response.setHeader('Access-Control-Max-Age', '600')
        response.writeHead(204); response.end(); return
      }
      const path = new URL(request.url, 'http://localhost').pathname.replace(/\/$/, '')
      if (path === '/v1/health' && request.method === 'GET') return reply(200, { status: 'ok', service: 'fluxo-atento-monitor', contract: 1 })
      if (!path.startsWith('/v1/monitors')) throw new ApiError(404, 'NOT_FOUND', 'Rota não encontrada.')
      const token = /^Bearer ([A-Za-z0-9._-]+)$/.exec(request.headers.authorization || '')?.[1]
      if (!token || token.length > 8192) throw new ApiError(401, 'UNAUTHORIZED', 'Entre na sua conta para continuar.')
      const context = await store.authenticate(token)
      const now = Date.now()
      for (const [key, entry] of requests) if (entry.until <= now) requests.delete(key)
      if (!requests.has(context.userId) && requests.size >= 5000) throw new ApiError(503, 'BUSY', 'Tente novamente em instantes.')
      const counter = requests.get(context.userId) || { count: 0, until: now + 60000 }
      counter.count++; requests.set(context.userId, counter)
      if (counter.count > 30) throw new ApiError(429, 'RATE_LIMIT', 'Muitas solicitações. Aguarde um minuto e tente novamente.')
      if (path === '/v1/monitors' && request.method === 'GET') return reply(200, { monitors: await store.list(context) })
      if (path === '/v1/monitors' && request.method === 'POST') {
        const body = await readJson(request)
        if (Object.keys(body).some(key => key !== 'url')) throw new ApiError(400, 'INVALID_FIELDS', 'Envie somente o endereço da página.')
        const url = normalizeTarget(body.url)
        await validate(url.toString(), { signal: AbortSignal.timeout(4000) })
        return reply(201, await store.create(context, url))
      }
      const match = /^\/v1\/monitors\/([^/]+)(\/check)?$/.exec(path)
      if (!match || !uuid.test(match[1])) throw new ApiError(404, 'NOT_FOUND', 'Monitor não encontrado.')
      if (!match[2] && request.method === 'PATCH') {
        const body = await readJson(request)
        if (typeof body.enabled !== 'boolean' || Object.keys(body).some(key => key !== 'enabled')) throw new ApiError(400, 'INVALID_FIELDS', 'Informe apenas se o monitor está ativo.')
        return reply(200, await store.setEnabled(context, match[1], body.enabled))
      }
      if (match[2] && request.method === 'POST') {
        if (activeChecks >= 4) throw new ApiError(503, 'BUSY', 'Há verificações em andamento. Tente novamente em instantes.')
        activeChecks++
        try {
          const monitor = await store.claim(context, match[1])
          const result = await probe(monitor.url)
          return reply(200, { check: await store.record(context, match[1], result) })
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
