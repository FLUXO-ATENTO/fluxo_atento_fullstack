<script setup lang="ts">
useSeoMeta({ title: 'Confirmar acesso · Fluxo Atento', robots: 'noindex' })
const message = ref('Confirmando seu acesso…')
const { dashboardPath } = useDeployment()
onMounted(async () => {
  const auth = useAuth()
  try {
    await auth.waitUntilReady()
    if (auth.user.value) { await navigateTo(dashboardPath('/dashboard'), { replace: true }); return }
  } catch { /* Do not expose provider messages or URL tokens. */ }
  message.value = 'Não foi possível confirmar este link. Ele pode ter expirado ou ter sido aberto em outro navegador. Volte ao acesso para continuar.'
  window.history.replaceState({}, '', '/auth/callback')
})
</script>
<template><div class="container narrow-content"><h1>Confirmar seu acesso.</h1><p role="status">{{ message }}</p><NuxtLink to="/login" class="button button-primary">Voltar ao acesso</NuxtLink></div></template>
