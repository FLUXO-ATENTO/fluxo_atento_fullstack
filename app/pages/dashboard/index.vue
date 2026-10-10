<script setup lang="ts">
import { dashboardMock } from '~/data/dashboard'

definePageMeta({ layout: 'dashboard' })
useSeoMeta({
  title: 'Visão geral · Fluxo Atento',
  description: 'Visão demonstrativa local da conta Fluxo Atento.'
})
</script>

<template>
  <section class="platform-dashboard-page">
    <div class="platform-page-heading platform-page-heading-compact">
      <div>
        <p class="eyebrow"><span class="eyebrow-line" /> VISÃO GERAL</p>
        <h1>Olá, <span>bem-vindo.</span></h1>
        <p>Um resumo da conta será apresentado quando os dados de produto e conta estiverem definidos.</p>
      </div>
      <NuxtLink class="button button-primary" to="/dashboard/modulos">Explorar módulos <span aria-hidden="true">→</span></NuxtLink>
    </div>

    <div class="platform-indicator-grid">
      <article v-for="indicator in dashboardMock.indicators" :key="indicator.id" class="platform-indicator-card">
        <span>{{ indicator.label }}</span>
        <strong>{{ indicator.value }}</strong>
        <small>Mock · sem dados de conta</small>
      </article>
      <article class="platform-indicator-card">
        <span>Status do plano</span>
        <strong>{{ dashboardMock.planStatus }}</strong>
        <small>Plano ainda não definido</small>
      </article>
    </div>

    <div class="platform-dashboard-grid">
      <section class="platform-panel">
        <div class="platform-panel-heading">
          <div><h2>Módulos contratados</h2><p>Exibição condicionada a dados reais de conta.</p></div>
          <NuxtLink to="/dashboard/modulos">Catálogo <span aria-hidden="true">→</span></NuxtLink>
        </div>
        <FeedbackState
          v-if="dashboardMock.contractedModules.length === 0"
          kind="empty"
          title="Nenhum módulo informado"
          description="O status de contratação é A DEFINIR. Esta demonstração não representa uma conta real."
        />
      </section>

      <section class="platform-panel">
        <div class="platform-panel-heading">
          <div><h2>Alertas e pendências</h2><p>Sem conexão a fontes de atividade.</p></div>
        </div>
        <FeedbackState
          v-if="dashboardMock.alerts.length === 0"
          kind="empty"
          title="Nenhum alerta demonstrativo"
          description="Alertas reais dependem de produto e integrações ainda não configurados."
        />
      </section>
    </div>

    <section class="platform-panel platform-activity-panel">
      <div class="platform-panel-heading">
        <div><h2>Atividades recentes</h2><p>Não há histórico conectado a esta interface.</p></div>
      </div>
      <FeedbackState
        v-if="dashboardMock.recentActivities.length === 0"
        kind="empty"
        title="Ainda sem atividades"
        description="Eventos e métricas reais não são gerados por esta demonstração."
      />
    </section>

    <details class="platform-state-examples">
      <summary>Prévia dos estados da interface</summary>
      <p class="platform-state-examples-note">Exemplos visuais somente; nenhum carregamento ou erro real está em andamento.</p>
      <div class="platform-state-examples-grid">
        <FeedbackState kind="loading" title="Carregando exemplo" description="Estado visual de carregamento." />
        <FeedbackState kind="error" title="Exemplo de erro" description="Uma mensagem de erro deve explicar o que falhou." />
        <FeedbackState kind="success" title="Exemplo de sucesso" description="Uma confirmação deve refletir uma ação concluída." />
      </div>
    </details>
  </section>
</template>
