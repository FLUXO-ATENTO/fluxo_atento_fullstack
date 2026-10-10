export interface MonitorCheck {
  id: string
  monitor_id: string
  checked_at: string
  status: 'ok' | 'attention' | 'failed'
  http_status: number | null
  duration_ms: number
  detail: string
}
export interface Monitor {
  id: string
  name: string
  url: string
  hostname: string
  enabled: boolean
  created_at: string
  last_requested_at: string | null
  checks: MonitorCheck[]
}
