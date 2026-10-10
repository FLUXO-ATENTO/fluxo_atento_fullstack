<script setup>
useSeoMeta({
  title: 'Privacidade · Fluxo Atento',
  description: 'Política de privacidade e princípios do Fluxo Atento.'
})
</script>

<template>
  <section class="section page-section">
    <div class="container narrow-content">
      <p class="eyebrow"><span class="eyebrow-line" /> PRIVACIDADE</p>
      <h1>Privacidade e observação responsável</h1>
      <p>O Fluxo Atento trabalha com sinais que uma navegação permitida e legitimamente acessível entrega ao navegador. A proposta não inclui acesso indevido, bypass de autenticação, CAPTCHA ou dados que não sejam visíveis ao usuário em um ambiente autorizado.</p>
      <p>Na arquitetura planejada, o produto separa claramente dados de navegação, registros de observação e armazenamento de contexto. O frontend público permanece estático e as integrações com Supabase e APIs futuras serão protegidas por controles de acesso e regras de segurança.</p>
      <NuxtLink class="button button-secondary" to="/">Voltar ao início</NuxtLink>
    </div>
  </section>
</template>
