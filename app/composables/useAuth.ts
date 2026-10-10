import { publicSupabaseConfig } from '~/utils/auth-config'

export function useAuth() {
  const app = useNuxtApp()
  const config = useRuntimeConfig().public
  const user = useState<{ id: string; email?: string } | null>('auth-user', () => null)
  const ready = useState('auth-ready', () => false)
  const configured = Boolean(publicSupabaseConfig(config.supabaseUrl, config.supabasePublishableKey || config.supabaseKey))
  const client = () => app.$supabase
  async function signOut() {
    const { error } = await client()?.auth.signOut({ scope: 'local' }) || { error: null }
    if (error) throw new Error('Não foi possível encerrar a sessão. Tente novamente.')
    user.value = null
    await navigateTo('/login')
  }
  return { user, ready, configured, client, signOut, waitUntilReady: () => app.$authReady }
}
