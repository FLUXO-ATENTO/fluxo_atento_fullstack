import type { SupabaseClient } from '@supabase/supabase-js'
import { displayProfile, type AuthProfile } from '../../app/utils/workspace-ui'

/** Synthetic account only. No request is made to Supabase or any production API. */
export default defineNuxtPlugin(() => {
  const user = useState<AuthProfile | null>('auth-user', () => null)
  const ready = useState('auth-ready', () => true)
  const stored = sessionStorage.getItem('fluxo-preview-profile')
  if (stored) user.value = JSON.parse(stored)
  ready.value = true
  const fakeUser = () => ({ id: '11111111-1111-4111-8111-111111111111', email: user.value?.email || 'qa@example.test', user_metadata: { full_name: user.value?.displayName || 'Marina', contact_phone: user.value?.contactPhone || '', fluxo_tour_version: user.value?.tourVersion || 0, fluxo_palette: user.value?.palette } })
  const token = () => user.value?.email?.startsWith('tenant') ? 'fixture-member' : 'fixture-admin'
  const persist = () => sessionStorage.setItem('fluxo-preview-profile', JSON.stringify(user.value))
  const auth = {
    getSession: async () => ({ data: { session: user.value ? { access_token: token(), user: fakeUser() } : null }, error: null }),
    signInWithPassword: async ({ email }: { email: string }) => { user.value = displayProfile({ ...fakeUser(), email }); persist(); return { data: { session: { access_token: token() } }, error: null } },
    updateUser: async ({ data }: { data: Record<string, unknown> }) => { const next = { ...fakeUser(), user_metadata: { ...fakeUser().user_metadata, ...data } }; user.value = displayProfile(next); persist(); return { data: { user: next }, error: null } },
    signOut: async () => { user.value = null; sessionStorage.removeItem('fluxo-preview-profile'); useState('workspace-active-tenant').value = null; useState('workspace-platform-admin').value = false; useState('dashboard-recent-pages').value = []; return { error: null } },
    signUp: async () => ({ data: { session: null }, error: null }),
    resetPasswordForEmail: async () => ({ error: null })
  }
  const banner = document.createElement('div')
  banner.textContent = 'AMBIENTE DE TESTE · conta e dados fictícios · sem envio externo'
  banner.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:1000;padding:5px;text-align:center;font:11px sans-serif;background:#6c3518;color:white;pointer-events:none'
  document.body.append(banner)
  return { provide: { supabase: { auth } as unknown as SupabaseClient, authReady: Promise.resolve() } }
})
