<script setup lang="ts">
import { modules } from '~/data/modules'
const route = useRoute()
const module = computed(() => modules.find(item => item.id === route.params.slug))
if (!module.value) throw createError({ statusCode: 404, statusMessage: 'Módulo não encontrado' })
useSeoMeta({ title: () => (module.value?.name || 'Módulo') + ' · Fluxo Atento' })
</script>
<template><div class="container"><ModuleOverview v-if="module" :module="module" /></div></template>
