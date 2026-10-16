import { authDestination } from '~/utils/auth-destination'

export function useAuthNavigation() {
  const workspace = useWorkspace()
  const { isDashboardApp } = useDeployment()
  async function enter(next?: unknown) {
    const tenant = await workspace.load()
    if (!tenant && !workspace.platformAdmin.value) throw new Error('Seu acesso foi confirmado, mas não conseguimos preparar sua empresa. Tente entrar novamente.')
    return navigateTo(authDestination(tenant ? next : undefined, isDashboardApp.value, workspace.platformAdmin.value), { replace: true })
  }
  return { enter }
}
