<script setup lang="ts">
import { entryDestination, entrySource } from '~/utils/entry-flow'
useSeoMeta({ title: 'A caminho do seu painel · Fluxo Atento', robots: 'noindex, nofollow' })
const route = useRoute()
const auth = useAuth()
const { enter } = useAuthNavigation()
const { isDashboardApp, marketingUrl, dashboardEntryUrl } = useDeployment()
const destination = computed(() => entryDestination(route.query.next, true))
const seconds = ref(5); const paused = ref(false); const busy = ref(false); const interactive = ref(false); const error = ref('')
let timer: ReturnType<typeof setInterval> | undefined
let disposed = false
async function proceed() {
  if (busy.value) return
  clearInterval(timer); busy.value = true; error.value = ''
  try {
    if (!isDashboardApp.value) { await navigateTo(dashboardEntryUrl(destination.value, entrySource(route.query.origem)), { external: true, replace: true }); return }
    await auth.waitUntilReady()
    if (disposed) return
    if (auth.user.value) await enter(destination.value)
    else await navigateTo({ path: '/login', query: { next: destination.value } }, { replace: true })
  } catch { if (!disposed) { error.value = 'Não foi possível abrir seu painel. Tente novamente quando sua conexão estiver disponível.'; busy.value = false; paused.value = true } }
}
onMounted(() => {
  interactive.value = true
  // The app origin owns authentication. Other public hosts forward here, not their own login.
  if (!isDashboardApp.value) { void proceed(); return }
  timer = setInterval(() => {
    if (paused.value || document.visibilityState !== 'visible') return
    seconds.value = Math.max(0, seconds.value - 1)
    if (!seconds.value) void proceed()
  }, 1000)
})
onBeforeUnmount(() => { disposed = true; clearInterval(timer) })
</script>
<template>
  <section class="entry-shell container" aria-labelledby="entry-title">
    <div class="entry-card panel">
      <a :href="marketingUrl" aria-label="Fluxo Atento — voltar ao site"><BrandLogo /></a>
      <p class="eyebrow">SEU PRÓXIMO PASSO</p>
      <h1 id="entry-title">A caminho do seu painel.</h1>
      <p>Um só acesso para continuar com o Fluxo Atento.</p>
      <ol class="entry-steps"><li><span>1</span><div><strong>Entre ou crie sua conta</strong><p>Se você já estiver conectado neste navegador, seguimos direto.</p></div></li><li><span>2</span><div><strong>Abra seu espaço</strong><p>O sistema confere sua empresa e o que sua conta pode acessar.</p></div></li><li><span>3</span><div><strong>Continue do próximo passo</strong><p>Organize seu trabalho com as funções disponíveis no painel.</p></div></li></ol>
      <progress class="entry-progress" :value="5 - seconds" max="5" aria-label="Preparando redirecionamento" />
      <p class="entry-countdown" aria-live="off">{{ busy ? 'Conferindo seu acesso…' : paused ? 'Sem pressa. Continue quando estiver pronto.' : `Continuamos em ${seconds} segundos.` }}</p>
      <p v-if="error" class="form-error" role="alert">{{ error }}</p>
      <div class="entry-actions"><button class="button button-primary" :disabled="busy || !interactive" @click="proceed">{{ busy ? 'Abrindo…' : 'Continuar agora' }}<UIcon name="i-lucide-arrow-right" /></button><button v-if="!paused" class="button button-secondary" :disabled="busy || !interactive" @click="paused = true">Preciso de mais tempo</button></div>
      <a :href="marketingUrl" class="text-link entry-back">Voltar ao site</a>
      <p class="field-help">Entrar não autoriza cobranças nem conecta contas de anúncios.</p>
    </div>
  </section>
</template>
