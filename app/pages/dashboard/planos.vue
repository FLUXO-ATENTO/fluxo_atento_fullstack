<script setup lang="ts">
import { plans } from '~/data/plans'
definePageMeta({ layout: 'dashboard' })
useSeoMeta({ title: 'Planos e limites · Fluxo Atento', robots: 'noindex' })
const { dashboardPath } = useDeployment()
const labels = ['Sites', 'URLs no total', 'Números de WhatsApp', 'Respostas da IA no atendimento', 'Envios de email marketing', 'Módulos previstos']
</script>
<template>
  <div><header class="page-heading"><div><p class="eyebrow">PLANOS E LIMITES</p><h1>Capacidade para cada momento.</h1><p>Uma plataforma, com recursos liberados conforme o plano e as conexões da sua empresa.</p></div></header>
    <div class="note-box"><strong>Proposta de capacidade — contratação ainda indisponível</strong><p>Os limites abaixo não são cotas ativas. A assinatura, a medição de consumo e o bloqueio de excedentes ainda precisam ser implementados no servidor. Custos dos provedores serão informados antes da ativação.</p></div>
    <div class="plan-comparison"><article v-for="plan in plans" :key="plan.id" class="panel admin-form"><span class="ui-status">Proposta</span><h2>{{ plan.name }}</h2><p>{{ plan.id === 'free' ? 'Para conhecer o fluxo.' : plan.id === 'essential' ? 'Para acompanhar seu crescimento.' : 'Para a rotina da equipe.' }}</p><dl class="capacity-list"><div v-for="limit in plan.limits.filter(item => labels.includes(item.label))" :key="limit.label"><dt>{{ limit.label === 'URLs no total' ? 'Páginas monitoradas' : limit.label }}</dt><dd>{{ limit.value }}</dd></div></dl></article></div>
    <section class="panel admin-form"><h2>Você escolhe o objetivo, não seis aplicativos.</h2><p>AdsGuard acompanha páginas e campanhas; LeadRadar organiza interessados; RecuperaIA ajuda a retomar conversas; AtendeScore acompanha atendimentos. ContratoVivo e CompraCerta ampliam a organização quando fizer sentido.</p><p>O acesso a cada ferramenta depende do plano, da permissão do usuário e das fontes de dados necessárias. Conectar uma conta não inicia campanhas nem contrata serviços automaticamente.</p><NuxtLink :to="dashboardPath('/dashboard/canais')" class="button button-secondary">Entender as integrações <UIcon name="i-lucide-arrow-right" /></NuxtLink></section>
  </div>
</template>
