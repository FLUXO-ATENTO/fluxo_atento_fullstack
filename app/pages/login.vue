<script setup lang="ts">
import { ArrowRight, ShieldCheck } from '@lucide/vue'
import { safeReturnPath } from '~/utils/auth-config'
useSeoMeta({ title: 'Entrar · Fluxo Atento', robots: 'noindex' })
const auth = useAuth()
const route = useRoute()
const mode = ref<'login' | 'signup' | 'recover'>('login')
const email = ref(''); const password = ref(''); const busy = ref(false)
const error = ref(''); const notice = ref('')
const heading = computed(() => mode.value === 'signup' ? 'Crie seu primeiro espaço.' : mode.value === 'recover' ? 'Vamos recuperar seu acesso.' : 'Bom ter você por aqui.')
function setMode(value: typeof mode.value) { mode.value = value; error.value = ''; notice.value = ''; password.value = '' }
async function submit() {
  const client = auth.client()
  if (!client || busy.value) return
  busy.value = true; error.value = ''; notice.value = ''
  try {
    if (mode.value === 'login') {
      const { error: failure } = await client.auth.signInWithPassword({ email: email.value.trim(), password: password.value })
      if (failure) throw new Error('Não foi possível entrar. Confira e-mail, senha e a confirmação do seu cadastro.')
      await navigateTo(safeReturnPath(route.query.next))
    } else if (mode.value === 'signup') {
      const { data, error: failure } = await client.auth.signUp({ email: email.value.trim(), password: password.value, options: { emailRedirectTo: window.location.origin + '/auth/callback' } })
      if (failure) throw new Error('Não foi possível criar o acesso agora. Confira os dados ou tente novamente mais tarde.')
      if (data.session) await navigateTo('/dashboard')
      else notice.value = 'Confira seu e-mail para continuar. Se você já tem uma conta, use Entrar ou Recuperar acesso.'
    } else {
      const { error: failure } = await client.auth.resetPasswordForEmail(email.value.trim(), { redirectTo: window.location.origin + '/recuperar-acesso' })
      if (failure) throw new Error('Não foi possível solicitar o e-mail agora. Tente novamente mais tarde.')
      notice.value = 'Se houver uma conta com esse e-mail, você receberá as instruções para recuperar o acesso.'
    }
  } catch (cause) { error.value = cause instanceof Error ? cause.message : 'Tente novamente em instantes.' }
  finally { busy.value = false; password.value = '' }
}
</script>
<template>
  <section class="container auth-layout">
    <div class="auth-intro"><p class="eyebrow">SEU ESPAÇO NO FLUXO ATENTO</p><h1>{{ heading }}</h1><p>Para quem cuida do próprio negócio e quer acompanhar as páginas que seus clientes acessam.</p><div class="auth-trust"><ShieldCheck :size="20" /><p>O exemplo e sua conta são separados. No seu painel, aparecem somente seus dados.</p></div><NuxtLink to="/exemplo" class="text-link">Prefere conhecer primeiro? Explore o exemplo →</NuxtLink></div>
    <div class="panel auth-card">
      <div class="filter-bar"><button :aria-pressed="mode === 'login'" :disabled="busy" @click="setMode('login')">Entrar</button><button :aria-pressed="mode === 'signup'" :disabled="busy" @click="setMode('signup')">Criar conta</button><button :aria-pressed="mode === 'recover'" :disabled="busy" @click="setMode('recover')">Recuperar acesso</button></div>
      <div v-if="!auth.configured" class="empty-state" role="status"><h2>Acesso em configuração</h2><p>Este ambiente ainda não foi conectado à autenticação. Você pode explorar o exemplo sem informar dados pessoais.</p><NuxtLink to="/exemplo" class="button button-primary">Abrir exemplo</NuxtLink></div>
      <form v-else class="auth-form" @submit.prevent="submit"><h2>{{ mode === 'recover' ? 'Qual é seu e-mail?' : mode === 'signup' ? 'Vamos começar pelo seu acesso.' : 'Acesse sua conta.' }}</h2><div class="field"><label for="auth-email">E-mail</label><input id="auth-email" v-model="email" type="email" autocomplete="email" required maxlength="254" :disabled="busy"></div><div v-if="mode !== 'recover'" class="field"><label for="auth-password">Senha</label><input id="auth-password" v-model="password" type="password" :autocomplete="mode === 'signup' ? 'new-password' : 'current-password'" :minlength="mode === 'signup' ? 12 : 1" maxlength="128" required :disabled="busy" :aria-describedby="mode === 'signup' ? 'password-hint' : undefined"><small v-if="mode === 'signup'" id="password-hint">Use pelo menos 12 caracteres e uma senha exclusiva.</small></div><p v-if="error" class="form-error" role="alert">{{ error }}</p><p v-if="notice" class="live-notice" role="status">{{ notice }}</p><button class="button button-primary button-full" type="submit" :disabled="busy">{{ busy ? 'Aguarde…' : mode === 'recover' ? 'Enviar instruções' : mode === 'signup' ? 'Criar acesso' : 'Entrar no painel' }}<ArrowRight :size="16" /></button><p class="auth-footnote">Produto em desenvolvimento. Criar acesso não contrata um plano pago nem ativa campanhas. Leia os <NuxtLink to="/terms">termos</NuxtLink> e a <NuxtLink to="/privacy">privacidade</NuxtLink>.</p></form>
    </div>
  </section>
</template>
