<script setup lang="ts">
import type { Component } from 'vue'
import { LayoutDashboard, Radar, Layers3, MessageCircle, Settings2, ArrowLeft, CircleHelp, ChevronRight, LogOut, ShieldCheck, ShieldUser, Users } from '@lucide/vue'
const route = useRoute()
const { user, ready, signOut } = useAuth()
const { isDashboardApp, marketingUrl, dashboardPath } = useDeployment()
const { activeTenant, platformAdmin, loading, error: workspaceError, ensure } = useWorkspace()
const exitError = ref('')
type NavigationItem = { label: string; to: string; icon: Component }
const navigation = computed<NavigationItem[]>(() => [
  { label: 'Visão geral', to: dashboardPath('/dashboard'), icon: LayoutDashboard },
  { label: 'Minhas páginas', to: dashboardPath('/dashboard/monitores'), icon: Radar },
  { label: 'Módulos', to: dashboardPath('/dashboard/modulos'), icon: Layers3 },
  { label: 'Canais', to: dashboardPath('/dashboard/canais'), icon: MessageCircle },
  { label: 'Contatos e histórico', to: dashboardPath('/dashboard/contatos'), icon: Users },
  { label: 'Minha conta', to: dashboardPath('/dashboard/configuracoes'), icon: Settings2 },
  ...(platformAdmin.value ? [{ label: 'Voltar ao Super Admin', to: dashboardPath('/dashboard/admin'), icon: ShieldUser }] : [])
])
const active = (path: string) => route.path === path || (path !== dashboardPath('/dashboard') && route.path.startsWith(path))
const current = computed(() => navigation.value.find(item => active(item.to))?.label || 'Sua conta')
async function exit() { try { await signOut() } catch { exitError.value = 'Não foi possível encerrar a sessão. Tente novamente.' } }
watch(user, value => { if (ready.value && !value && (isDashboardApp.value || route.path.startsWith('/dashboard'))) void navigateTo('/login') })
onMounted(() => { void ensure() })
</script>
<template>
  <div class="workspace">
    <a class="skip-link" href="#conteudo">Pular para o conteúdo</a>
    <aside class="app-sidebar">
      <a :href="isDashboardApp ? marketingUrl : '/'" aria-label="Fluxo Atento — início"><BrandLogo /></a>
      <div class="workspace-switcher"><span class="workspace-avatar">FA</span><span><strong>{{ activeTenant?.name || 'Preparando espaço…' }}</strong><small>{{ platformAdmin ? 'Super Admin · contexto deste tenant' : activeTenant?.role === 'owner' ? 'Responsável pelo tenant' : activeTenant?.role || 'Tenant do FLUXO' }}</small></span></div>
      <p class="nav-section-label mono">SEU ESPAÇO</p>
      <nav class="sidebar-nav" aria-label="Dashboard"><NuxtLink v-for="item in navigation" :key="item.to" :to="item.to" :class="{ active: active(item.to) }" :aria-current="active(item.to) ? 'page' : undefined"><component :is="item.icon" :size="17" />{{ item.label }}</NuxtLink></nav>
      <div class="sidebar-bottom"><div class="sidebar-support"><CircleHelp :size="18" /><strong> Precisa de uma direção?</strong><p>Consulte o que já está disponível nesta etapa.</p><a :href="isDashboardApp ? marketingUrl + '/ajuda' : '/ajuda'">Central de ajuda →</a></div><a class="sidebar-home" :href="isDashboardApp ? marketingUrl : '/'"><ArrowLeft :size="15" /> Voltar ao site</a></div>
    </aside>
    <div class="workspace-body">
      <header class="app-topbar"><div class="breadcrumb"><span>Meu espaço</span><ChevronRight :size="12" /><strong>{{ current }}</strong></div><div class="topbar-actions"><a class="icon-button" :href="isDashboardApp ? marketingUrl + '/ajuda' : '/ajuda'" aria-label="Central de ajuda"><CircleHelp :size="17" /></a><button class="icon-button" aria-label="Sair da conta" @click="exit"><LogOut :size="17" /></button></div></header>
      <nav class="app-mobile-nav" aria-label="Dashboard móvel"><NuxtLink v-for="item in navigation" :key="item.to" :to="item.to" :class="{ active: active(item.to) }" :aria-current="active(item.to) ? 'page' : undefined"><component :is="item.icon" :size="14" />{{ item.label }}</NuxtLink><a :href="isDashboardApp ? marketingUrl : '/'">Voltar ao site</a></nav>
      <main id="conteudo" class="workspace-content" tabindex="-1"><p v-if="exitError || workspaceError" role="alert" class="form-error">{{ exitError || workspaceError }}</p><div v-if="!ready || !user || loading && !activeTenant" class="empty-state" role="status">Conferindo seu acesso…</div><template v-else><div class="demo-notice"><ShieldCheck :size="16" /><span>Dados operacionais ficam isolados por tenant. Canais só são ativados após conexão e validação.</span></div><slot /></template></main>
    </div>
  </div>
</template>
