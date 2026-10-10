<script setup lang="ts">
import { modules } from '~/data/modules'
useSeoMeta({ title: 'Módulos para sua rotina · Fluxo Atento' })
</script>
<template><div class="container page-section"><div class="page-hero"><p class="eyebrow">COMECE PELA SUA NECESSIDADE</p><h1>Você cuida do negócio.<br>Os nomes vêm depois.</h1><p>Escolha a situação que parece com a sua rotina para conhecer a proposta. Você não precisa montar um pacote de módulos para explorar a plataforma.</p></div><p class="pricing-notice">Todos os módulos estão em fase inicial. Os textos abaixo descrevem o escopo proposto, não serviços disponíveis para contratação.</p><div class="platform-module-grid"><ModuleCard v-for="module in modules" :key="module.id" :module="module" /></div><div style="margin-top:35px"><NuxtLink to="/dashboard" class="button button-primary">Prefiro conhecer pelo exemplo →</NuxtLink></div></div></template>
