import type { WorkspaceTenant } from './useWorkspace'

export function useWorkspaceState() {
  const activeTenant = useState<WorkspaceTenant | null>('workspace-active-tenant', () => null)
  const tenants = useState<WorkspaceTenant[]>('workspace-tenants', () => [])
  const platformAdmin = useState('workspace-platform-admin', () => false)
  const loading = useState('workspace-loading', () => false)
  const error = useState('workspace-error', () => '')
  const resolvedFor = useState('workspace-user', () => '')
  const generation = useState('workspace-generation', () => 0)
  function reset() {
    generation.value++
    activeTenant.value = null; tenants.value = []; platformAdmin.value = false
    resolvedFor.value = ''; loading.value = false; error.value = ''
  }
  return { activeTenant, tenants, platformAdmin, loading, error, resolvedFor, generation, reset }
}
