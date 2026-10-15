export interface TurnstileApi {
  render(container: HTMLElement, options: {
    sitekey: string; action: string; theme: 'light' | 'dark'; language: string; size: 'flexible'
    'response-field': boolean; retry: 'never'; 'refresh-expired': 'manual'; 'refresh-timeout': 'manual'
    callback: (token: string) => void
    'error-callback': () => boolean
    'expired-callback': () => void
    'timeout-callback': () => void
    'unsupported-callback': () => void
  }): string
  remove(widgetId: string): void
}

let loading: Promise<TurnstileApi> | undefined
export function loadTurnstile(): Promise<TurnstileApi> {
  const target = window as Window & { turnstile?: TurnstileApi }
  if (target.turnstile) return Promise.resolve(target.turnstile)
  if (loading) return loading
  loading = new Promise<TurnstileApi>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    script.async = true
    let settled = false
    const finish = (api?: TurnstileApi) => {
      if (settled) return
      settled = true
      clearTimeout(timeout)
      script.onload = null; script.onerror = null
      if (api) resolve(api)
      else { script.remove(); reject(new Error('Verificação de segurança indisponível.')) }
    }
    const timeout = setTimeout(() => finish(), 15_000)
    script.onload = () => finish(target.turnstile)
    script.onerror = () => finish()
    document.head.append(script)
  }).catch(error => { loading = undefined; throw error })
  return loading
}
