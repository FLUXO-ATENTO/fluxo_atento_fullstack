export default defineEventHandler(event => {
  const path = getRequestURL(event).pathname
  if (path === '/v1/health') return { status: 'ok', service: 'fixture-only' }
  const token = getHeader(event, 'authorization')
  if (!['Bearer fixture-admin', 'Bearer fixture-member'].includes(token || '')) throw createError({ statusCode: 401 })
  if (event.method !== 'GET') throw createError({ statusCode: 405, statusMessage: 'Preview is read-only' })
  const tenant = { id: '22222222-2222-4222-8222-222222222222', name: 'Empresa de exemplo', role: 'owner' }
  if (path === '/v1/workspace') return { active_tenant: tenant, tenants: [tenant], platform_admin: token === 'Bearer fixture-admin' }
  if (path === '/v1/monitors') return { monitors: [] }
  if (path === '/v1/integrations') return { connections: [] }
  if (path === '/v1/integrations/google') return { available: false, connection: null }
  if (path.startsWith('/v1/admin/') && token !== 'Bearer fixture-admin') throw createError({ statusCode: 403 })
  if (path === '/v1/admin/tenants') return { tenants: [tenant] }
  if (path === '/v1/admin/providers') return { providers: [] }
  if (path === '/v1/admin/google') return { enabled: false, ready: false,
    checks: [{ id: 'credentials', label: 'Credenciais de integração no servidor', configured: false }, { id: 'encryption', label: 'Proteção das autorizações', configured: false }, { id: 'database', label: 'Estrutura de dados da integração', configured: false }],
    callback_url: 'https://api.fluxoatento.com.br/v1/integrations/google/callback',
    scopes: ['https://www.googleapis.com/auth/analytics.readonly', 'https://www.googleapis.com/auth/webmasters.readonly'] }
  throw createError({ statusCode: 404 })
})
