<script setup lang="ts">
import type { WorkspaceGroup } from '~/data/workspace-navigation'
defineProps<{ groups: WorkspaceGroup[]; activePath: string }>()
defineEmits<{ navigate: [] }>()
const { dashboardPath } = useDeployment()
</script>
<template>
  <nav class="workspace-navigation" aria-label="Navegação do painel">
    <section v-for="group in groups" :key="group.label">
      <h2 class="nav-section-label">{{ group.label }}</h2>
      <NuxtLink v-for="item in group.items" :key="item.path" :to="dashboardPath(item.path)" :aria-current="activePath === dashboardPath(item.path) ? 'page' : undefined" :class="{ active: activePath === dashboardPath(item.path) }" @click="$emit('navigate')">
        <UIcon :name="item.icon" aria-hidden="true" /><span>{{ item.label }}</span>
        <span v-if="item.planned" class="planned-dot" title="Recurso em preparação"><span class="sr-only">Em preparação</span></span>
      </NuxtLink>
    </section>
  </nav>
</template>
