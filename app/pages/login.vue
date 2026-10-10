<script setup lang="ts">
import { ArrowRight, LockKeyhole } from '@lucide/vue'
useSeoMeta({ title: 'Acesso · Fluxo Atento' })
</script>
<template><div class="container narrow-content"><p class="eyebrow">SEU ESPAÇO NO FLUXO ATENTO</p><h1>Conheça antes de criar uma conta.</h1><p>A área de acesso está em preparação. Você já pode explorar o exemplo, sem informar e-mail, senha ou dados de clientes.</p><NuxtLink to="/dashboard" class="button button-primary">Entrar na demonstração <ArrowRight :size="16" /></NuxtLink><InitialState title="Acesso real em modo inicial" description="Não estamos recebendo cadastros por esta tela. A integração de autenticação precisa ser concluída e validada antes de abrir contas." :next-steps="['Login e recuperação de acesso', 'Proteção dos dados por empresa', 'Termos e política de privacidade revisados']" /></div></template>
