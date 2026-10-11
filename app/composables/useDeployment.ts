/**
 * Keeps navigation independent of the hostname used to publish the app.
 * The public website uses /dashboard; the dedicated dashboard host uses /.
 */
export function useDeployment() {
  const config = useRuntimeConfig().public
  const isDashboardApp = computed(() => config.appMode === 'dashboard')
  const marketingUrl = computed(() => config.marketingUrl.replace(/\/$/, ''))
  const dashboardUrl = computed(() => config.dashboardUrl.replace(/\/$/, ''))

  function dashboardPath(path = '/dashboard') {
    if (!isDashboardApp.value) return path
    const stripped = path.replace(/^\/dashboard(?=\/|$)/, '')
    return stripped || '/'
  }

  function dashboardAccessUrl(path = '/login') {
    const localPath = dashboardPath(path)
    return isDashboardApp.value ? localPath : `${dashboardUrl.value}${localPath === '/dashboard' ? '/' : localPath}`
  }

  return { isDashboardApp, marketingUrl, dashboardUrl, dashboardPath, dashboardAccessUrl }
}
