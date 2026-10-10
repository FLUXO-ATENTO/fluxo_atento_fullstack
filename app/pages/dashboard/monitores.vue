<script setup lang="ts">
import { Globe2 } from '@lucide/vue'
definePageMeta({ layout: 'dashboard' })
useSeoMeta({ title: 'Monitores · Fluxo Atento', robots: 'noindex' })
const { monitors, toggleMonitor } = useDemoWorkspace()
</script>
<template><div><div class="page-heading"><div><p class="eyebrow">SEU RADAR</p><h1>Uma página de cada vez.</h1><p>Organize os endereços que fazem parte do seu negócio. Este ambiente não executa verificações.</p></div><AddMonitor /></div><section class="panel"><div class="panel-heading"><h2>Endereços da demonstração</h2><span class="demo-badge">{{ monitors.length }} endereços</span></div><div v-for="item in monitors" :key="item.id" class="monitor-row"><Globe2 :size="20" /><div><strong>{{ item.name }}</strong><small>{{ item.url }}</small></div><span class="status-pill" :class="{ resolved: item.enabled }">{{ item.enabled ? 'Habilitado na demo' : 'Pausado' }}</span><USwitch :model-value="item.enabled" :aria-label="(item.enabled ? 'Pausar' : 'Ativar') + ' monitor ' + item.name" @update:model-value="toggleMonitor(item.id)" /></div></section></div></template>
