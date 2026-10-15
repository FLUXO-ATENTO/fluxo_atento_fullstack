import { publicSupabaseConfig } from '~/utils/auth-config'
import type { PalettePreference } from '~/utils/interface-palette'
import { displayProfile, type AuthProfile } from '~/utils/workspace-ui'

export function useAuth() {
  const app = useNuxtApp()
  const config = useRuntimeConfig().public
  const user = useState<AuthProfile | null>('auth-user', () => null)
  const ready = useState('auth-ready', () => false)
  const configured = Boolean(publicSupabaseConfig(config.supabaseUrl, config.supabasePublishableKey || config.supabaseKey))
  const client = () => app.$supabase
  async function updateProfile(data: { full_name?: string; contact_phone?: string; fluxo_tour_version?: number; fluxo_palette?: PalettePreference }) {
    const instance = client()
    if (!instance || !user.value) throw new Error('Entre novamente para salvar suas preferências.')
    const currentId = user.value.id
    const result = await instance.auth.updateUser({ data })
    if (result.error) throw new Error('Não foi possível salvar. Confira sua conexão e tente novamente.')
    if (user.value?.id === currentId) user.value = displayProfile(result.data.user)
  }
  async function signOut() {
    const { error } = await client()?.auth.signOut({ scope: 'local' }) || { error: null }
    if (error) throw new Error('Não foi possível encerrar a sessão. Tente novamente.')
    user.value = null
    await navigateTo('/login')
  }
  return { user, ready, configured, client, signOut, updateProfile, waitUntilReady: () => app.$authReady }
}
