import { safeReturnPath } from './auth-config.ts'

/** Only app-local destinations. Never forward credentials, arbitrary URLs or entry loops. */
export function entryDestination(value: unknown, dashboardApp = true): string {
  const path = safeReturnPath(value, dashboardApp)
  if (/^\/(?:acessar|login|auth|recuperar-acesso)(?:\/|$)/.test(path)) return dashboardApp ? '/' : '/dashboard'
  return path
}
export function entrySource(value: unknown): 'site' | 'docs' | 'agente' {
  return value === 'docs' || value === 'agente' ? value : 'site'
}

/** Public hosts must not advertise routes before the dashboard release is live. */
export function dashboardEntryRoute(path: unknown, source: unknown, guided: boolean): string {
  // The previous dashboard does not contain the new module routes either.
  // Keep the compatible entry at Home until the guided release is accepted.
  const destination = guided ? entryDestination(path) : '/'
  const query = new URLSearchParams({ next: destination, origem: entrySource(source) })
  return `${guided ? '/acessar' : '/login/'}?${query}`
}
