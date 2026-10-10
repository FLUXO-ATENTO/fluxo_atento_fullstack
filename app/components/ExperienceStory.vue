<script setup lang="ts">
import { motion, AnimatePresence } from 'motion-v'
import { useIntervalFn, usePreferredReducedMotion, useDocumentVisibility } from '@vueuse/core'
import { ArrowRight, Check, Code2, Globe2, ScanLine, Pause, Play, ArrowUpRight, CircleAlert } from '@lucide/vue'
import { scenarios, observationSteps, type ScenarioId } from '~/data/experience'
defineProps<{ compact?: boolean }>()
const scenarioId = ref<ScenarioId>('tracking')
const step = ref(0)
const playing = ref(false)
const reduced = usePreferredReducedMotion()
const visibility = useDocumentVisibility()
const scenario = computed(() => scenarios.find(item => item.id === scenarioId.value)!)
const { pause, resume } = useIntervalFn(() => {
  if (step.value === 2) { playing.value = false; return }
  step.value += 1
}, 3000, { immediate: false })
watch([playing, visibility, reduced], () => {
  if (playing.value && visibility.value === 'visible' && reduced.value !== 'reduce') resume()
  else pause()
})
onMounted(() => { if (reduced.value !== 'reduce') playing.value = true })
function chooseStep(index: number) { playing.value = false; step.value = index }
function chooseScenario(id: ScenarioId) { scenarioId.value = id; playing.value = false; step.value = 0 }
function togglePlay() {
  if (reduced.value === 'reduce') { step.value = (step.value + 1) % 3; return }
  if (!playing.value && step.value === 2) step.value = 0
  playing.value = !playing.value
}
</script>
<template>
  <section class="experience-story" :class="{ compact }" aria-label="Demonstração: do sinal à ação">
    <div class="story-toolbar">
      <span class="mono story-label"><span class="status-dot" /> LABORATÓRIO FLUXO</span>
      <div class="scenario-options" aria-label="Escolha um exemplo">
        <button v-for="item in scenarios" :key="item.id" :aria-pressed="scenarioId === item.id" @click="chooseScenario(item.id)">{{ item.label }}</button>
      </div>
      <span class="demo-badge">Dados ilustrativos</span>
    </div>
    <div class="story-scene" :data-step="step">
      <div class="scene-grid" aria-hidden="true" />
      <article class="browser-card story-node" :class="{ highlighted: step === 0 }">
        <div class="browser-chrome"><span class="window-dots" aria-hidden="true"><i /><i /><i /></span><Globe2 :size="13" /><span class="mono">loja.exemplo.com</span></div>
        <div class="browser-body">
          <div class="fake-store"><span class="mini-wordmark">studio.</span><span class="mono">CHECKOUT <ArrowUpRight :size="10" /></span></div>
          <div class="fake-product"><div class="product-art"><span /><span /><span /></div><div><span class="skeleton wide" /><span class="skeleton" /><span class="skeleton short" /></div></div>
          <div class="code-observation"><Code2 :size="14" /><span>{{ scenario.metric }}</span><span class="small-dot" /></div>
          <div class="observation-status"><CircleAlert :size="15" /><span>{{ scenario.after }}</span></div>
        </div>
        <div class="node-caption"><span class="mono">01</span> O sinal aparece</div>
      </article>
      <div class="flow-connector" :class="{ energized: step >= 1 }" aria-hidden="true"><span /><ArrowRight :size="14" /></div>
      <div class="engine-node" :class="{ highlighted: step === 1 }">
        <div class="engine-orbit" aria-hidden="true"><span /><span /><span /></div>
        <div class="engine-icon"><BrandLogo compact /></div>
        <span class="mono">FLUXO ENGINE</span><span class="engine-subtitle">Sinal → contexto</span>
      </div>
      <div class="flow-connector" :class="{ energized: step === 2 }" aria-hidden="true"><span /><ArrowRight :size="14" /></div>
      <article class="insight-card story-node" :class="{ highlighted: step === 2 }">
        <div class="insight-header"><span class="insight-symbol"><ScanLine :size="17" /></span><span>Um ponto de atenção</span><span class="mono">DEMO</span></div>
        <AnimatePresence mode="wait">
          <motion.div :key="scenario.id" :initial="{ opacity: 0, y: 6 }" :animate="{ opacity: 1, y: 0 }" :exit="{ opacity: 0 }" :transition="{ duration: 0.2 }" class="insight-body">
            <h3>{{ scenario.signal }}</h3><p>{{ scenario.insight }}</p>
            <NuxtLink :to="{ path: '/dashboard', query: { scenario: scenario.id } }" class="insight-action">Ver a próxima ação <ArrowUpRight :size="15" /></NuxtLink>
          </motion.div>
        </AnimatePresence>
        <div class="node-caption"><Check :size="13" /> Evidência antes da conclusão</div>
      </article>
    </div>
    <div class="story-bottom">
      <div class="story-steps" aria-label="Etapas da explicação">
        <button v-for="(item, index) in observationSteps" :key="item.label" :aria-pressed="step === index" @click="chooseStep(index)">
          <span class="step-number mono">0{{ index + 1 }}</span><span><strong>{{ item.label }}</strong><small>{{ item.description }}</small></span>
          <motion.span v-if="step === index" layout-id="story-active-step" class="step-indicator" />
        </button>
      </div>
      <button class="icon-button playback" :aria-label="reduced === 'reduce' ? 'Próxima etapa' : playing ? 'Pausar animação' : 'Reproduzir animação'" @click="togglePlay"><Pause v-if="playing" :size="16" /><Play v-else :size="16" /></button>
    </div>
    <p class="story-caption">{{ step === 0 ? scenario.evidence : step === 1 ? scenario.insight : scenario.detail }}</p>
  </section>
</template>
