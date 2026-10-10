<script setup lang="ts">
import { LayoutDashboard, Radar, Layers3, MessageCircle, Settings2, ArrowLeft, CircleHelp, ChevronRight, LogOut, ShieldCheck } from '@lucide/vue'
const route = useRoute()
const { user, ready, signOut } = useAuth()
const { isDashboardApp, marketingUrl, dashboardPath } = useDeployment()
const exitError = ref('')
const navigation = [
  { label: 'Visão geral', to: dashboardPath('/dashboard'), icon: LayoutDashboard },
  { label: 'Minhas páginas', to: dashboardPath('/dashboard/monitores'), icon: Radar },
  { label: 'Módulos', to: dashboardPath('/dashboard/modulos'), icon: Layers3 },
  { label: 'Canais', to: dashboardPath('/dashboard/canais'), icon: MessageCircle },
  { label: 'Minha conta', to: dashboardPath('/dashboard/configuracoes'), icon: Settings2 }
]
const active = (path: string) => route.path === path || (path !== dashboardPath('/dashboard') && route.path.startsWith(path))
const current = computed(() => navigation.find(item => active(item.to))?.label || 'Sua conta')
async function exit() { try { await signOut() } catch { exitError.value = 'Não foi possível encerrar a sessão. Tente novamente.' } }
watch(user, value => { if (ready.value && !value && (isDashboardApp.value || route.path.startsWith('/dashboard'))) void navigateTo('/login') })
</script>
<template>
  <div class="workspace">
    <a class="skip-link" href="#conteudo">Pular para o conteúdo</a>
    <aside class="app-sidebar">
      <a :href="isDashboardApp ? marketingUrl : '/'" aria-label="Fluxo Atento — início"><BrandLogo /></a>
      <div class="workspace-switcher"><span class="workspace-avatar">FA</span><span><strong>Meu espaço</strong><small>Conta individual</small></span></div>
      <p class="nav-section-label mono">SEU ESPAÇO</p>
      <nav class="sidebar-nav" aria-label="Dashboard"><NuxtLink v-for="item in navigation" :key="item.to" :to="item.to" :class="{ active: active(item.to) }" :aria-current="active(item.to) ? 'page' : undefined"><component :is="item.icon" :size="17" />{{ item.label }}</NuxtLink></nav>
      <div class="sidebar-bottom"><div class="sidebar-support"><CircleHelp :size="18" /><strong> Precisa de uma direção?</strong><p>Consulte o que já está disponível nesta etapa.</p><a :href="isDashboardApp ? marketingUrl + '/ajuda' : '/ajuda'">Central de ajuda →</a></div><a class="sidebar-home" :href="isDashboardApp ? marketingUrl : '/'"><ArrowLeft :size="15" /> Voltar ao site</a></div>
    </aside>
    <div class="workspace-body">
      <header class="app-topbar"><div class="breadcrumb"><span>Meu espaço</span><ChevronRight :size="12" /><strong>{{ current }}</strong></div><div class="topbar-actions"><a class="icon-button" :href="isDashboardApp ? marketingUrl + '/ajuda' : '/ajuda'" aria-label="Central de ajuda"><CircleHelp :size="17" /></a><button class="icon-button" aria-label="Sair da conta" @click="exit"><LogOut :size="17" /></button></div></header>
      <nav class="app-mobile-nav" aria-label="Dashboard móvel"><NuxtLink v-for="item in navigation" :key="item.to" :to="item.to" :class="{ active: active(item.to) }" :aria-current="active(item.to) ? 'page' : undefined"><component :is="item.icon" :size="14" />{{ item.label }}</NuxtLink></nav>
      <main id="conteudo" class="workspace-content" tabindex="-1"><p v-if="exitError" role="alert" class="form-error">{{ exitError }}</p><div v-if="!ready || !user" class="empty-state" role="status">Conferindo seu acesso…</div><template v-else><div class="demo-notice"><ShieldCheck :size="16" /><span>Seu espaço individual. Verificações manuais disponíveis quando a API estiver conectada. Módulos avançados em preparação.</span></div><slot /></template></main>
    </div>
  </div>
</template>
