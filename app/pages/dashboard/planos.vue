<script setup lang="ts">
import { plans } from '~/data/plans'
definePageMeta({ layout: 'dashboard' })
useSeoMeta({ title: 'Planos e limites · Fluxo Atento', robots: 'noindex' })
const { dashboardPath } = useDeployment()
const auth = useAuth()
const config = useRuntimeConfig().public
type CatalogPlan = { id: string; name: string; price_cents: number; billing_interval: 'monthly' | 'yearly'; max_users: number | null; max_connections: number | null; gallery_storage_mb: number; trial_days: number; features: string[] }
const catalog = ref<CatalogPlan[]>([])
const catalogError = ref('')
const featureLabels: Record<string, string> = { monitoring: 'Páginas monitoradas', google_data: 'Dados Google', whatsapp_waba: 'WhatsApp Business', email_smtp: 'E-mail SMTP', campaigns: 'Campanhas', bulk_send: 'Envio em massa', gallery: 'Galeria', auto_responses: 'Respostas automáticas', ai_copilot: 'Copiloto de IA' }
const money = (cents: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100)
onMounted(async () => {
  try {
    const { data } = await auth.client()?.auth.getSession() || { data: { session: null } }
    if (!data.session) return
    const response = await fetch(String(config.apiBase).replace(/\/$/, '') + '/v1/plans', {
      headers: { Authorization: `Bearer ${data.session.access_token}` }, cache: 'no-store', signal: AbortSignal.timeout(20000)
    })
    if (!response.ok) throw new Error()
    catalog.value = (await response.json()).plans
  } catch { catalogError.value = 'O catálogo da sua empresa não está disponível agora.' }
})
const labels = ['Sites', 'URLs no total', 'Números de WhatsApp', 'Respostas da IA no atendimento', 'Envios de email marketing', 'Módulos previstos']
</script>
<template>
  <div><header class="page-heading"><div><p class="eyebrow">PLANOS E LIMITES</p><h1>Capacidade para cada momento.</h1><p>Uma plataforma, com recursos liberados conforme o plano e as conexões da sua empresa.</p></div></header>
    <section v-if="catalog.length" class="catalog-section"><div class="section-topline"><h2>Planos disponíveis para sua empresa</h2><span class="subtle-label">CATÁLOGO</span></div><div class="plan-comparison"><article v-for="plan in catalog" :key="plan.id" class="panel admin-form"><span class="ui-status">Catálogo · sem contratação online</span><h3>{{ plan.name }}</h3><p>{{ money(plan.price_cents) }} / {{ plan.billing_interval === 'monthly' ? 'mês' : 'ano' }}</p><dl class="capacity-list"><div><dt>Usuários</dt><dd>{{ plan.max_users ?? 'A definir' }}</dd></div><div><dt>Conexões</dt><dd>{{ plan.max_connections ?? 'A definir' }}</dd></div><div><dt>Galeria</dt><dd>{{ plan.gallery_storage_mb }} MB</dd></div><div><dt>Trial</dt><dd>{{ plan.trial_days ? `${plan.trial_days} dias` : 'Não incluído' }}</dd></div></dl><p v-if="plan.features.length" class="field-help">Inclui no catálogo: {{ plan.features.map(id => featureLabels[id] || id).join(', ') }}.</p><p class="field-help">Itens futuros listados não são ativados sem integração e permissão operacional.</p></article></div></section>
    <p v-if="catalogError" class="field-help" role="status">{{ catalogError }}</p>
    <div class="note-box"><strong>Proposta de capacidade — contratação ainda indisponível</strong><p>Os limites abaixo não são cotas ativas. A assinatura, a medição de consumo e o bloqueio de excedentes ainda precisam ser implementados no servidor. Custos dos provedores serão informados antes da ativação.</p></div>
    <div class="plan-comparison"><article v-for="plan in plans" :key="plan.id" class="panel admin-form"><span class="ui-status">Proposta</span><h2>{{ plan.name }}</h2><p>{{ plan.id === 'free' ? 'Para conhecer o fluxo.' : plan.id === 'essential' ? 'Para acompanhar seu crescimento.' : 'Para a rotina da equipe.' }}</p><dl class="capacity-list"><div v-for="limit in plan.limits.filter(item => labels.includes(item.label))" :key="limit.label"><dt>{{ limit.label === 'URLs no total' ? 'Páginas monitoradas' : limit.label }}</dt><dd>{{ limit.value }}</dd></div></dl></article></div>
    <section class="panel admin-form"><h2>Você escolhe o objetivo, não seis aplicativos.</h2><p>AdsGuard acompanha páginas e campanhas; LeadRadar organiza interessados; RecuperaIA ajuda a retomar conversas; AtendeScore acompanha atendimentos. ContratoVivo e CompraCerta ampliam a organização quando fizer sentido.</p><p>O acesso a cada ferramenta depende do plano, da permissão do usuário e das fontes de dados necessárias. Conectar uma conta não inicia campanhas nem contrata serviços automaticamente.</p><NuxtLink :to="dashboardPath('/dashboard/canais')" class="button button-secondary">Entender as integrações <UIcon name="i-lucide-arrow-right" /></NuxtLink></section>
  </div>
</template>
