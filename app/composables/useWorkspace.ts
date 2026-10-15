export interface WorkspaceTenant {
  id: string
  name: string
  role: 'owner' | 'admin' | 'member'
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
  const activeTenant = useState<WorkspaceTenant | null>('workspace-active-tenant', () => null)
  const tenants = useState<WorkspaceTenant[]>('workspace-tenants', () => [])
  const platformAdmin = useState('workspace-platform-admin', () => false)
  const loading = useState('workspace-loading', () => false)
  const error = useState('workspace-error', () => '')

  async function load(selectedTenantId?: string) {
    const client = auth.client()
    if (!client || !auth.user.value) return null
    const identity = auth.user.value.id
    const { data } = await client.auth.getSession()
    if (!data.session) return null
    const base = String(config.apiBase).replace(/\/$/, '')
    loading.value = true; error.value = ''
    try {
      const response = await fetch(`${base}/v1/workspace`, {
        cache: 'no-store', signal: AbortSignal.timeout(20000),
        headers: {
          Authorization: `Bearer ${data.session.access_token}`,
          ...(selectedTenantId ? { 'X-Fluxo-Tenant-Id': selectedTenantId } : {})
        }
      })
      const payload = await response.json().catch(() => null) as WorkspacePayload | null
      if (!response.ok || !payload?.active_tenant) throw new Error('Não foi possível preparar seu espaço agora.')
      if (auth.user.value?.id !== identity) return null
      activeTenant.value = payload.active_tenant
      tenants.value = payload.tenants
      platformAdmin.value = payload.platform_admin === true
      return activeTenant.value
    } catch (cause) {
      if (auth.user.value?.id === identity) error.value = 'Não foi possível preparar seu espaço agora. Tente novamente.'
      return null
    } finally { if (auth.user.value?.id === identity) loading.value = false }
  }

  async function ensure() {
    if (activeTenant.value) return activeTenant.value
    await auth.waitUntilReady()
    return load()
  }

  return { activeTenant, tenants, platformAdmin, loading, error, load, ensure }
}
