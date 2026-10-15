import { addRecentPage, type RecentPage } from '~/utils/workspace-ui'

export function useDashboardChrome() {
  const copilotOpen = useState('dashboard-copilot-open', () => false)
  const tourOpen = useState('dashboard-tour-open', () => false)
  const recent = useState<RecentPage[]>('dashboard-recent-pages', () => [])
  function visit(path: string, label: string) { recent.value = addRecentPage(recent.value, { path, label }) }
  return { copilotOpen, tourOpen, recent, visit }
}
