<script setup lang="ts">
import { modules } from '~/data/modules'
definePageMeta({ layout: 'dashboard' })
useSeoMeta({ title: 'Módulos · Seu espaço Fluxo Atento', robots: 'noindex' })
</script>
<template><div><div class="page-heading"><div><p class="eyebrow">FERRAMENTAS PARA A SUA ROTINA</p><h1>Comece pelo que precisa.</h1><p>Conheça os escopos propostos. Os seis módulos estão em modo inicial.</p></div></div><div class="platform-module-grid"><ModuleCard v-for="module in modules" :key="module.id" :module="module" dashboard /></div></div></template>
