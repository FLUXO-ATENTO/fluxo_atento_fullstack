<script setup lang="ts">
import { modules } from '~/data/modules'

definePageMeta({ layout: 'dashboard' })
useSeoMeta({ title: 'Módulos disponíveis · Fluxo Atento' })
</script>

<template>
  <section class="platform-dashboard-page">
    <div class="platform-page-heading platform-page-heading-compact">
      <div>
        <p class="eyebrow"><span class="eyebrow-line" /> CATÁLOGO</p>
        <h1>Módulos da <span>plataforma.</span></h1>
        <p>Disponibilidade, recursos e critérios de acesso ainda estão em definição.</p>
      </div>
      <span class="platform-status">Disponibilidade: A DEFINIR</span>
    </div>
    <div class="platform-module-grid">
      <ModuleCard v-for="module in modules" :key="module.id" :module="module" />
    </div>
  </section>
</template>
