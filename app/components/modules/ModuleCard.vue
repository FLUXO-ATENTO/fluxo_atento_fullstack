<script setup lang="ts">
import { moduleStatusLabels } from '~/types/modules'
import type { ProductModule } from '~/types/modules'

defineProps<{
  module: ProductModule
  compact?: boolean
}>()
</script>

<template>
  <NuxtLink
    class="platform-module-card"
    :class="{ 'platform-module-card-compact': compact }"
    :to="module.route"
  >
    <div class="platform-module-card-top">
      <span class="platform-module-icon" :style="{ '--module-accent': module.visualColor }" aria-hidden="true">
        {{ module.icon }}
      </span>
      <span class="platform-status">{{ moduleStatusLabels[module.status] }}</span>
    </div>
    <h3>{{ module.name }}</h3>
    <p>{{ module.shortDescription }}</p>
    <span class="platform-module-card-link">Ver detalhes <span aria-hidden="true">→</span></span>
  </NuxtLink>
</template>
