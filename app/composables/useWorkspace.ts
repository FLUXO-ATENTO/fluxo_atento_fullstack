export interface WorkspaceTenant {
  id: string
  name: string
  role: 'owner' | 'admin' | 'member' | 'platform_admin'
  created_at?: string
}

interface WorkspacePayload {
  active_tenant: WorkspaceTenant
  tenants: WorkspaceTenant[]
  platform_admin: boolean
}

export function useWorkspace() {
  const auth = useAuth()
  const config = useRuntimeConfig().public
  const state = useWorkspaceState()
  const { activeTenant, tenants, platformAdmin, loading, error, resolvedFor, generation } = state

  async function load(selectedTenantId?: string) {
    const client = auth.client()
    if (!client || !auth.user.value) return null
    const identity = auth.user.value.id
    const current = ++generation.value
    const { data } = await client.auth.getSession()
    if (!data.session || current !== generation.value || auth.user.value?.id !== identity) return null
    const base = String(config.apiBase).replace(/\/$/, '')
    loading.value = true; error.value = ''
    try {
      const response = await fetch(`${base}/v1/workspace`, {
        cache: 'no-store', signal: AbortSignal.timeout(15000),
        headers: {
          Authorization: `Bearer ${data.session.access_token}`,
          ...(selectedTenantId ? { 'X-Fluxo-Tenant-Id': selectedTenantId } : {})
        }
      })
      const payload = await response.json().catch(() => null) as WorkspacePayload | null
      if (!response.ok || !payload?.active_tenant) throw new Error('Não foi possível preparar seu espaço agora.')
      if (current !== generation.value || auth.user.value?.id !== identity) return null
      activeTenant.value = payload.active_tenant
      tenants.value = payload.tenants
      platformAdmin.value = payload.platform_admin === true
      resolvedFor.value = identity
      return activeTenant.value
    } catch (cause) {
      if (current !== generation.value) return null
      activeTenant.value = null; platformAdmin.value = false; tenants.value = []; resolvedFor.value = ''
      error.value = cause instanceof Error ? cause.message : 'Não foi possível preparar seu espaço agora.'
      return null
    } finally { if (current === generation.value) loading.value = false }
  }

  async function ensure() {
    await auth.waitUntilReady()
    if (activeTenant.value && resolvedFor.value === auth.user.value?.id) return activeTenant.value
    return load()
  }

  return { activeTenant, tenants, platformAdmin, loading, error, load, ensure, reset: state.reset }
}
