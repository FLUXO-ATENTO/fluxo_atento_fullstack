<script setup lang="ts">
const message = ref('')

function explainUnavailableAuth() {
  message.value = 'A autenticação ainda não está conectada. Nenhuma sessão foi criada.'
}

useSeoMeta({
  title: 'Entrar · Fluxo Atento',
  description: 'Prévia local da tela de acesso do Fluxo Atento. Autenticação não conectada.'
})
</script>

<template>
  <section class="section platform-auth-section">
    <div class="container platform-auth-container">
      <NuxtLink class="platform-back-link" to="/">← Início</NuxtLink>
      <div class="platform-auth-card">
        <span class="platform-auth-symbol" aria-hidden="true"><span class="brand-mark"><span /></span></span>
        <p class="eyebrow"><span class="eyebrow-line" /> ACESSO DEMONSTRATIVO</p>
        <h1>Entrar no Fluxo Atento</h1>
        <p class="platform-auth-copy">Esta tela é apenas uma prévia visual. A autenticação está pendente de configuração.</p>
        <form class="platform-auth-form" @submit.prevent="explainUnavailableAuth">
          <label for="login-email">E-mail</label>
          <input id="login-email" type="email" autocomplete="username" placeholder="voce@exemplo.com">
          <label for="login-password">Senha</label>
          <input id="login-password" type="password" autocomplete="current-password" placeholder="Digite sua senha">
          <button class="button button-primary button-full" type="submit">Continuar</button>
        </form>
        <p v-if="message" class="platform-inline-feedback" role="status">{{ message }}</p>
        <p v-else class="platform-inline-feedback">Formulário desativado · nenhuma informação será enviada.</p>
        <NuxtLink class="platform-auth-footer-link" to="/dashboard">Explorar o dashboard demonstrativo</NuxtLink>
      </div>
    </div>
  </section>
</template>
