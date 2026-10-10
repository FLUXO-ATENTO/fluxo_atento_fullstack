<script setup lang="ts">
withDefaults(defineProps<{
  kind: 'loading' | 'empty' | 'error' | 'success'
  title: string
  description: string
}>(), {
  kind: 'empty'
})

const stateIcons = {
  loading: '…',
  empty: '—',
  error: '!',
  success: '✓'
} as const
</script>

<template>
  <div class="platform-feedback" :class="`platform-feedback-${kind}`" :role="kind === 'error' ? 'alert' : 'status'">
    <span class="platform-feedback-icon" :class="{ 'platform-spinner': kind === 'loading' }" aria-hidden="true">
      {{ stateIcons[kind] }}
    </span>
    <div>
      <h3>{{ title }}</h3>
      <p>{{ description }}</p>
    </div>
  </div>
</template>
