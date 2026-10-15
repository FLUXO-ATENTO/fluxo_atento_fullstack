import { safeReturnPath } from './auth-config.ts'

/** platformAdmin comes only from the verified workspace API, never user metadata. */
export function authDestination(next: unknown, dashboardApp: boolean, platformAdmin: boolean): string {
  const home = dashboardApp ? '/' : '/dashboard'
  const admin = dashboardApp ? '/admin' : '/dashboard/admin'
  const path = safeReturnPath(next, dashboardApp)
  if (path === home && platformAdmin) return admin
  if (path === admin && !platformAdmin) return home
  return path
}
