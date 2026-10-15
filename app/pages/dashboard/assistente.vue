<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })
useSeoMeta({ title: 'Copiloto · Fluxo Atento', robots: 'noindex, nofollow' })
const { copilotOpen } = useDashboardChrome()
const { dashboardPath } = useDeployment()
</script>
<template>
  <div><header class="page-heading"><div><p class="eyebrow">SEU COPILOTO</p><h1>Seu contexto, no mesmo espaço.</h1><p>O acesso está confirmado. Conheça o que já está disponível e os próximos recursos.</p></div></header>
    <section class="panel admin-form"><span class="ui-status ui-status-pending">IA em preparação</span><h2>O atendimento inteligente ainda será conectado.</h2><p>Por enquanto, você pode acompanhar sites e consultar as orientações do painel. A análise de campanhas, o histórico de conversas e as ações do agente ainda não estão disponíveis.</p><div class="entry-actions"><button class="button button-primary" @click="copilotOpen = true">Ver estado do copiloto <UIcon name="i-lucide-sparkles" /></button><NuxtLink :to="dashboardPath('/dashboard/ajuda')" class="button button-secondary">Abrir central de ajuda</NuxtLink></div></section>
  </div>
</template>
