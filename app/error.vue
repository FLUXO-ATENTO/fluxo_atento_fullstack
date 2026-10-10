<script setup lang="ts">
defineProps<{ error: { statusCode?: number; message?: string } }>()
</script>
<template><UApp><main class="container narrow-content"><BrandLogo /><p class="eyebrow" style="margin-top:45px">{{ error.statusCode || 500 }} / VAMOS RETOMAR O CAMINHO</p><h1>{{ error.statusCode === 404 ? 'Essa página não está aqui.' : 'Não foi possível abrir esta página.' }}</h1><p>{{ error.statusCode === 404 ? 'Confira o endereço ou volte ao início para continuar.' : 'Tente novamente em instantes. Se continuar, confira a central de ajuda.' }}</p><button class="button button-primary" @click="clearError({ redirect: '/' })">Voltar ao início</button></main></UApp></template>
