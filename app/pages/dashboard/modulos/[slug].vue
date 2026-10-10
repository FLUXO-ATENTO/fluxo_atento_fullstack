<script setup lang="ts">
import { modules } from '~/data/modules'
definePageMeta({ layout: 'dashboard' })
const route = useRoute()
const module = computed(() => modules.find(item => item.id === route.params.slug))
if (!module.value) throw createError({ statusCode: 404, statusMessage: 'Módulo não encontrado' })
useSeoMeta({ title: () => (module.value?.name || 'Módulo') + ' · Seu espaço', robots: 'noindex' })
</script>
<template><ModuleOverview v-if="module" :module="module" dashboard /></template>
