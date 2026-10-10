<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })
useSeoMeta({ title: 'Planos e upgrade · Fluxo Atento' })
</script>

<template>
  <section class="platform-dashboard-page">
    <div class="platform-page-heading platform-page-heading-compact">
      <div>
        <p class="eyebrow"><span class="eyebrow-line" /> PLANOS</p>
        <h1>Planos e <span>upgrade.</span></h1>
        <p>Valores, limites, benefícios e regras de upgrade ainda não foram definidos.</p>
      </div>
    </div>
    <div class="platform-plan-card">
      <span class="platform-plan-card-mark" aria-hidden="true">◇</span>
      <div>
        <span class="platform-plan-note-label">PLANO DA CONTA</span>
        <h2>A DEFINIR</h2>
        <p>Não há preços, cobrança ou checkout ativos nesta plataforma local.</p>
      </div>
      <span class="platform-status">Cobrança não conectada</span>
    </div>
    <FeedbackState
      kind="empty"
      title="Upgrade indisponível"
      description="A definição comercial e a integração de cobrança estão pendentes. Nenhuma compra pode ser iniciada."
    />
  </section>
</template>
