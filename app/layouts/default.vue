<script setup lang="ts">
import { ArrowUpRight, Menu, ArrowRight } from '@lucide/vue'
const menuOpen = ref(false)
const route = useRoute()
watch(() => route.fullPath, () => { menuOpen.value = false })
</script>
<template>
  <div class="marketing-shell">
    <a class="skip-link" href="#conteudo">Pular para o conteúdo</a>
    <header class="site-header">
      <div class="container header-inner">
        <NuxtLink to="/" aria-label="Fluxo Atento — início"><BrandLogo /></NuxtLink>
        <nav class="desktop-nav" aria-label="Navegação principal">
          <NuxtLink to="/como-funciona">Como funciona</NuxtLink><NuxtLink to="/planos">Planos</NuxtLink><NuxtLink to="/ajuda">Central de ajuda</NuxtLink>
        </nav>
        <div class="header-actions">
          <NuxtLink to="/login" class="login-link">Entrar <ArrowUpRight :size="14" /></NuxtLink>
          <NuxtLink to="/exemplo" class="button button-small button-primary">Explorar demo <ArrowRight :size="15" /></NuxtLink>
          <UModal v-model:open="menuOpen" title="Navegação" description="Explore o Fluxo Atento.">
            <button class="icon-button mobile-menu-button" aria-label="Abrir menu"><Menu :size="22" /></button>
            <template #body><nav class="mobile-navigation" aria-label="Navegação móvel">
              <NuxtLink to="/como-funciona" @click="menuOpen = false">Como funciona <ArrowUpRight :size="18" /></NuxtLink>
              <NuxtLink to="/planos" @click="menuOpen = false">Planos <ArrowUpRight :size="18" /></NuxtLink>
              <NuxtLink to="/ajuda" @click="menuOpen = false">Central de ajuda <ArrowUpRight :size="18" /></NuxtLink>
              <NuxtLink to="/contato" @click="menuOpen = false">Contato <ArrowUpRight :size="18" /></NuxtLink>
              <NuxtLink to="/modulos" @click="menuOpen = false">Módulos <ArrowUpRight :size="18" /></NuxtLink>
              <NuxtLink to="/exemplo" @click="menuOpen = false">Dashboard demonstrativo <ArrowUpRight :size="18" /></NuxtLink>
              <NuxtLink to="/login" @click="menuOpen = false">Entrar <ArrowUpRight :size="18" /></NuxtLink>
            </nav></template>
          </UModal>
        </div>
      </div>
    </header>
    <main id="conteudo" tabindex="-1"><slot /></main>
    <footer class="site-footer">
      <div class="container footer-main">
        <div><NuxtLink to="/" aria-label="Fluxo Atento — início"><BrandLogo /></NuxtLink><p>Menos pontos cegos.<br>Mais clareza para agir.</p></div>
        <div class="footer-links">
          <div><h2>Explore</h2><NuxtLink to="/como-funciona">Como funciona</NuxtLink><NuxtLink to="/planos">Planos</NuxtLink><NuxtLink to="/modulos">Recursos previstos</NuxtLink><NuxtLink to="/integracoes">Integrações</NuxtLink></div>
          <div><h2>Conte com a gente</h2><NuxtLink to="/ajuda">Central de ajuda</NuxtLink><NuxtLink to="/suporte">Suporte</NuxtLink><NuxtLink to="/contato">Contato</NuxtLink><NuxtLink to="/exemplo">Explorar o painel</NuxtLink></div>
          <div><h2>Transparência</h2><NuxtLink to="/privacy">Privacidade</NuxtLink><NuxtLink to="/terms">Termos de uso</NuxtLink></div>
        </div>
      </div>
      <div class="container footer-bottom"><span>© {{ new Date().getFullYear() }} Fluxo Atento</span><span class="mono">PRODUTO EM DESENVOLVIMENTO <span class="status-dot" /></span></div>
    </footer>
  </div>
</template>
