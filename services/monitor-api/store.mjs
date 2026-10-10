import { createClient } from '@supabase/supabase-js'
import { ApiError } from './errors.mjs'

const fields = 'id,name,url,hostname,enabled,created_at,last_requested_at'
const options = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  global: { fetch: (url, init) => fetch(url, { ...init, signal: AbortSignal.timeout(8000) }) } }

function databaseError(error) {
  if (!error) return
  if (error.code === '23505') throw new ApiError(409, 'DUPLICATE', 'Esse endereço já está cadastrado.')
  if (error.message === 'FREE_MONITOR_LIMIT') throw new ApiError(409, 'PLAN_LIMIT', 'Nesta etapa, sua conta permite duas páginas de um mesmo site.')
  throw new ApiError(503, 'DATABASE_UNAVAILABLE', 'Não foi possível acessar seus dados. Tente novamente em instantes.')
}

export function createStore({ supabaseUrl, publicKey, secretKey }) {
  const auth = createClient(supabaseUrl, publicKey, options)
  const writer = createClient(supabaseUrl, secretKey, options)
  const reader = token => createClient(supabaseUrl, publicKey, {
    ...options, global: { ...options.global, headers: { Authorization: `Bearer ${token}` } }
  })
  return {
    async authenticate(token) {
      const { data, error } = await auth.auth.getUser(token)
      if (error || !data.user || data.user.is_anonymous) {
        if (error?.status >= 500 || error?.name === 'AuthRetryableFetchError') throw new ApiError(503, 'AUTH_UNAVAILABLE', 'Não foi possível confirmar seu acesso. Tente novamente.')
        throw new ApiError(401, 'UNAUTHORIZED', 'Entre na sua conta para continuar.')
      }
      return { userId: data.user.id, token }
    },
    async list(context) {
      const client = reader(context.token)
      const [monitors, checks] = await Promise.all([
        client.from('monitors').select(fields).eq('user_id', context.userId).order('created_at').limit(30),
        client.from('monitor_checks').select('id,monitor_id,status,http_status,duration_ms,detail,checked_at')
          .eq('user_id', context.userId).order('checked_at', { ascending: false }).limit(50)
      ])
      databaseError(monitors.error); databaseError(checks.error)
      return monitors.data.map(monitor => ({ ...monitor, checks: checks.data.filter(check => check.monitor_id === monitor.id).slice(0, 5) }))
    },
    async create(context, url) {
      const { data, error } = await writer.rpc('create_monitor_for_user', {
        p_user_id: context.userId, p_url: url.toString(), p_hostname: url.hostname
      })
      databaseError(error)
      return { id: data }
    },
    async setEnabled(context, id, enabled) {
      const { data, error } = await writer.from('monitors').update({ enabled })
        .eq('id', id).eq('user_id', context.userId).select('id').maybeSingle()
      databaseError(error)
      if (!data) throw new ApiError(404, 'NOT_FOUND', 'Esse monitor não está disponível na sua conta.')
      return data
    },
    async claim(context, id) {
      const client = reader(context.token)
      const { data: monitor, error } = await client.from('monitors').select('id,url,enabled')
        .eq('id', id).eq('user_id', context.userId).maybeSingle()
      databaseError(error)
      if (!monitor) throw new ApiError(404, 'NOT_FOUND', 'Esse monitor não está disponível na sua conta.')
      if (!monitor.enabled) throw new ApiError(409, 'PAUSED', 'Reative o monitor antes de verificar.')
      const cutoff = new Date(Date.now() - 60000).toISOString()
      const { data: claimed, error: claimError } = await writer.from('monitors')
        .update({ last_requested_at: new Date().toISOString() }).eq('id', id).eq('user_id', context.userId).eq('enabled', true)
        .or(`last_requested_at.is.null,last_requested_at.lt.${cutoff}`).select('id,url').maybeSingle()
      databaseError(claimError)
      if (!claimed) throw new ApiError(429, 'CHECK_COOLDOWN', 'Aguarde um minuto entre verificações deste endereço.')
      return claimed
    },
    async record(context, id, result) {
      const { data, error } = await writer.from('monitor_checks').insert({ ...result, monitor_id: id, user_id: context.userId })
        .select('id,monitor_id,status,http_status,duration_ms,detail,checked_at').single()
      databaseError(error)
      return data
    }
  }
}
