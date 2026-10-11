import { safeReturnPath } from '~/utils/auth-config'
export default defineNuxtRouteMiddleware(async to => {
  const { isDashboardApp } = useDeployment()
  const dashboardRoute = /^\/dashboard(?:\/|$)/.test(to.path)
  const publicDashboardRoute = /^\/(?:login|auth\/callback|recuperar-acesso|privacy|terms)$/.test(to.path)
  if (import.meta.server || (!isDashboardApp.value && !dashboardRoute) || (isDashboardApp.value && publicDashboardRoute)) return
  const { user, waitUntilReady } = useAuth()
  await waitUntilReady()
  if (!user.value) return navigateTo({ path: '/login', query: { next: safeReturnPath(to.path, isDashboardApp.value) } }, { replace: true })
})
