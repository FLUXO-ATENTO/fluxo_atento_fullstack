import { safeReturnPath } from '~/utils/auth-config'
export default defineNuxtRouteMiddleware(async to => {
  if (import.meta.server || !/^\/dashboard(?:\/|$)/.test(to.path)) return
  const { user, waitUntilReady } = useAuth()
  await waitUntilReady()
  if (!user.value) return navigateTo({ path: '/login', query: { next: safeReturnPath(to.path) } }, { replace: true })
})
