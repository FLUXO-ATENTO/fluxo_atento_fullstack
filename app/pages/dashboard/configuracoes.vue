<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })
useSeoMeta({ title: 'Configurações · Fluxo Atento' })
</script>

<template>
  <section class="platform-dashboard-page">
    <div class="platform-page-heading platform-page-heading-compact">
      <div>
        <p class="eyebrow"><span class="eyebrow-line" /> CONTA</p>
        <h1>Configurações.</h1>
        <p>Preferências e dados de conta não estão conectados nesta versão local.</p>
      </div>
    </div>
    <div class="platform-settings-list">
      <article class="platform-panel platform-setting-row">
        <div><h2>Perfil e organização</h2><p>Dados de usuário e organização</p></div>
        <span class="platform-status">A DEFINIR</span>
      </article>
      <article class="platform-panel platform-setting-row">
        <div><h2>Notificações</h2><p>Canais e preferências de alerta</p></div>
        <span class="platform-status">A DEFINIR</span>
      </article>
      <article class="platform-panel platform-setting-row">
        <div><h2>Segurança e sessões</h2><p>Autenticação e gestão de acesso</p></div>
        <span class="platform-status">PENDENTE DE CONFIGURAÇÃO</span>
      </article>
    </div>
    <FeedbackState
      kind="empty"
      title="Configurações somente para consulta"
      description="Nenhuma preferência pode ser salva: não há backend nem sessão de usuário conectados."
    />
  </section>
</template>
