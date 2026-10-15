<script setup lang="ts">
useSeoMeta({ title: 'Confirmar acesso · Fluxo Atento', robots: 'noindex' })
const message = ref('Confirmando seu acesso…')
import { safeReturnPath } from '~/utils/auth-config'
const { isDashboardApp } = useDeployment()
const auth = useAuth()
const { enter } = useAuthNavigation()
onMounted(async () => {
  try {
    if (new URLSearchParams(window.location.search).has('error') || new URLSearchParams(window.location.hash.slice(1)).has('error')) throw new Error('OAuth cancelled')
    await auth.waitUntilReady()
    // detectSessionInUrl + PKCE on the shared Supabase client completes the exchange.
    // Do not exchange the same code twice here or copy provider tokens into storage.
    if (auth.user.value) {
      let next: string | null = null
      try { next = sessionStorage.getItem('fluxo-auth-next'); sessionStorage.removeItem('fluxo-auth-next') } catch { /* Safe Home fallback. */ }
      await enter(safeReturnPath(next, isDashboardApp.value)); return
    }
  } catch { /* Do not expose provider messages or URL tokens. */ }
  message.value = 'Não foi possível confirmar este link. Ele pode ter expirado ou ter sido aberto em outro navegador. Volte ao acesso para continuar.'
  window.history.replaceState({}, '', '/auth/callback')
})
</script>
<template><div class="container narrow-content"><h1>Confirmar seu acesso.</h1><p role="status">{{ message }}</p><NuxtLink to="/login" class="button button-primary">Voltar ao acesso</NuxtLink></div></template>
