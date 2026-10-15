import { authDestination } from '~/utils/auth-destination'

export function useAuthNavigation() {
  const workspace = useWorkspace()
  const { isDashboardApp } = useDeployment()
  async function enter(next?: unknown) {
    const tenant = await workspace.load()
    if (!tenant) throw new Error('Seu acesso foi confirmado, mas não conseguimos preparar sua empresa. Tente entrar novamente.')
    return navigateTo(authDestination(next, isDashboardApp.value, workspace.platformAdmin.value), { replace: true })
  }
  return { enter }
}
