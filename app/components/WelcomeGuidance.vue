<script setup lang="ts">
import { growthSteps } from '~/utils/workspace-ui'
const { dashboardPath } = useDeployment()
</script>
<template>
  <section class="onboarding-panel panel" aria-labelledby="first-steps-title">
    <div class="section-topline"><div><p class="eyebrow">DO TRÁFEGO À CONVERSÃO</p><h2 id="first-steps-title">Primeiros passos</h2><p>Prepare os dados que vão orientar suas próximas decisões.</p></div><span class="ui-status">0 de 4 concluídos</span></div>
    <progress class="onboarding-progress" :value="0" :max="4" aria-label="Etapas confirmadas da integração de anúncios">0 de 4</progress>
    <ol class="onboarding-steps"><li v-for="(step, index) in growthSteps" :key="step.id"><span class="step-index">{{ index + 1 }}</span><div><h3>{{ step.title }}</h3><p>{{ step.description }}</p><NuxtLink :to="dashboardPath(step.path)" class="text-link">{{ step.action }} <UIcon name="i-lucide-arrow-right" /></NuxtLink></div></li></ol>
    <p class="field-help">As integrações de anúncios ainda estão em desenvolvimento. Visitar uma página não marca uma etapa como concluída.</p>
  </section>
</template>
