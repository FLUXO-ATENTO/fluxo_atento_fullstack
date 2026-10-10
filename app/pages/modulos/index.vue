<script setup lang="ts">
import { modules } from '~/data/modules'

useSeoMeta({
  title: 'Módulos · Fluxo Atento',
  description: 'Apresentação dos seis módulos do Fluxo Atento. Detalhes e disponibilidade ainda em definição.'
})
</script>

<template>
  <section class="section platform-page-section">
    <div class="container">
      <NuxtLink class="platform-back-link" to="/">← Início</NuxtLink>
      <div class="platform-page-heading">
        <p class="eyebrow"><span class="eyebrow-line" /> CATÁLOGO DE MÓDULOS</p>
        <h1>Um produto integrado.<br><span>Seis módulos.</span></h1>
        <p>Descrições e capacidades específicas ainda não foram definidas. Abra cada módulo para consultar seu estado documentado.</p>
      </div>
      <div class="platform-module-grid">
        <ModuleCard v-for="module in modules" :key="module.id" :module="module" />
      </div>
    </div>
  </section>
</template>
