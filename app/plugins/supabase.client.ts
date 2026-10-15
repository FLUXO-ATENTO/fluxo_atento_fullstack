import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { publicSupabaseConfig } from '~/utils/auth-config'
import { displayProfile, type AuthProfile } from '~/utils/workspace-ui'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig().public
  const valid = publicSupabaseConfig(config.supabaseUrl, config.supabasePublishableKey || config.supabaseKey)
  let supabase: SupabaseClient | null = null
  if (valid) supabase = createClient(valid.url, valid.key, {
    auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  })
  const user = useState<AuthProfile | null>('auth-user', () => null)
  const ready = useState('auth-ready', () => false)
  const recovery = useState('auth-recovery', () => false)
  const update = (value: { id: string; email?: string; user_metadata?: Record<string, unknown> } | null) => {
    if (user.value?.id !== value?.id) {
      // A new identity must never inherit the previous account's visible workspace.
      useState('workspace-active-tenant').value = null
      useState('workspace-tenants').value = []
      useState('workspace-platform-admin').value = false
      useState('workspace-loading').value = false
      useState('workspace-error').value = ''
      useState('dashboard-recent-pages').value = []
      useState('dashboard-copilot-open').value = false
      useState('dashboard-tour-open').value = false
    }
    user.value = displayProfile(value)
  }
  const authReady = (async () => {
    try {
      if (!supabase) return
      const { data } = await supabase.auth.getSession()
      update(data.session?.user ?? null)
    } finally { ready.value = true }
  })()
  supabase?.auth.onAuthStateChange((event, session) => {
    update(session?.user ?? null)
    if (event === 'PASSWORD_RECOVERY') recovery.value = true
    if (event === 'SIGNED_OUT') recovery.value = false
  })
  return { provide: { supabase, authReady } }
})
