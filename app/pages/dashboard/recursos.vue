<script setup lang="ts">
import { roadmap } from '~/data/workspace-navigation'
definePageMeta({ layout: 'dashboard' })
useSeoMeta({ title: 'Mapa de recursos · Fluxo Atento', robots: 'noindex, nofollow' })
const route = useRoute()
const { dashboardPath } = useDeployment()
const selected = computed(() => roadmap.find(item => item.id === route.query.grupo))
const visible = computed(() => selected.value ? [selected.value] : roadmap)
</script>
<template>
  <div><header class="page-heading"><div><p class="eyebrow">EVOLUÇÃO DO PRODUTO</p><h1>{{ selected?.title || 'Uma plataforma. Caminhos claros.' }}</h1><p>Recursos planejados, com prioridade em anúncios, páginas e funil. Esta página não ativa serviços.</p></div><NuxtLink v-if="selected" :to="dashboardPath('/dashboard/recursos')" class="button button-secondary">Ver todos os recursos</NuxtLink></header>
    <div class="note-box"><strong>Já disponível: monitoramento básico de páginas.</strong><p>Você pode cadastrar páginas e executar verificações. Os recursos abaixo ainda precisam de implementação e validação.</p><NuxtLink :to="dashboardPath('/dashboard/monitores')" class="text-link">Abrir monitoramento <UIcon name="i-lucide-arrow-right" /></NuxtLink></div>
    <div class="roadmap-grid"><section v-for="group in visible" :key="group.id" class="panel admin-form"><span class="ui-status ui-status-pending">{{ group.priority }}</span><h2>{{ group.title }}</h2><p>{{ group.description }}</p><ul class="roadmap-list"><li v-for="item in group.items" :key="item"><UIcon name="i-lucide-circle-dashed" aria-hidden="true" />{{ item }}<span class="sr-only"> — Em preparação</span></li></ul></section></div>
  </div>
</template>
