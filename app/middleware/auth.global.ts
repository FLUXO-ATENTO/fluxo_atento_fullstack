import { safeReturnPath, workspaceDestination } from '~/utils/auth-config'
export default defineNuxtRouteMiddleware(async to => {
  const { isDashboardApp } = useDeployment()
  const dashboardRoute = /^\/dashboard(?:\/|$)/.test(to.path)
  const path = to.path.replace(/\/$/, '') || '/'
  const publicDashboardRoute = /^\/(?:auth\/callback|recuperar-acesso|privacy|terms)$/.test(path)
  if (import.meta.server || (!isDashboardApp.value && !dashboardRoute && path !== '/login') || publicDashboardRoute) return
  const { user, waitUntilReady } = useAuth()
  await waitUntilReady()
  if (!user.value) {
    if (path === '/login') return
    return navigateTo({ path: '/login', query: { next: safeReturnPath(path, isDashboardApp.value) } }, { replace: true })
  }
  const workspace = useWorkspace()
  // Refresh authorization on navigation, including returns from the marketing site.
  const tenant = await workspace.load(workspace.activeTenant.value?.id)
  if (!tenant) throw createError({ statusCode: 503, statusMessage: 'Não foi possível confirmar suas permissões. Tente novamente.' })
  const destination = workspaceDestination(path === '/login' ? to.query.next : path, isDashboardApp.value, workspace.platformAdmin.value)
  if (destination !== path) return navigateTo(destination, { replace: true })
})
