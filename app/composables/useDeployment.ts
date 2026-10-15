import { entryDestination, entrySource } from '~/utils/entry-flow'
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
    if (path === '/login') return dashboardEntryUrl()
    const localPath = dashboardPath(path)
    return isDashboardApp.value ? localPath : `${dashboardUrl.value}${localPath === '/dashboard' ? '/' : localPath}`
  }

  function dashboardEntryUrl(path = '/', source: 'site' | 'docs' | 'agente' = 'site') {
    const destination = entryDestination(path.replace(/^\/dashboard(?=\/|$)/, '') || '/')
    const query = new URLSearchParams({ next: destination, origem: entrySource(source) })
    return `${isDashboardApp.value ? '' : dashboardUrl.value}/acessar?${query}`
  }

  return { isDashboardApp, marketingUrl, dashboardUrl, dashboardPath, dashboardAccessUrl, dashboardEntryUrl }
}
