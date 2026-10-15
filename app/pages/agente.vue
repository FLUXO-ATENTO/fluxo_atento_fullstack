<script setup lang="ts">
useSeoMeta({ title: 'Seu copiloto · Fluxo Atento', description: 'Conheça o próximo passo para acompanhar sites, campanhas e funil no Fluxo Atento.' })
const { dashboardEntryUrl } = useDeployment()
</script>
<template>
  <div class="container narrow-content agent-introduction">
    <p class="eyebrow">COPILOTO FLUXO ATENTO</p><h1>Qual é o próximo passo do seu negócio?</h1>
    <p>Um espaço para reunir o contexto do seu site, das campanhas e do funil. Você usa a mesma conta do painel para continuar.</p>
    <div class="note-box"><span class="ui-status ui-status-pending">Atendimento com IA em preparação</span><p>A página do copiloto já tem um caminho de acesso. O chat com o agente, a análise de campanhas e a memória entre conversas ainda não estão conectados. Nenhuma consulta à IA é feita aqui.</p></div>
    <div class="entry-actions"><a :href="dashboardEntryUrl('/assistente', 'agente')" class="button button-primary">Entrar no meu espaço <UIcon name="i-lucide-arrow-right" /></a><NuxtLink to="/docs" class="button button-secondary">Entender como funciona</NuxtLink></div>
    <p class="field-help">Não precisa criar outra conta. O acesso ao painel é conferido no mesmo autenticador; Meta e Google são conexões separadas, feitas com sua autorização.</p>
  </div>
</template>
