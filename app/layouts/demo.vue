<script setup lang="ts">
import { LayoutDashboard, Radar, Layers3, MessageCircle, Settings2, ArrowLeft, CircleHelp, FlaskConical, ChevronRight, ArrowUpRight } from '@lucide/vue'
const route = useRoute()
const navigation = [
  { label: 'Visão geral', to: '/exemplo', icon: LayoutDashboard },
  { label: 'Monitores', to: '/exemplo/monitores', icon: Radar },
  { label: 'Módulos', to: '/modulos', icon: Layers3 },
  { label: 'Canais', to: '/integracoes', icon: MessageCircle },
  { label: 'Configurações', to: '/exemplo/configuracoes', icon: Settings2 }
]
const active = (path: string) => route.path === path || (path !== '/exemplo' && route.path.startsWith(path))
const current = computed(() => navigation.find(item => active(item.to))?.label || 'Sua conta')
</script>
<template>
  <div class="workspace">
    <a class="skip-link" href="#conteudo">Pular para o conteúdo</a>
    <aside class="app-sidebar">
      <NuxtLink to="/" aria-label="Fluxo Atento — início"><BrandLogo /></NuxtLink>
      <div class="workspace-switcher"><span class="workspace-avatar">FA</span><span><strong>Meu primeiro espaço</strong><small>Ambiente de demonstração</small></span></div>
      <p class="nav-section-label mono">SEU ESPAÇO</p>
      <nav class="sidebar-nav" aria-label="Dashboard"><NuxtLink v-for="item in navigation" :key="item.to" :to="item.to" :class="{ active: active(item.to) }" :aria-current="active(item.to) ? 'page' : undefined"><component :is="item.icon" :size="17" />{{ item.label }}</NuxtLink></nav>
      <p class="nav-section-label mono">PRÓXIMOS PASSOS</p>
      <nav class="sidebar-nav" aria-label="Recursos"><NuxtLink to="/integracoes"><Layers3 :size="17" />Integrações</NuxtLink><NuxtLink to="/planos"><ArrowUpRight :size="17" />Conhecer planos</NuxtLink></nav>
      <div class="sidebar-bottom"><div class="sidebar-support"><CircleHelp :size="18" /><strong> Precisa de uma direção?</strong><p>Entenda cada etapa sem sair do contexto.</p><NuxtLink to="/ajuda">Abrir central de ajuda →</NuxtLink></div><NuxtLink class="sidebar-home" to="/"><ArrowLeft :size="15" /> Voltar ao site</NuxtLink></div>
    </aside>
    <div class="workspace-body">
      <header class="app-topbar"><div class="breadcrumb"><span>Meu primeiro espaço</span><ChevronRight :size="12" /><strong>{{ current }}</strong></div><div class="topbar-actions"><span class="topbar-demo mono"><span class="status-dot" /> DEMONSTRAÇÃO</span><ThemeMenu /><NuxtLink class="icon-button" to="/ajuda" aria-label="Central de ajuda"><CircleHelp :size="17" /></NuxtLink><NuxtLink class="workspace-avatar" to="/" aria-label="Voltar ao início">FA</NuxtLink></div></header>
      <nav class="app-mobile-nav" aria-label="Dashboard móvel"><NuxtLink v-for="item in navigation" :key="item.to" :to="item.to" :class="{ active: active(item.to) }" :aria-current="active(item.to) ? 'page' : undefined"><component :is="item.icon" :size="14" />{{ item.label }}</NuxtLink></nav>
      <main id="conteudo" class="workspace-content" tabindex="-1"><div class="demo-notice"><FlaskConical :size="16" /><span>Você está explorando um exemplo. Os dados são ilustrativos e as ações ficam nesta sessão.</span><NuxtLink to="/ajuda#demo">Como funciona a demo ↗</NuxtLink></div><slot /></main>
    </div>
  </div>
</template>
