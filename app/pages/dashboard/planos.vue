<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })
useSeoMeta({
  title: 'Conhecer planos · Fluxo Atento',
  description: 'Compare as propostas de planos do Fluxo Atento dentro da demonstração.',
  robots: 'noindex'
})
</script>

<template>
  <div>
    <header class="page-heading">
      <div>
        <p class="eyebrow">PLANOS</p>
        <h1>O próximo passo do seu negócio.</h1>
        <p>Conheça as propostas para sua rotina. Este espaço continua sendo uma demonstração, sem assinatura ativa.</p>
      </div>
    </header>
    <PricingPlans />
  </div>
</template>
