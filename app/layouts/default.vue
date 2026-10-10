<script setup lang="ts">
const menuOpen = ref(false)

function closeMenu() {
  menuOpen.value = false
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') closeMenu()
}

watch(menuOpen, (isOpen) => {
  if (import.meta.client) document.body.classList.toggle('menu-open', isOpen)
})

onMounted(() => window.addEventListener('keydown', onKeydown))

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  document.body.classList.remove('menu-open')
})
</script>

<template>
  <div>
    <a class="skip-link" href="#conteudo">Pular para o conteúdo</a>
    <header class="site-header">
      <div class="container header-inner">
        <NuxtLink class="wordmark" to="/" aria-label="Fluxo Atento — início" @click="closeMenu">
          <span class="brand-mark" aria-hidden="true"><span /></span>
          <span>fluxo<span class="wordmark-light">atento</span></span>
        </NuxtLink>

        <button
          class="menu-toggle"
          type="button"
          :aria-expanded="menuOpen"
          aria-controls="main-navigation"
          aria-label="Alternar menu principal"
          @click="menuOpen = !menuOpen"
        >
          <span /><span />
        </button>

        <nav id="main-navigation" class="main-navigation" :class="{ 'is-open': menuOpen }" aria-label="Navegação principal">
          <NuxtLink to="/#modulos" @click="closeMenu">Módulos</NuxtLink>
          <NuxtLink to="/demo" @click="closeMenu">Demonstração</NuxtLink>
          <div class="navigation-actions">
            <NuxtLink class="login-link" to="/login" @click="closeMenu">Entrar</NuxtLink>
            <NuxtLink class="button button-small button-primary" to="/dashboard" @click="closeMenu">Conhecer plataforma</NuxtLink>
          </div>
        </nav>
      </div>
    </header>

    <main id="conteudo">
      <slot />
    </main>

    <footer class="site-footer">
      <div class="container footer-main">
        <div class="footer-brand">
          <NuxtLink class="wordmark" to="/">
            <span class="brand-mark" aria-hidden="true"><span /></span>
            <span>fluxo<span class="wordmark-light">atento</span></span>
          </NuxtLink>
          <p>Uma plataforma. Seis módulos independentes.</p>
          <p class="footer-note">Informações de produto e integrações ainda em definição.</p>
        </div>
        <div class="footer-links">
          <div>
            <h2>Plataforma</h2>
            <NuxtLink to="/modulos">Módulos</NuxtLink>
            <NuxtLink to="/dashboard">Visão demonstrativa</NuxtLink>
            <NuxtLink to="/dashboard/planos">Planos</NuxtLink>
          </div>
          <div>
            <h2>Informações</h2>
            <NuxtLink to="/privacy">Privacidade</NuxtLink>
            <NuxtLink to="/terms">Termos de uso</NuxtLink>
            <NuxtLink to="/login">Acesso</NuxtLink>
          </div>
        </div>
      </div>
      <div class="container footer-bottom">
        <span>© {{ new Date().getFullYear() }} Fluxo Atento</span>
        <span>Versão local demonstrativa · sem serviços conectados</span>
      </div>
    </footer>
  </div>
</template>
