<script setup lang="ts">
import { profileGreeting } from '~/utils/workspace-ui'
definePageMeta({ layout: 'dashboard' })
useSeoMeta({ title: 'Início · Fluxo Atento', robots: 'noindex, nofollow' })
const { user } = useAuth()
const { activeTenant } = useWorkspace()
const { dashboardPath } = useDeployment()
const { recent, tourOpen } = useDashboardChrome()
const { monitors, loading, error } = useMonitors()
const greeting = computed(() => profileGreeting(user.value))
const recentPages = computed(() => recent.value.filter(item => item.path !== dashboardPath('/dashboard')).slice(0, 4))
</script>
<template>
  <div class="workspace-home">
    <header class="page-heading home-heading"><div><p class="eyebrow">{{ activeTenant?.name || 'SEU ESPAÇO' }}</p><h1>{{ greeting }}<span class="brand-period">.</span></h1><p>Mais clareza sobre seus dados. Um próximo passo por vez.</p><NuxtLink v-if="!user?.displayName" :to="dashboardPath('/dashboard/configuracoes')" class="text-link">Complete seu nome no perfil <UIcon name="i-lucide-arrow-right" /></NuxtLink></div><button class="button button-secondary" @click="tourOpen = true"><UIcon name="i-lucide-compass" />Conhecer o painel</button></header>
    <WelcomeGuidance />
    <div class="home-columns">
      <section aria-labelledby="quick-access-title"><div class="section-topline"><h2 id="quick-access-title">Acesso rápido</h2><span class="subtle-label">SEU ESPAÇO DE TRABALHO</span></div>
        <div class="quick-access-grid">
          <NuxtLink :to="dashboardPath('/dashboard/monitores')" class="quick-card"><span class="feature-icon"><UIcon name="i-lucide-radar" /></span><h3>Monitorar sites</h3><p>Acompanhe as páginas que seus clientes visitam.</p><span class="quick-card-footer"><span>{{ loading ? 'Consultando páginas…' : error ? 'Consulte o status no módulo' : monitors.length + ' página(s) cadastrada(s)' }}</span><UIcon name="i-lucide-arrow-up-right" /></span></NuxtLink>
          <NuxtLink :to="dashboardPath('/dashboard/canais')" class="quick-card"><span class="feature-icon"><UIcon name="i-lucide-plug" /></span><h3>Integrações</h3><p>Entenda as conexões e a situação de cada fonte.</p><span class="quick-card-footer"><span>Ver conexões e requisitos</span><UIcon name="i-lucide-arrow-up-right" /></span></NuxtLink>
          <NuxtLink :to="dashboardPath('/dashboard/recursos?grupo=crescimento')" class="quick-card"><span class="feature-icon"><UIcon name="i-lucide-chart-no-axes-combined" /></span><h3>Campanhas e funil</h3><p>Conheça a jornada da origem do tráfego à conversão.</p><span class="quick-card-footer"><span>Em preparação</span><UIcon name="i-lucide-arrow-up-right" /></span></NuxtLink>
          <NuxtLink :to="dashboardPath('/dashboard/configuracoes')" class="quick-card"><span class="feature-icon"><UIcon name="i-lucide-sliders-horizontal" /></span><h3>Meu perfil</h3><p>Seus dados de exibição e suas preferências.</p><span class="quick-card-footer"><span>Ajustar meu espaço</span><UIcon name="i-lucide-arrow-up-right" /></span></NuxtLink>
        </div>
      </section>
      <aside class="home-aside">
        <section class="panel recent-panel"><h2>Páginas recentes</h2><div v-if="recentPages.length" class="account-links"><NuxtLink v-for="item in recentPages" :key="item.path" :to="item.path">{{ item.label }}<UIcon name="i-lucide-arrow-up-right" /></NuxtLink></div><p v-else>As páginas visitadas nesta sessão aparecerão aqui.</p></section>
        <section class="context-note"><UIcon name="i-lucide-shield-check" /><h2>Seu contexto importa.</h2><p>Confira sempre a empresa no menu lateral. Acesso e permissões são verificados pelo servidor.</p><NuxtLink :to="dashboardPath('/dashboard/planos')" class="text-link">Conhecer planos e limites <UIcon name="i-lucide-arrow-right" /></NuxtLink></section>
      </aside>
    </div>
  </div>
</template>
