<script setup lang="ts">
import { ArrowUpRight, Menu } from '@lucide/vue'
const menuOpen = ref(false)
const route = useRoute()
const { isDashboardApp, marketingUrl, agentUrl, dashboardAccessUrl } = useDeployment()
watch(() => route.fullPath, () => { menuOpen.value = false })
</script>
<template>
  <div class="marketing-shell">
    <a class="skip-link" href="#conteudo">Pular para o conteúdo</a>
    <header v-if="!isDashboardApp" class="site-header">
      <div class="container header-inner">
        <NuxtLink to="/" aria-label="Fluxo Atento — início"><BrandLogo /></NuxtLink>
        <div class="header-actions">
          <NuxtLink to="/como-funciona" class="text-link">Como funciona</NuxtLink>
          <AgentSupportButton :to="agentUrl" />
          <a :href="dashboardAccessUrl('/login')" class="text-link">Entrar</a>
          <ThemeMenu />
          <UModal v-model:open="menuOpen" title="Navegação" description="Explore o Fluxo Atento.">
            <button class="icon-button mobile-menu-button" aria-label="Abrir menu"><Menu :size="22" /></button>
            <template #body><nav class="mobile-navigation" aria-label="Navegação móvel">
              <NuxtLink to="/como-funciona" @click="menuOpen = false">Como funciona <ArrowUpRight :size="18" /></NuxtLink>
              <a :href="agentUrl" @click="menuOpen = false">Fale com o agente <ArrowUpRight :size="18" /></a>
              <NuxtLink to="/planos" @click="menuOpen = false">Planos <ArrowUpRight :size="18" /></NuxtLink>
              <NuxtLink to="/ajuda" @click="menuOpen = false">Central de ajuda <ArrowUpRight :size="18" /></NuxtLink>
              <NuxtLink to="/contato" @click="menuOpen = false">Contato <ArrowUpRight :size="18" /></NuxtLink>
              <NuxtLink to="/modulos" @click="menuOpen = false">Módulos <ArrowUpRight :size="18" /></NuxtLink>
              <NuxtLink to="/exemplo" @click="menuOpen = false">Dashboard demonstrativo <ArrowUpRight :size="18" /></NuxtLink>
              <a :href="dashboardAccessUrl('/login')" @click="menuOpen = false">Entrar <ArrowUpRight :size="18" /></a>
            </nav></template>
          </UModal>
        </div>
      </div>
    </header>
    <div v-else class="access-header container"><a :href="marketingUrl" aria-label="Fluxo Atento — início"><BrandLogo /></a><ThemeMenu /></div>
    <main id="conteudo" tabindex="-1"><slot /></main>
    <footer v-if="!isDashboardApp" class="site-footer">
      <div class="container footer-main">
        <div><NuxtLink to="/" aria-label="Fluxo Atento — início"><BrandLogo /></NuxtLink><p>Menos pontos cegos.<br>Mais clareza para agir.</p></div>
        <div class="footer-links">
          <div><h2>Explore</h2><NuxtLink to="/como-funciona">Como funciona</NuxtLink><NuxtLink to="/planos">Planos</NuxtLink><NuxtLink to="/modulos">Recursos previstos</NuxtLink><NuxtLink to="/integracoes">Integrações</NuxtLink></div>
          <div><h2>Conte com a gente</h2><NuxtLink to="/docs">Documentação</NuxtLink><NuxtLink to="/ajuda">Central de ajuda</NuxtLink><NuxtLink to="/suporte">Suporte</NuxtLink><NuxtLink to="/contato">Contato</NuxtLink><NuxtLink to="/exemplo">Painel demonstrativo</NuxtLink></div>
          <div><h2>Transparência</h2><NuxtLink to="/privacy">Privacidade</NuxtLink><NuxtLink to="/terms">Termos de uso</NuxtLink><NuxtLink to="/exclusao-de-dados">Exclusão de dados</NuxtLink></div>
        </div>
      </div>
      <div class="container footer-bottom"><span>© {{ new Date().getFullYear() }} Fluxo Atento</span><span class="mono">PRODUTO EM DESENVOLVIMENTO <span class="status-dot" /></span></div>
    </footer>
  </div>
</template>
