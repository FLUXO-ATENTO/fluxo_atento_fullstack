import { googleApiError } from '~/utils/google-integration'

export function useGoogleApi() {
  const auth = useAuth()
  const workspace = useWorkspace()
  const config = useRuntimeConfig().public

  return async function googleRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
    if (!/^\/v1\/(?:admin\/google|integrations\/google)(?:\/[a-z]+)?$/.test(path)) throw new Error('Ação não reconhecida.')
    const identity = auth.user.value?.id
    const instance = auth.client()
    if (!identity || !instance) throw new Error('Entre novamente para continuar.')
    const tenant = await workspace.ensure()
    const { data } = await instance.auth.getSession()
    if (!tenant || !data.session || auth.user.value?.id !== identity) throw new Error('Confira seu acesso e tente novamente.')
    const response = await fetch(String(config.apiBase).replace(/\/$/, '') + path, {
      ...init, credentials: 'include', cache: 'no-store', signal: AbortSignal.timeout(path.endsWith('/resources') ? 55000 : 25000),
      headers: { Authorization: `Bearer ${data.session.access_token}`, 'X-Fluxo-Tenant-Id': tenant.id,
        ...(init.body ? { 'Content-Type': 'application/json' } : {}) }
    })
    const payload = await response.json().catch(() => null)
    if (auth.user.value?.id !== identity || workspace.activeTenant.value?.id !== tenant.id) throw new Error('O espaço mudou. Atualize a página para continuar.')
    if (!response.ok || !payload) throw new Error(googleApiError(response.status, payload?.error?.code))
    return payload as T
  }
}
