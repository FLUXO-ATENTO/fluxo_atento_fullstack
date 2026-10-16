<script setup lang="ts">
import { motion, AnimatePresence } from 'motion-v'
import { useIntervalFn, usePreferredReducedMotion, useDocumentVisibility, useIntersectionObserver } from '@vueuse/core'
import { ArrowRight, Check, Code2, Globe2, ScanLine, Pause, Play, ArrowUpRight, CircleAlert } from '@lucide/vue'
import { scenarios, observationSteps, type ScenarioId } from '~/data/experience'
defineProps<{ compact?: boolean }>()
const storyRoot = ref<HTMLElement | null>(null)
const scenarioId = ref<ScenarioId>('errors')
const step = ref(0)
const playing = ref(false)
const pendingStart = ref(false)
const storyVisible = ref(true)
const reduced = usePreferredReducedMotion()
const visibility = useDocumentVisibility()
const scenario = computed(() => scenarios.find(item => item.id === scenarioId.value)!)
const stage = computed(() => {
  if (step.value === 0) return { label: 'Sinal observado', title: scenario.value.signal, body: scenario.value.evidence, footer: 'O sinal inicia o fluxo' }
  if (step.value === 1) return { label: 'Contexto', title: scenario.value.insight, body: scenario.value.limit, footer: 'Evidência antes da conclusão' }
  return { label: 'Próxima ação', title: scenario.value.action, body: scenario.value.detail, footer: 'Revisão humana antes de qualquer mudança' }
})
const { pause, resume } = useIntervalFn(() => {
  if (step.value === 2) { playing.value = false; return }
  step.value += 1
}, 3000, { immediate: false })
useIntersectionObserver(storyRoot, ([entry]) => {
  storyVisible.value = entry?.isIntersecting ?? true
}, { threshold: 0.2 })
watch([playing, visibility, reduced, storyVisible], () => {
  const canPlay = visibility.value === 'visible' && reduced.value !== 'reduce' && storyVisible.value
  if (pendingStart.value && canPlay) {
    pendingStart.value = false
    playing.value = true
    resume()
    return
  }
  if (!canPlay) playing.value = false
  if (playing.value && canPlay) resume()
  else pause()
})
function chooseStep(index: number) { pendingStart.value = false; playing.value = false; step.value = index }
function chooseScenario(id: ScenarioId) { scenarioId.value = id; pendingStart.value = false; playing.value = false; step.value = 0 }
function togglePlay() {
  pendingStart.value = false
  if (reduced.value === 'reduce') { step.value = (step.value + 1) % 3; return }
  if (!playing.value && step.value === 2) step.value = 0
  playing.value = !playing.value
}
function startFlow() {
  playing.value = false
  pause()
  step.value = 0
  storyRoot.value?.focus({ preventScroll: true })
  storyRoot.value?.scrollIntoView({ behavior: reduced.value === 'reduce' ? 'auto' : 'smooth', block: 'center' })
  if (reduced.value !== 'reduce') {
    pendingStart.value = true
    playing.value = true
  }
}
defineExpose({ startFlow })
</script>
<template>
  <section ref="storyRoot" class="experience-story" :class="{ compact }" tabindex="-1" aria-label="Demonstração: do sinal à ação">
    <span class="sr-only" aria-live="polite">{{ scenario.label }}. {{ stage.label }}.</span>
    <div class="story-toolbar">
      <span class="mono story-label"><span class="status-dot" /> LABORATÓRIO FLUXO</span>
      <div class="scenario-options" role="group" aria-label="Escolha um exemplo">
        <button v-for="item in scenarios" :key="item.id" :aria-pressed="scenarioId === item.id" @click="chooseScenario(item.id)">{{ item.label }}</button>
      </div>
      <span class="demo-badge">Dados ilustrativos</span>
    </div>
    <div class="story-scene" :data-step="step">
      <div class="scene-grid" aria-hidden="true" />
      <motion.article
        class="browser-card story-node"
        :class="{ highlighted: step === 0 }"
        :animate="reduced === 'reduce' ? { opacity: 1, scale: 1, x: 0 } : { opacity: step === 0 ? 1 : 0.74, scale: step === 0 ? 1 : 0.985, x: step === 0 ? 0 : -3 }"
        :transition="{ type: 'spring', stiffness: 280, damping: 30 }"
      >
        <div class="browser-chrome"><span class="window-dots" aria-hidden="true"><i /><i /><i /></span><Globe2 :size="13" /><span class="mono">{{ scenario.source }}</span></div>
        <div class="browser-body">
          <div class="fake-store"><span class="mini-wordmark">studio.</span><span class="mono">{{ scenario.surface }} <ArrowUpRight :size="10" /></span></div>
          <div v-if="scenario.id === 'tracking'" class="fake-product"><div class="product-art"><span /><span /><span /></div><div><span class="skeleton wide" /><span class="skeleton" /><span class="skeleton short" /></div></div>
          <div v-else-if="scenario.id === 'errors'" class="fake-form" aria-hidden="true"><span class="fake-field" /><span class="fake-field short" /><span class="fake-submit">ENVIAR</span></div>
          <div v-else class="fake-offer" aria-hidden="true"><small>OFERTA</small><strong>{{ scenario.after }}</strong><span class="skeleton wide" /><span class="skeleton" /></div>
          <div class="code-observation"><Code2 :size="14" /><span>{{ scenario.metric }}</span><span class="small-dot" /></div>
          <div class="observation-status"><CircleAlert :size="15" /><span>{{ scenario.after }}</span></div>
        </div>
        <div class="node-caption"><span class="mono">01</span> O sinal aparece</div>
      </motion.article>
      <div class="flow-connector" :class="{ energized: step >= 1 }" aria-hidden="true"><span /><ArrowRight :size="14" /></div>
      <motion.div
        class="engine-node"
        :class="{ highlighted: step === 1 }"
        :animate="reduced === 'reduce' ? { opacity: 1, scale: 1 } : { opacity: step >= 1 ? 1 : 0.62, scale: step === 1 ? 1.045 : 1 }"
        :transition="{ type: 'spring', stiffness: 300, damping: 26 }"
      >
        <div class="engine-orbit" aria-hidden="true"><span /><span /><span /></div>
        <div class="engine-icon"><BrandLogo compact /></div>
        <span class="mono">FLUXO ATENTO</span><span class="engine-subtitle">Sinal → contexto</span>
      </motion.div>
      <div class="flow-connector" :class="{ energized: step === 2 }" aria-hidden="true"><span /><ArrowRight :size="14" /></div>
      <motion.article
        class="insight-card story-node"
        :class="{ highlighted: step >= 1 }"
        :animate="reduced === 'reduce' ? { opacity: 1, scale: 1, x: 0 } : { opacity: step >= 1 ? 1 : 0.72, scale: step >= 1 ? 1 : 0.985, x: step >= 1 ? 0 : 3 }"
        :transition="{ type: 'spring', stiffness: 280, damping: 30 }"
      >
        <div class="insight-header"><span class="insight-symbol"><ScanLine :size="17" /></span><span>{{ stage.label }}</span><span class="mono">DEMO</span></div>
        <AnimatePresence mode="wait">
          <motion.div :key="`${scenario.id}-${step}`" :initial="reduced === 'reduce' ? false : { opacity: 0, y: 6 }" :animate="{ opacity: 1, y: 0 }" :exit="reduced === 'reduce' ? undefined : { opacity: 0 }" :transition="{ duration: reduced === 'reduce' ? 0 : 0.2 }" class="insight-body">
            <h3>{{ stage.title }}</h3>
            <div v-if="step === 1" class="story-comparison"><span>Antes<strong>{{ scenario.before }}</strong></span><ArrowRight :size="14" aria-hidden="true" /><span>Agora<strong>{{ scenario.after }}</strong></span></div>
            <p>{{ stage.body }}</p>
            <NuxtLink v-if="step === 2" :to="{ path: '/exemplo', query: { scenario: scenario.id } }" class="insight-action">Ver este exemplo no painel <ArrowUpRight :size="15" /></NuxtLink>
          </motion.div>
        </AnimatePresence>
        <div class="node-caption"><Check :size="13" /> {{ stage.footer }}</div>
      </motion.article>
    </div>
    <div class="story-bottom">
      <div class="story-steps" role="group" aria-label="Etapas da explicação">
        <button v-for="(item, index) in observationSteps" :key="item.label" :aria-pressed="step === index" @click="chooseStep(index)">
          <span class="step-number mono">0{{ index + 1 }}</span><span><strong>{{ item.label }}</strong><small>{{ item.description }}</small></span>
          <motion.span v-if="step === index" layout-id="story-active-step" class="step-indicator" />
        </button>
      </div>
      <button class="icon-button playback" :aria-label="reduced === 'reduce' ? 'Próxima etapa' : playing ? 'Pausar animação' : 'Reproduzir animação'" @click="togglePlay"><Pause v-if="playing" :size="16" /><Play v-else :size="16" /></button>
    </div>
    <p class="story-caption">{{ step === 0 ? 'Situação ilustrativa. Nenhum site está sendo consultado.' : step === 1 ? scenario.limit : 'A próxima ação é uma sugestão de revisão; nenhuma mudança é executada.' }}</p>
  </section>
</template>
