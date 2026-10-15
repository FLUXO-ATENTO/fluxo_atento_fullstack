/** Public contracts only. Google credentials and OAuth tokens never belong here. */
export interface GoogleProviderStatus {
  enabled: boolean
  ready: boolean
  checks: { id: string; label: string; configured: boolean }[]
  callback_url: string
  scopes: string[]
  external_apis_verified: boolean
}

export interface GoogleConnectionStatus {
  available: boolean
  connection: null | {
    status: 'connected' | 'needs_reconnect'
    connected_at: string
    last_checked_at?: string | null
    scopes: string[]
  }
}

export interface GoogleResources {
  analytics: { id: string; name: string; account_name?: string }[]
  search_console: { id: string; name: string; permission?: string }[]
  checked_at: string
  errors?: { analytics?: string; search_console?: string }
  truncated?: boolean
}

export interface GoogleDisconnectResult {
  disconnected: boolean
  revocation: 'succeeded' | 'failed'
}

export function googleDisconnectMessage(result: GoogleDisconnectResult) {
  if (result.disconnected !== true) return 'A remoção não foi confirmada. Atualize a situação antes de tentar novamente.'
  if (result.revocation === 'failed') return 'A conexão local foi removida, mas a revogação no Google não foi confirmada. Revise também os acessos de terceiros na sua Conta Google.'
  if (result.revocation === 'succeeded') return 'A conexão foi removida e o Google confirmou a revogação. Outras conexões desta mesma conta com a Fluxo Atento podem precisar de nova autorização.'
  return 'A conexão local foi removida. O resultado da revogação externa não pôde ser confirmado.'
}

export function googleAuthorizationUrl(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 8192) return null
  try {
    const url = new URL(value)
    if (url.origin !== 'https://accounts.google.com' || url.pathname !== '/o/oauth2/v2/auth'
      || url.username || url.password || url.hash || url.searchParams.get('response_type') !== 'code') return null
    return url.href
  } catch { return null }
}

export function googleConnectionLabel(status: GoogleConnectionStatus | null) {
  if (!status) return 'Situação não confirmada'
  if (status.connection?.status === 'needs_reconnect') return 'Autorize novamente'
  if (status.connection?.status === 'connected') return status.available ? 'Autorização registrada' : 'Pausada pela plataforma'
  return status.available ? 'Pronta para conectar' : 'Aguardando liberação'
}

export function googleReturnMessage(value: unknown) {
  if (value === 'connected') return 'O Google retornou ao painel. Confira abaixo a situação atual e consulte as fontes autorizadas.'
  if (value === 'cancelled') return 'A autorização não foi concluída. Você pode continuar usando o painel e tentar novamente depois.'
  if (value === 'error') return 'Não foi possível concluir a conexão. Confira a situação abaixo antes de tentar novamente.'
  return ''
}

export function googleApiError(status: number, code?: string) {
  if (status === 401) return 'Sua sessão terminou. Entre novamente para continuar.'
  if (status === 403) return 'Sua conta não tem permissão para esta ação neste espaço.'
  if (status === 404) return 'A integração Google ainda não foi publicada neste servidor.'
  if (status === 429) return 'Aguarde um minuto antes de tentar novamente.'
  if (code === 'GOOGLE_OAUTH_IN_PROGRESS') return 'Há uma autorização Google em andamento. Aguarde sua conclusão e tente novamente.'
  if (code === 'GOOGLE_RECONNECT_REQUIRED') return 'A autorização precisa ser renovada. Conecte sua conta Google novamente.'
  if (status === 409) return 'A conexão ainda não está pronta para esta ação. Atualize a situação e confira os requisitos.'
  return 'Não foi possível consultar o Google agora. Tente novamente; nenhum resultado foi substituído por exemplos.'
}
