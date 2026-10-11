<script setup lang="ts">
import { ShieldCheck, Building2, Plug, UserPlus, ScrollText, ArrowLeft, LogOut } from '@lucide/vue'
const { user, ready, signOut } = useAuth()
const { platformAdmin, error } = useWorkspace()
const { marketingUrl, dashboardPath } = useDeployment()
const exitError = ref('')
const sections = [
  { id: 'tenants', label: 'Tenants e permissões', icon: Building2 },
  { id: 'usuarios', label: 'Cadastrar usuário', icon: UserPlus },
  { id: 'provedores', label: 'Provedores globais', icon: Plug },
  { id: 'auditoria', label: 'Auditoria', icon: ScrollText }
]
async function exit() { try { await signOut() } catch { exitError.value = 'Não foi possível encerrar sua sessão.' } }
watch(user, value => { if (ready.value && !value) void navigateTo('/login') })
</script>
<template>
  <div class="workspace superadmin-workspace">
    <a class="skip-link" href="#conteudo">Pular para o conteúdo</a>
    <aside class="app-sidebar">
      <a :href="marketingUrl" aria-label="FLUXO — voltar ao site"><BrandLogo /></a>
      <div class="workspace-switcher"><span class="workspace-avatar"><ShieldCheck :size="22" /></span><span><strong>FLUXO · Super Admin</strong><small>Administração global</small></span></div>
      <p class="nav-section-label mono">CONTROLE DA PLATAFORMA</p>
      <nav class="sidebar-nav" aria-label="Super Admin"><NuxtLink v-for="section in sections" :key="section.id" :to="dashboardPath('/dashboard/admin') + '#' + section.id"><component :is="section.icon" :size="18" />{{ section.label }}</NuxtLink></nav>
      <div class="sidebar-bottom"><p class="admin-scope-copy">Área exclusiva da administração. Nenhuma senha ou chave privada é exibida neste painel.</p><a class="sidebar-home" :href="marketingUrl"><ArrowLeft :size="15" />Voltar ao site</a></div>
    </aside>
    <div class="workspace-body">
      <header class="app-topbar"><div class="breadcrumb"><ShieldCheck :size="18" /><strong>Super Admin</strong><span class="admin-scope-badge">Acesso global</span></div><div class="topbar-actions"><span class="admin-account">{{ user?.email }}</span><button class="icon-button" aria-label="Sair da conta" @click="exit"><LogOut :size="17" /></button></div></header>
      <nav class="app-mobile-nav" aria-label="Super Admin móvel"><NuxtLink v-for="section in sections" :key="section.id" :to="dashboardPath('/dashboard/admin') + '#' + section.id">{{ section.label }}</NuxtLink><a :href="marketingUrl">Voltar ao site</a></nav>
      <main id="conteudo" class="workspace-content" tabindex="-1">
        <p v-if="error || exitError" class="form-error" role="alert">{{ error || exitError }}</p>
        <div v-if="!ready || !user || !platformAdmin" class="empty-state" role="status">Confirmando permissão de Super Admin…</div>
        <slot v-else />
      </main>
    </div>
  </div>
</template>
