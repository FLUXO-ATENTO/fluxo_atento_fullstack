import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { publicSupabaseConfig } from '~/utils/auth-config'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig().public
  const valid = publicSupabaseConfig(config.supabaseUrl, config.supabasePublishableKey || config.supabaseKey)
  let supabase: SupabaseClient | null = null
  if (valid) supabase = createClient(valid.url, valid.key, {
    auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  })
  const user = useState<{ id: string; email?: string } | null>('auth-user', () => null)
  const ready = useState('auth-ready', () => false)
  const recovery = useState('auth-recovery', () => false)
  const update = (value: { id: string; email?: string } | null) => { user.value = value ? { id: value.id, email: value.email } : null }
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
