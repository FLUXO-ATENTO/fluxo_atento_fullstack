<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })
useSeoMeta({ title: 'Meu perfil · Fluxo Atento', robots: 'noindex, nofollow' })
const auth = useAuth()
const { tourOpen } = useDashboardChrome()
const { activeTenant } = useWorkspace()
const name = ref(''); const phone = ref(''); const saving = ref(false)
const error = ref(''); const notice = ref('')
watch(() => auth.user.value?.id, () => { name.value = auth.user.value?.displayName || ''; phone.value = auth.user.value?.contactPhone || '' }, { immediate: true })
async function save() {
  if (saving.value) return
  error.value = ''; notice.value = ''
  if (!name.value.trim()) { error.value = 'Informe como você deseja ser chamado.'; return }
  saving.value = true
  try { await auth.updateProfile({ full_name: name.value.trim(), contact_phone: phone.value.trim() }); notice.value = 'Perfil salvo na sua conta.' }
  catch { error.value = 'Não conseguimos salvar seu perfil. Tente novamente.' }
  finally { saving.value = false }
}
</script>
<template>
  <div><header class="page-heading"><div><p class="eyebrow">CONTA E PREFERÊNCIAS</p><h1>Um painel com a sua cara.</h1><p>Estas informações são do seu perfil. Elas não alteram suas permissões na empresa.</p></div></header>
    <div class="profile-columns"><form class="panel admin-form" @submit.prevent="save"><h2>Meu perfil</h2><p>Seu nome será usado para personalizar as boas-vindas.</p><div class="field"><label for="profile-name">Nome</label><input id="profile-name" v-model="name" autocomplete="name" required maxlength="120" :disabled="saving"></div><div class="field"><label for="profile-email">E-mail de acesso</label><input id="profile-email" :value="auth.user.value?.email" type="email" readonly aria-describedby="email-hint"><small id="email-hint">A troca de e-mail exige um fluxo próprio de verificação.</small></div><div class="field"><label for="profile-phone">Telefone de contato <span class="optional-label">(opcional)</span></label><input id="profile-phone" v-model="phone" autocomplete="tel" type="tel" maxlength="40" :disabled="saving" aria-describedby="phone-hint"><small id="phone-hint">Informação de contato; não é um número de autenticação verificado.</small></div><p v-if="error" role="alert" class="form-error">{{ error }}</p><p v-if="notice" role="status" class="live-notice">{{ notice }}</p><button class="button button-primary" :disabled="saving">{{ saving ? 'Salvando…' : 'Salvar perfil' }}</button></form>
    <section class="panel admin-form"><h2>Preferências de interface</h2><p>Escolha o tema mais confortável para você.</p><InterfaceTheme /><InterfacePalette /><div class="settings-line"><span>Idioma</span><strong>Português (Brasil)</strong></div><p class="field-help">Traduções para inglês, espanhol e italiano serão adicionadas após revisão completa da interface.</p><div class="settings-line"><span>Empresa atual</span><strong>{{ activeTenant?.name }}</strong></div><button class="button button-secondary" @click="tourOpen = true">Rever guia inicial</button><div class="note-box"><strong>Segurança da conta</strong><p>Para trocar a senha, utilize a opção de recuperação na entrada do sistema. Não informe sua senha em chats de suporte.</p><NuxtLink to="/login" class="text-link">Ir para a entrada do sistema <UIcon name="i-lucide-arrow-right" /></NuxtLink></div></section></div>
  </div>
</template>
