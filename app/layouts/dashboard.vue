<script setup lang="ts">
import { dashboardMock } from '~/data/dashboard'

const route = useRoute()

const navigation = [
  { label: 'Visão geral', to: '/dashboard', icon: '▦' },
  { label: 'Módulos', to: '/dashboard/modulos', icon: '◈' },
  { label: 'Configurações', to: '/dashboard/configuracoes', icon: '⚙' },
  { label: 'Planos', to: '/dashboard/planos', icon: '◇' }
]
</script>

<template>
  <div class="platform-app-shell">
    <aside class="platform-sidebar" aria-label="Navegação da plataforma">
      <NuxtLink class="platform-brand" to="/">
        <span class="brand-mark" aria-hidden="true"><span /></span>
        <span>fluxo<span class="wordmark-light">atento</span></span>
      </NuxtLink>

      <div class="platform-account">
        <span class="platform-account-avatar" aria-hidden="true">FA</span>
        <span><strong>{{ dashboardMock.accountName }}</strong><small>Conta demonstrativa</small></span>
        <span class="platform-account-chevron" aria-hidden="true">⌄</span>
      </div>

      <nav class="platform-sidebar-nav" aria-label="Menu da conta">
        <span class="platform-nav-label">ESPAÇO DE TRABALHO</span>
        <NuxtLink
          v-for="item in navigation"
          :key="item.to"
          :to="item.to"
          class="platform-nav-link"
          :class="{ 'is-active': route.path === item.to || (item.to !== '/dashboard' && route.path.startsWith(item.to)) }"
          :aria-current="route.path === item.to ? 'page' : undefined"
        >
          <span aria-hidden="true">{{ item.icon }}</span>{{ item.label }}
        </NuxtLink>
      </nav>

      <div class="platform-sidebar-bottom">
        <div class="platform-plan-note">
          <span class="platform-plan-note-label">STATUS DO PLANO</span>
          <strong>{{ dashboardMock.planStatus }}</strong>
          <NuxtLink to="/dashboard/planos">Ver informações <span aria-hidden="true">→</span></NuxtLink>
        </div>
        <NuxtLink class="platform-sidebar-home" to="/">← Voltar ao site</NuxtLink>
      </div>
    </aside>

    <div class="platform-main">
      <header class="platform-topbar">
        <div class="platform-breadcrumb"><span>Workspace</span><span aria-hidden="true">/</span><strong>{{ navigation.find((item) => route.path === item.to || (item.to !== '/dashboard' && route.path.startsWith(item.to)))?.label || 'Módulo' }}</strong></div>
        <div class="platform-topbar-actions">
          <span class="platform-demo-indicator"><i aria-hidden="true" /> DEMONSTRAÇÃO LOCAL</span>
          <NuxtLink class="platform-user" to="/login" aria-label="Abrir página de acesso">U</NuxtLink>
        </div>
      </header>
      <main id="conteudo" class="platform-content">
        <div class="platform-demo-notice" role="note">
          <span aria-hidden="true">i</span>
          <p>{{ dashboardMock.notice }}</p>
          <NuxtLink to="/login">Acesso visual <span aria-hidden="true">→</span></NuxtLink>
        </div>
        <slot />
      </main>
    </div>
  </div>
</template>
