export function useWorkspaceApi() {
  const auth = useAuth()
  const workspace = useWorkspace()
  const config = useRuntimeConfig().public
  return async function request<T>(path: string, init: RequestInit = {}, tenantScoped = false): Promise<T> {
    const identity = auth.user.value?.id
    const client = auth.client()
    if (!client || !identity) throw new Error('Entre na sua conta para continuar.')
    const tenant = tenantScoped ? await workspace.ensure() : null
    if (tenantScoped && !tenant) throw new Error('Não foi possível confirmar o tenant.')
    const { data } = await client.auth.getSession()
    if (!data.session || auth.user.value?.id !== identity) throw new Error('Sua sessão terminou. Entre novamente.')
    const response = await fetch(String(config.apiBase).replace(/\/$/, '') + path, {
      ...init, cache: 'no-store', signal: AbortSignal.timeout(20000),
      headers: { Authorization: `Bearer ${data.session.access_token}`, ...(tenant ? { 'X-Fluxo-Tenant-Id': tenant.id } : {}), ...(init.body ? { 'Content-Type': 'application/json' } : {}) }
    })
    const payload = await response.json().catch(() => null)
    if (auth.user.value?.id !== identity || (tenant && workspace.activeTenant.value?.id !== tenant.id)) throw new Error('O contexto mudou. Atualize a tela.')
    if (!response.ok) throw new Error(payload?.error?.message || 'Não foi possível concluir esta ação.')
    return payload as T
  }
}
