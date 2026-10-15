import { safeReturnPath } from '~/utils/auth-config'
export default defineNuxtRouteMiddleware(async to => {
  const { isDashboardApp, dashboardEntryUrl } = useDeployment()
  if (import.meta.client && !isDashboardApp.value && to.path === '/login') return navigateTo(dashboardEntryUrl(), { external: true, replace: true })
  const dashboardRoute = /^\/dashboard(?:\/|$)/.test(to.path)
  const publicDashboardRoute = /^\/(?:acessar|login|auth\/callback|recuperar-acesso|privacy|terms|exclusao-de-dados)$/.test(to.path)
  if (import.meta.server || (!isDashboardApp.value && !dashboardRoute) || (isDashboardApp.value && publicDashboardRoute)) return
  const { user, waitUntilReady } = useAuth()
  await waitUntilReady()
  if (!user.value) return navigateTo({ path: '/login', query: { next: safeReturnPath(to.path, isDashboardApp.value) } }, { replace: true })
})
