<script setup lang="ts">
defineProps<{ compact?: boolean }>()
</script>
<template>
  <span class="brand-logo">
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" class="brand-symbol"><path d="M5 25V7h9M5 16h14M13 25V7h14M20 25l7-18" stroke="currentColor" stroke-width="3" stroke-linecap="square" /></svg>
    <span v-if="!compact">fluxo<span class="brand-light">atento</span><span class="brand-period">.</span></span>
  </span>
</template>
