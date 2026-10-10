import { scenarios, type ScenarioId } from '~/data/experience'
export interface DemoMonitor { id: number; name: string; url: string; enabled: boolean }
const initialMonitors = (): DemoMonitor[] => [
  { id: 1, name: 'Checkout', url: 'https://loja.exemplo.com/checkout', enabled: true },
  { id: 2, name: 'Página de contato', url: 'https://loja.exemplo.com/contato', enabled: true },
  { id: 3, name: 'Oferta principal', url: 'https://loja.exemplo.com/oferta', enabled: true }
]
export function useDemoWorkspace() {
  const resolved = useState<ScenarioId[]>('demo-resolved', () => [])
  const monitors = useState<DemoMonitor[]>('demo-monitors', initialMonitors)
  const activity = useState<string[]>('demo-activity', () => [])
  const alerts = computed(() => scenarios.map((item, index) => ({
    ...item, severity: index === 2 ? 'info' : 'attention',
    time: ['14:32', '13:48', '09:15'][index],
    resolved: resolved.value.includes(item.id)
  })))
  function resolve(id: ScenarioId) {
    if (resolved.value.includes(id)) return
    resolved.value = [...resolved.value, id]
    activity.value.unshift(`Revisado: ${scenarios.find(item => item.id === id)?.action}`)
  }
  function addMonitor(url: string) {
    if (monitors.value.some(item => item.url === url)) return false
    monitors.value.push({ id: Math.max(0, ...monitors.value.map(item => item.id)) + 1, name: new URL(url).hostname, url, enabled: true })
    activity.value.unshift('Monitor adicionado à demonstração. Nenhum site foi acessado.')
    return true
  }
  function toggleMonitor(id: number) {
    const item = monitors.value.find(item => item.id === id)
    if (item) {
      item.enabled = !item.enabled
      activity.value.unshift(`${item.name}: ${item.enabled ? 'ativado' : 'pausado'} na demonstração.`)
    }
  }
  function reset() { resolved.value = []; monitors.value = initialMonitors(); activity.value = [] }
  return { resolved, monitors, alerts, activity, resolve, addMonitor, toggleMonitor, reset }
}
