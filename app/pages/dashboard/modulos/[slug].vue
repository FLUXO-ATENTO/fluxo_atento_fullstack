<script setup lang="ts">
import { modules } from '~/data/modules'
import { moduleStatusLabels } from '~/types/modules'

definePageMeta({ layout: 'dashboard' })

const route = useRoute()
const slug = Array.isArray(route.params.slug) ? route.params.slug[0] : route.params.slug
const module = modules.find((item) => item.id === slug)

if (!module) {
  throw createError({ statusCode: 404, statusMessage: 'Módulo não encontrado' })
}

useSeoMeta({ title: `${module.name} · Área demonstrativa` })
</script>

<template>
  <section class="platform-dashboard-page">
    <NuxtLink class="platform-back-link" to="/dashboard/modulos">← Catálogo de módulos</NuxtLink>
    <article class="platform-detail-card">
      <div class="platform-detail-top">
        <span class="platform-module-icon platform-module-icon-large" :style="{ '--module-accent': module.visualColor }" aria-hidden="true">{{ module.icon }}</span>
        <span class="platform-status">{{ moduleStatusLabels[module.status] }}</span>
      </div>
      <p class="eyebrow">{{ module.category }}</p>
      <h1>{{ module.name }}</h1>
      <p class="platform-detail-description">{{ module.longDescription }}</p>
      <div class="platform-detail-grid">
        <div><span>Disponibilidade</span><strong>A DEFINIR</strong></div>
        <div><span>Plano mínimo</span><strong>{{ module.minimumPlan }}</strong></div>
        <div><span>Status do módulo</span><strong>{{ moduleStatusLabels[module.status] }}</strong></div>
      </div>
      <div class="platform-detail-features">
        <h2>Recursos previstos</h2>
        <ul><li v-for="feature in module.plannedFeatures" :key="feature">{{ feature }}</li></ul>
      </div>
      <FeedbackState
        kind="empty"
        title="Módulo ainda não conectado"
        description="Esta é uma tela estrutural. Nenhum agente, dado ou integração deste módulo está em execução."
      />
      <NuxtLink class="button button-secondary" :to="module.route">Ver apresentação pública</NuxtLink>
    </article>
  </section>
</template>
