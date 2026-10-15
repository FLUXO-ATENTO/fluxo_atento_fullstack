<script setup lang="ts">
import { CAPTCHA_MAX_AGE_MS, captchaProofIsFresh, type CaptchaProof, type EmailAuthMode } from '~/utils/auth-captcha'
import { loadTurnstile, type TurnstileApi } from '~/utils/turnstile-client'

const props = defineProps<{ siteKey: string; action: EmailAuthMode; resetKey: number }>()
const emit = defineEmits<{ verified: [proof: CaptchaProof]; invalidate: [] }>()
const { effectiveTheme } = useInterfacePreferences()
const container = ref<HTMLElement | null>(null)
const status = ref<'loading' | 'ready' | 'verified' | 'error' | 'expired'>('loading')
let api: TurnstileApi | undefined
let widgetId: string | undefined
let generation = 0
let mounted = false
let expiry: ReturnType<typeof setTimeout> | undefined

function clearWidget() {
  clearTimeout(expiry)
  emit('invalidate')
  if (api && widgetId !== undefined) {
    try { api.remove(widgetId) } catch { /* A removed frame must never retain its proof. */ }
  }
  widgetId = undefined
}

async function renderWidget() {
  const current = ++generation
  clearWidget()
  status.value = 'loading'
  if (!props.siteKey) { status.value = 'error'; return }
  const active = () => mounted && current === generation
  const invalidate = (next: 'error' | 'expired') => {
    if (!active()) return
    clearTimeout(expiry); emit('invalidate'); status.value = next
  }
  try {
    api = await loadTurnstile()
    if (!active() || !container.value) return
    status.value = 'ready'
    widgetId = api.render(container.value, {
      sitekey: props.siteKey, action: props.action, theme: effectiveTheme.value,
      language: 'pt-br', size: 'flexible', 'response-field': false,
      retry: 'never', 'refresh-expired': 'manual', 'refresh-timeout': 'manual',
      callback(token) {
        if (!active()) return
        const proof = { token, issuedAt: Date.now() }
        if (!captchaProofIsFresh(proof)) { invalidate('error'); return }
        clearTimeout(expiry)
        status.value = 'verified'; emit('verified', proof)
        expiry = setTimeout(() => invalidate('expired'), CAPTCHA_MAX_AGE_MS)
      },
      'error-callback': () => { invalidate('error'); return true },
      'expired-callback': () => invalidate('expired'),
      'timeout-callback': () => invalidate('expired'),
      'unsupported-callback': () => invalidate('error')
    })
  } catch { invalidate('error') }
}

onMounted(() => { mounted = true; void renderWidget() })
watch(() => [props.siteKey, props.action, props.resetKey, effectiveTheme.value], () => {
  if (mounted) void renderWidget()
})
onBeforeUnmount(() => { mounted = false; generation++; clearWidget() })
</script>

<template>
  <section class="auth-captcha" aria-label="Verificação de segurança">
    <p class="field-help">Uma verificação rápida ajuda a proteger seu acesso contra tentativas automatizadas.</p>
    <div ref="container" class="auth-captcha-widget" />
    <p class="field-help" role="status" aria-live="polite">
      {{ status === 'loading' ? 'Carregando a verificação…' : status === 'verified' ? 'Verificação concluída. Você pode continuar.' : status === 'error' ? 'Não foi possível carregar a verificação. Confira sua conexão e tente novamente.' : status === 'expired' ? 'A verificação expirou. Verifique novamente para continuar.' : 'Aguarde a verificação ou siga a orientação abaixo.' }}
    </p>
    <button v-if="status === 'error' || status === 'expired'" type="button" class="button button-secondary" @click="renderWidget">Verificar novamente</button>
  </section>
</template>

<style scoped>
.auth-captcha { display: grid; gap: .6rem; min-width: 0; }
.auth-captcha-widget { width: 100%; min-height: 65px; }
.auth-captcha .field-help { margin: 0; }
.auth-captcha button { justify-self: start; }
</style>
