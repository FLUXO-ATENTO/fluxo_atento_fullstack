<script setup>
const { address, message, isValid, validate } = useUrlAnalyzer()
</script>

<template>
  <form class="url-analyzer" novalidate @submit.prevent="validate">
    <label class="sr-only" for="site-address">Endereço do site para análise</label>
    <div class="url-input-wrap">
      <span class="url-input-icon" aria-hidden="true">↗</span>
      <input
        id="site-address"
        v-model="address"
        type="text"
        name="url"
        inputmode="url"
        autocomplete="url"
        placeholder="https://seusite.com"
        aria-describedby="analyzer-message analyzer-disclaimer"
        :aria-invalid="message && !isValid ? 'true' : 'false'"
        @input="message = ''; isValid = false"
      >
      <button class="button button-primary analyzer-button" type="submit">Analisar URL <span aria-hidden="true">→</span></button>
    </div>
    <p v-if="message" id="analyzer-message" class="analyzer-message" :class="{ 'is-error': !isValid }" role="status">
      {{ message }}
      <NuxtLink v-if="isValid" to="/demo">Conheça a demonstração.</NuxtLink>
    </p>
    <p v-else id="analyzer-disclaimer" class="analyzer-disclaimer">Este campo valida o formato da URL em tempo real e não a acessa.</p>
    <p id="analyzer-disclaimer" class="analyzer-disclaimer">
      Sem acesso à URL nesta versão. O resultado real depende da futura API de análise.
    </p>
  </form>
</template>
