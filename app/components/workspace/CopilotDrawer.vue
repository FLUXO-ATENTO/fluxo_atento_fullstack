<script setup lang="ts">
const { copilotOpen } = useDashboardChrome()
const { dashboardPath } = useDeployment()
</script>
<template>
  <USlideover v-model:open="copilotOpen" title="Copiloto Fluxo Atento" description="Uma análise clara, com contexto e próximos passos." :ui="{ content: 'workspace-drawer' }">
    <template #body><div class="copilot-empty"><span class="feature-icon"><UIcon name="i-lucide-sparkles" /></span><span class="ui-status ui-status-pending">Em preparação</span><h2>O copiloto ainda não está conectado a este painel.</h2><p>Estamos preparando a autenticação por empresa, os limites de uso e as permissões do agente. Nenhuma mensagem sua será enviada enquanto essa conexão não estiver validada.</p><div class="note-box"><strong>O que ele poderá ajudar a entender</strong><ul><li>Quais campanhas merecem atenção.</li><li>Onde o funil perde conversões.</li><li>Qual próximo passo vale testar.</li></ul></div><NuxtLink class="button button-secondary" :to="dashboardPath('/dashboard/canais')" @click="copilotOpen = false">Ver minhas integrações <UIcon name="i-lucide-arrow-right" /></NuxtLink></div></template>
  </USlideover>
</template>
