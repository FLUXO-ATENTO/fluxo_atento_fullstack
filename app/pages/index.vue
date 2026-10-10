<script setup lang="ts">
import { modules } from '~/data/modules'

useSeoMeta({
  title: 'Fluxo Atento — plataforma modular',
  description: 'Uma plataforma com seis módulos independentes. Escopos, disponibilidade e planos em definição.'
})
</script>

<template>
  <div class="platform-marketing">
    <section class="platform-hero">
      <div class="platform-hero-grid" aria-hidden="true" />
      <div class="container platform-hero-content">
        <p class="eyebrow"><span class="eyebrow-line" /> PLATAFORMA MODULAR</p>
        <h1>Uma plataforma.<br><span>Seis módulos independentes.</span></h1>
        <p class="platform-hero-copy">
          Conheça o Fluxo Atento e seus módulos. As descrições funcionais, disponibilidade e planos permanecem em definição.
        </p>
        <div class="platform-hero-actions">
          <NuxtLink class="button button-primary" to="/modulos">Explorar módulos <span aria-hidden="true">→</span></NuxtLink>
          <NuxtLink class="button button-secondary" to="/dashboard">Ver demonstração local</NuxtLink>
        </div>
        <p class="platform-inline-note"><span aria-hidden="true">i</span> Interface local demonstrativa. Sem autenticação, cobrança ou integrações conectadas.</p>
      </div>
    </section>

    <section id="modulos" class="section platform-module-section">
      <div class="container">
        <div class="section-heading section-heading-split">
          <div>
            <p class="eyebrow"><span class="section-index">01</span> UM ECOSSISTEMA, SEIS MÓDULOS</p>
            <h2>Conheça a plataforma<br><span>Fluxo Atento.</span></h2>
          </div>
          <p class="section-intro">Os nomes estão definidos; os escopos e a disponibilidade ainda precisam de confirmação de produto.</p>
        </div>
        <div class="platform-module-grid">
          <ModuleCard v-for="module in modules" :key="module.id" :module="module" />
        </div>
      </div>
    </section>

    <section class="platform-assurance-section">
      <div class="container platform-assurance">
        <span class="platform-assurance-icon" aria-hidden="true">i</span>
        <div>
          <h2>Sem suposições sobre o produto</h2>
          <p>Recursos, categorias, preços, planos, métricas e integrações não documentados aparecem como <strong>A DEFINIR</strong>. Nenhum serviço externo está conectado nesta experiência local.</p>
        </div>
        <NuxtLink class="text-link" to="/dashboard/planos">Ver planos <span aria-hidden="true">→</span></NuxtLink>
      </div>
    </section>
  </div>
</template>
