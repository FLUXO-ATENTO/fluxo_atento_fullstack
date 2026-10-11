import type { Monitor } from '~/types/monitor'
import { publicErrorMessage } from '~/utils/monitor-response'

export function useMonitors() {
  const auth = useAuth()
  const workspace = useWorkspace()
  const config = useRuntimeConfig().public
  const monitors = ref<Monitor[]>([])
  const loading = ref(false)
  const busy = ref('')
  const error = ref('')
  let generation = 0
  let controller: AbortController | null = null
  async function request<T>(path: string, method = 'GET', body?: object): Promise<T> {
    const tenant = await workspace.ensure()
    if (!tenant) throw new Error('Não foi possível preparar seu espaço agora.')
    const client = auth.client()
    if (!client || !auth.user.value) throw new Error('Entre na sua conta para continuar.')
    const { data } = await client.auth.getSession()
    if (!data.session) { await navigateTo('/login'); throw new Error('Sua sessão terminou. Entre novamente.') }
    const base = String(config.apiBase).replace(/\/$/, '')
    const url = new URL(base)
    if (url.protocol !== 'https:' && !(import.meta.dev && url.hostname === 'localhost')) throw new Error('A conexão do painel ainda precisa ser configurada.')
    const response = await fetch(`${base}/v1${path}`, {
      method, cache: 'no-store', signal: AbortSignal.any([AbortSignal.timeout(20000), controller!.signal]),
      headers: { Authorization: `Bearer ${data.session.access_token}`, 'X-Fluxo-Tenant-Id': tenant.id, ...(body ? { 'Content-Type': 'application/json' } : {}) },
      body: body ? JSON.stringify(body) : undefined
    })
    if (response.status === 401) { await navigateTo('/login'); throw new Error('Sua sessão terminou. Entre novamente.') }
    const payload = await response.json().catch(() => null)
    if (!response.ok) throw new Error(publicErrorMessage(response.status, payload))
    return payload as T
  }
  async function load() {
    if (!auth.user.value) return
    const current = generation
    loading.value = true; error.value = ''
    try {
      const result = await request<{ monitors: Monitor[] }>('/monitors')
      if (current === generation) monitors.value = result.monitors
    } catch (cause) {
      if (current === generation && !controller?.signal.aborted) error.value = cause instanceof Error && cause.message !== 'Failed to fetch' ? cause.message : 'Não conseguimos conectar ao serviço. Tente novamente em instantes.'
    } finally { if (current === generation) loading.value = false }
  }
  async function act(key: string, path: string, method: string, body?: object) {
    if (busy.value) return false
    const current = generation
    busy.value = key; error.value = ''
    try {
      await request(path, method, body)
      if (current !== generation) return false
      await load()
      return !error.value
    } catch (cause) {
      if (current === generation) error.value = cause instanceof Error && cause.message !== 'Failed to fetch' ? cause.message : 'A conexão foi interrompida. Atualize a lista antes de tentar novamente.'
      return false
    } finally { if (current === generation) busy.value = '' }
  }
  watch(() => auth.user.value?.id, () => {
    generation++; controller?.abort(); controller = new AbortController()
    monitors.value = []; error.value = ''; loading.value = false; busy.value = ''
    if (auth.ready.value && auth.user.value) void load()
  })
  onMounted(async () => { await auth.waitUntilReady(); controller ||= new AbortController(); if (!loading.value) void load() })
  onBeforeUnmount(() => { generation++; controller?.abort() })
  return { monitors, loading, error, busy, load,
    add: (url: string) => act('add', '/monitors', 'POST', { url }),
    check: (id: string) => act(id, `/monitors/${id}/check`, 'POST'),
    toggle: (monitor: Monitor) => act(monitor.id, `/monitors/${monitor.id}`, 'PATCH', { enabled: !monitor.enabled }) }
}
