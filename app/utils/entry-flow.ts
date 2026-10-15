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
