<script setup lang="ts">
import { ArrowRight, ShieldCheck } from '@lucide/vue'
import { safeReturnPath } from '~/utils/auth-config'
import { enabledSocialProviders, socialAuthOptions, type SocialProvider } from '~/utils/social-auth'
import { captchaIsEnabled, submitEmailAuth, type CaptchaProof } from '~/utils/auth-captcha'
useSeoMeta({ title: 'Entrar · Fluxo Atento', robots: 'noindex' })
const auth = useAuth()
const { enter } = useAuthNavigation()
const route = useRoute()
const { isDashboardApp, marketingUrl, dashboardPath } = useDeployment()
const mode = ref<'login' | 'signup' | 'recover'>('login')
const email = ref(''); const password = ref(''); const busy = ref(false)
const error = ref(''); const notice = ref('')
const fullName = ref('')
const showPassword = ref(false)
const enabledProviders = enabledSocialProviders(useRuntimeConfig().public.authProviders)
const googleEnabled = enabledProviders.includes('google')
const githubEnabled = enabledProviders.includes('github')
const captchaEnabled = captchaIsEnabled(useRuntimeConfig().public.turnstileEnabled)
const captchaSiteKey = String(useRuntimeConfig().public.turnstileSiteKey || '')
const captchaProof = ref<CaptchaProof | null>(null)
const captchaResetKey = ref(0)
function resetCaptcha() { captchaProof.value = null; captchaResetKey.value++ }
const socialBusy = ref<SocialProvider | null>(null)
async function signInWithProvider(provider: SocialProvider) {
  const client = auth.client()
  if (!client || busy.value || !enabledProviders.includes(provider)) return
  busy.value = true; socialBusy.value = provider; error.value = ''; notice.value = ''
  try {
    // Only a validated local destination is stored. Never tokens or provider data.
    try { sessionStorage.setItem('fluxo-auth-next', safeReturnPath(route.query.next, isDashboardApp.value)) } catch { /* Callback falls back to Home. */ }
    const { error: failure } = await client.auth.signInWithOAuth(socialAuthOptions(provider, window.location.origin))
    if (failure) throw new Error()
  } catch { error.value = 'Não foi possível iniciar este acesso. Tente novamente ou use seu e-mail e senha.' }
  finally { busy.value = false; socialBusy.value = null }
}
const heading = computed(() => mode.value === 'signup' ? 'Crie seu primeiro espaço.' : mode.value === 'recover' ? 'Vamos recuperar seu acesso.' : 'Bom ter você por aqui.')
function setMode(value: typeof mode.value) { mode.value = value; error.value = ''; notice.value = ''; password.value = ''; resetCaptcha() }
async function submit() {
  const client = auth.client()
  if (!client || busy.value) return
  busy.value = true; error.value = ''; notice.value = ''
  try {
    const { error: failure, session } = await submitEmailAuth(client.auth, {
      mode: mode.value, email: email.value, password: password.value,
      fullName: fullName.value, origin: window.location.origin
    }, captchaEnabled, captchaProof.value)
    if (failure?.code === 'captcha_failed') throw new Error('A verificação de segurança não foi aceita. Verifique novamente e tente continuar.')
    if (mode.value === 'login') {
      if (failure) throw new Error('Não foi possível entrar. Confira e-mail, senha e a confirmação do seu cadastro.')
      await enter(route.query.next)
    } else if (mode.value === 'signup') {
      if (failure) throw new Error('Não foi possível criar o acesso agora. Confira os dados ou tente novamente mais tarde.')
      if (session) await enter()
      else notice.value = 'Confira seu e-mail para continuar. Se você já tem uma conta, use Entrar ou Recuperar acesso.'
    } else {
      if (failure) throw new Error('Não foi possível solicitar o e-mail agora. Tente novamente mais tarde.')
      notice.value = 'Se houver uma conta com esse e-mail, você receberá as instruções para recuperar o acesso.'
    }
  } catch (cause) { error.value = cause instanceof Error ? cause.message : 'Tente novamente em instantes.' }
  finally { busy.value = false; password.value = ''; resetCaptcha() }
}
</script>
<template>
  <section class="container auth-layout">
    <div class="auth-intro"><p class="eyebrow">SEU ESPAÇO NO FLUXO ATENTO</p><h1>{{ heading }}</h1><p>Para quem cuida do próprio negócio e quer acompanhar as páginas que seus clientes acessam.</p><div class="auth-trust"><ShieldCheck :size="20" /><p>O exemplo e sua conta são separados. No seu painel, aparecem somente seus dados.</p></div><a :href="isDashboardApp ? marketingUrl + '/exemplo' : '/exemplo'" class="text-link">Prefere conhecer primeiro? Explore o exemplo →</a></div>
    <div class="panel auth-card">
      <section v-if="mode !== 'recover' && (googleEnabled || githubEnabled)" class="social-auth" aria-label="Acesso com uma conta existente">
        <div class="social-auth-buttons" :class="{ 'social-auth-buttons-single': !githubEnabled }"><GoogleAuthButton v-if="googleEnabled" :disabled="busy || !auth.configured" :loading="socialBusy === 'google'" aria-describedby="social-auth-note" @activate="signInWithProvider('google')" /><button v-if="githubEnabled" type="button" class="button button-secondary" :disabled="busy || !auth.configured" aria-describedby="social-auth-note" @click="signInWithProvider('github')">{{ socialBusy === 'github' ? 'Conectando…' : 'Continuar com GitHub' }}</button></div>
        <p id="social-auth-note" class="field-help">Use uma conta existente para entrar ou criar seu acesso. Isso não conecta anúncios, Analytics ou repositórios.</p>
        <p v-if="error && socialBusy" role="alert" class="form-error">{{ error }}</p><div class="auth-divider">ou continue com e-mail</div>
      </section>
      <div class="filter-bar"><button :aria-pressed="mode === 'login'" :disabled="busy" @click="setMode('login')">Entrar</button><button :aria-pressed="mode === 'signup'" :disabled="busy" @click="setMode('signup')">Criar conta</button><button :aria-pressed="mode === 'recover'" :disabled="busy" @click="setMode('recover')">Recuperar acesso</button></div>
      <div v-if="!auth.configured" class="empty-state" role="status"><h2>Acesso em configuração</h2><p>Este ambiente ainda não foi conectado à autenticação. Você pode explorar o exemplo sem informar dados pessoais.</p><a :href="isDashboardApp ? marketingUrl + '/exemplo' : '/exemplo'" class="button button-primary">Abrir exemplo</a></div>
      <form v-else class="auth-form" @submit.prevent="submit">
        <h2>{{ mode === 'recover' ? 'Qual é seu e-mail?' : mode === 'signup' ? 'Vamos começar pelo seu acesso.' : 'Faça seu login.' }}</h2>
        <p class="auth-form-intro">{{ mode === 'login' ? 'Entre com suas credenciais para acessar seu painel.' : mode === 'signup' ? 'Crie uma conta para começar. Você não contrata um plano nesta etapa.' : 'Enviaremos instruções para recuperar seu acesso.' }}</p>
        <div v-if="mode === 'signup'" class="field"><label for="auth-name">Como podemos chamar você?</label><input id="auth-name" v-model="fullName" autocomplete="name" required maxlength="120" :disabled="busy"></div>
        <div class="field"><label for="auth-email">E-mail</label><input id="auth-email" v-model="email" type="email" autocomplete="email" required maxlength="254" :disabled="busy"></div>
        <div v-if="mode !== 'recover'" class="field">
          <label for="auth-password">Senha</label>
          <input id="auth-password" v-model="password" :type="showPassword ? 'text' : 'password'" :autocomplete="mode === 'signup' ? 'new-password' : 'current-password'" :minlength="mode === 'signup' ? 12 : 1" maxlength="128" required :disabled="busy" :aria-describedby="mode === 'signup' ? 'password-hint' : undefined">
          <small v-if="mode === 'signup'" id="password-hint">Use pelo menos 12 caracteres e uma senha exclusiva.</small>
          <button type="button" class="password-visibility" :aria-pressed="showPassword" aria-controls="auth-password" @click="showPassword = !showPassword">{{ showPassword ? 'Ocultar senha' : 'Mostrar senha' }}</button>
        </div>
        <AuthTurnstile v-if="captchaEnabled" :site-key="captchaSiteKey" :action="mode" :reset-key="captchaResetKey" @verified="captchaProof = $event" @invalidate="captchaProof = null" />
        <p v-if="error" class="form-error" role="alert">{{ error }}</p>
        <p v-if="notice" class="live-notice" role="status">{{ notice }}</p>
        <button class="button button-primary button-full" type="submit" :disabled="busy || (captchaEnabled && !captchaProof)">{{ busy ? 'Aguarde…' : mode === 'recover' ? 'Enviar instruções' : mode === 'signup' ? 'Criar acesso' : 'Entrar no painel' }}<ArrowRight :size="16" /></button>
        <p class="auth-footnote">Produto em desenvolvimento. Criar acesso não contrata um plano pago nem ativa campanhas. Leia os <NuxtLink to="/terms">termos</NuxtLink> e a <NuxtLink to="/privacy">privacidade</NuxtLink>.</p>
      </form>
    </div>
  </section>
</template>
