<script setup lang="ts">
import { Construction, ArrowRight, Check, Circle } from '@lucide/vue'
defineProps<{ title: string; description: string; nextSteps?: string[] }>()
</script>
<template>
  <section class="initial-state">
    <span class="initial-state-icon"><Construction :size="28" /></span><span class="badge-initial">MODO INICIAL</span><h2>{{ title }}</h2><p>{{ description }}</p>
    <ul v-if="nextSteps?.length"><li><Check :size="15" /> Estrutura e navegação disponíveis</li><li v-for="item in nextSteps" :key="item"><Circle :size="12" /> {{ item }}</li></ul>
    <NuxtLink to="/ajuda" class="button button-secondary">Entenda o estado do produto <ArrowRight :size="15" /></NuxtLink>
  </section>
</template>
