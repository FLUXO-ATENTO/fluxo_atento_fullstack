<script setup lang="ts">
useSeoMeta({
  title: 'Planos para seu negócio · Fluxo Atento',
  description: 'Conheça os planos propostos do Fluxo Atento para quem recebe clientes pelo site e WhatsApp. Demonstração, recursos planejados e preços sugeridos.'
})
</script>

<template>
  <div class="container page-section">
    <header class="page-hero">
      <p class="eyebrow">GRATUITO · ESSENCIAL · COMPLETO</p>
      <h1>Do tamanho do seu negócio.</h1>
      <p>
        Para você que tem uma loja ou pequeno negócio e recebe clientes pelo site e pelo WhatsApp.
        Explore a proposta para acompanhar o site, organizar o atendimento e preparar campanhas,
        sozinho ou com sua equipe.
      </p>
    </header>
    <PricingPlans />
  </div>
</template>
