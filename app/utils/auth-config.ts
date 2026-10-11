export function publicSupabaseConfig(urlValue: unknown, keyValue: unknown): { url: string; key: string } | null {
  if (typeof urlValue !== 'string' || typeof keyValue !== 'string' || !keyValue) return null
  try {
    const url = new URL(urlValue)
    if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash) return null
    // Legacy anon JWT is accepted only for backwards compatibility; never service_role.
    const legacyRole = keyValue.startsWith('eyJ') ? JSON.parse(atob(keyValue.split('.')[1]!.replace(/-/g, '+').replace(/_/g, '/'))).role : ''
    if (!/^sb_publishable_[\w-]+$/.test(keyValue) && legacyRole !== 'anon') return null
    return { url: url.origin, key: keyValue }
  } catch { return null }
}

export function safeReturnPath(value: unknown, dashboardApp = false) {
  if (typeof value === 'string' && value !== '/') value = value.replace(/\/$/, '')
  const validPath = dashboardApp
    ? /^\/(?:[a-z0-9-]+(?:\/[a-z0-9-]+)*)?$/.test(value as string)
    : /^\/dashboard(?:\/[a-z0-9-]+)*$/.test(value as string)
  if (typeof value === 'string' && validPath) return value
  return dashboardApp ? '/' : '/dashboard'
}

// This chooses a screen, never grants a permission. The API checks the role again.
export function workspaceDestination(value: unknown, dashboardApp: boolean, platformAdmin: boolean) {
  const root = dashboardApp ? '/' : '/dashboard'
  const admin = dashboardApp ? '/admin' : '/dashboard/admin'
  const path = safeReturnPath(value, dashboardApp)
  const authRoute = /^\/(?:login|auth\/callback|recuperar-acesso)$/.test(path)
  if (path === root || authRoute) return platformAdmin ? admin : root
  if ((path === admin || path.startsWith(admin + '/')) && !platformAdmin) return root
  return path
}
