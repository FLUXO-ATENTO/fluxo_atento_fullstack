<script setup lang="ts">
useSeoMeta({ title: 'Nova senha · Fluxo Atento', robots: 'noindex' })
const auth = useAuth()
const password = ref(''); const confirm = ref(''); const error = ref(''); const busy = ref(false); const ready = ref(false)
onMounted(async () => { try { await auth.waitUntilReady() } finally { ready.value = true; window.history.replaceState({}, '', '/recuperar-acesso') } })
async function submit() {
  if (password.value !== confirm.value) { error.value = 'As duas senhas precisam ser iguais.'; return }
  busy.value = true; error.value = ''
  try {
    const client = auth.client()
    if (!client || !auth.user.value) throw new Error()
    const { error: failure } = await client.auth.updateUser({ password: password.value })
    if (failure) throw new Error()
    await auth.signOut()
  } catch { error.value = 'Não foi possível atualizar a senha. Solicite um novo link de recuperação.' }
  finally { busy.value = false; password.value = ''; confirm.value = '' }
}
</script>
<template><div class="container narrow-content"><p class="eyebrow">ACESSO SEGURO</p><h1>Escolha uma nova senha.</h1><p v-if="!ready" role="status">Conferindo seu link…</p><form v-else-if="auth.user.value" class="contact-form" @submit.prevent="submit"><div class="field"><label for="new-password">Nova senha</label><input id="new-password" v-model="password" type="password" autocomplete="new-password" minlength="12" maxlength="128" required :disabled="busy"></div><div class="field"><label for="confirm-password">Repita a nova senha</label><input id="confirm-password" v-model="confirm" type="password" autocomplete="new-password" minlength="12" maxlength="128" required :disabled="busy"></div><p v-if="error" role="alert" class="form-error">{{ error }}</p><button class="button button-primary" :disabled="busy">{{ busy ? 'Salvando…' : 'Salvar senha e voltar ao acesso' }}</button></form><div v-else><p>Abra o link recebido por e-mail neste navegador. Se ele expirou, solicite outro.</p><NuxtLink to="/login" class="button button-primary">Voltar ao acesso</NuxtLink></div></div></template>
