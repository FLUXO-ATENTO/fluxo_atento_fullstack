<script setup lang="ts">
import { Globe2, Radar, ScanLine, CircleAlert, ArrowUpRight, Check, Clock3, CheckCheck, Inbox } from '@lucide/vue'
import { scenarios, type ScenarioId } from '~/data/experience'
definePageMeta({ layout: 'demo' })
useSeoMeta({ title: 'Seu espaço · Fluxo Atento', robots: 'noindex, nofollow' })
const route = useRoute()
const { monitors, alerts, activity, resolved, resolve, toggleMonitor } = useDemoWorkspace()
const siteCount = computed(() => new Set(monitors.value.map(item => new URL(item.url).hostname)).size)
const filter = ref('all')
const filters = [{ id: 'all', label: 'Todos' }, { id: 'pending', label: 'Para revisar' }, { id: 'resolved', label: 'Revisados' }]
const visible = computed(() => alerts.value.filter(item => filter.value === 'all' || (filter.value === 'resolved' ? item.resolved : !item.resolved)))
const selectedId = ref<ScenarioId>('tracking')
const detailOpen = ref(false)
const selected = computed(() => alerts.value.find(item => item.id === selectedId.value)!)
const fromStory = computed(() => scenarios.find(item => item.id === route.query.scenario))
function openDetail(id: ScenarioId) { selectedId.value = id; detailOpen.value = true }
function markReviewed() { resolve(selectedId.value); detailOpen.value = false }
onMounted(() => { if (fromStory.value) openDetail(fromStory.value.id) })
</script>
<template>
  <div>
    <div class="page-heading"><div><p class="eyebrow">UM OLHAR PARA O SEU NEGÓCIO</p><h1>O que merece sua atenção?</h1><p>Comece pelos sinais. Você não precisa escolher um módulo agora.</p></div><AddMonitor /></div>
    <div class="metrics-grid">
      <article class="metric-card"><span>Sites no exemplo <Globe2 :size="15" /></span><strong>{{ String(siteCount).padStart(2, '0') }}</strong><small>Sem acessar endereços reais</small></article>
      <article class="metric-card"><span>Monitores habilitados <Radar :size="15" /></span><strong>{{ String(monitors.filter(item => item.enabled).length).padStart(2, '0') }}</strong><small>Apenas nesta sessão</small></article>
      <article class="metric-card attention"><span>Para revisar <CircleAlert :size="15" /></span><strong>{{ String(alerts.length - resolved.length).padStart(2, '0') }}</strong><small>Pontos de atenção ilustrativos</small></article>
      <article class="metric-card"><span>Revisados por você <CheckCheck :size="15" /></span><strong>{{ String(resolved.length).padStart(2, '0') }}</strong><small>Sem alterar o site de origem</small></article>
    </div>
    <div class="dashboard-columns">
      <section class="panel"><div class="panel-heading"><div><h2>Primeiro, olhe para estes sinais</h2><p>Abra um item para entender o contexto e a próxima ação.</p></div><span class="demo-badge">Exemplo</span></div>
        <div class="filter-bar" aria-label="Filtrar sinais"><button v-for="item in filters" :key="item.id" :aria-pressed="filter === item.id" @click="filter = item.id">{{ item.label }} <span v-if="item.id === 'pending'">· {{ alerts.length - resolved.length }}</span></button></div>
        <button v-for="item in visible" :key="item.id" class="signal-item" @click="openDetail(item.id)"><span class="feature-icon"><Check v-if="item.resolved" :size="17" /><ScanLine v-else :size="17" /></span><span><strong>{{ item.signal }}</strong><small>{{ item.source }}</small></span><span class="signal-meta"><span class="status-pill" :class="{ resolved: item.resolved }">{{ item.resolved ? 'Revisado' : 'Para revisar' }}</span><span>{{ item.time }} <ArrowUpRight :size="10" style="display:inline" /></span></span></button>
        <div v-if="!visible.length" class="empty-state"><Inbox :size="28" /><h3>{{ filter === 'resolved' ? 'Nenhum sinal revisado ainda' : 'Tudo revisado por aqui' }}</h3><p>{{ filter === 'resolved' ? 'Abra um sinal e marque como revisado para experimentar.' : 'Você concluiu os itens deste exemplo.' }}</p></div>
      </section>
      <section class="panel"><div class="panel-heading"><div><h2>Uma mudança no caminho</h2><p>Exemplo de respostas de uma integração</p></div><Clock3 :size="15" /></div><div class="chart-wrap"><svg viewBox="0 0 320 165" role="img" aria-label="Gráfico ilustrativo: respostas estáveis às 8h, falha às 14h e recuperação às 18h"><path class="chart-grid" d="M0 30H320M0 75H320M0 120H320"/><path d="M0 65L24 64L45 66L70 64L94 66L120 65L144 63L165 105L185 118L209 115L231 91L250 62L274 65L296 63L320 64L320 150H0Z" fill="#eaa1760a"/><path d="M0 65L24 64L45 66L70 64L94 66L120 65L144 63L165 105L185 118L209 115L231 91L250 62L274 65L296 63L320 64" fill="none" stroke="#eaa176" stroke-width="2"/><circle cx="185" cy="118" r="4" fill="#eaa176"/><path d="M185 118V15" stroke="#eaa17644" stroke-dasharray="3 3"/><rect x="148" y="3" width="78" height="23" rx="5" fill="#27211d" stroke="#5d4939"/><text x="187" y="18" text-anchor="middle" fill="#eaa176" font-size="9" font-family="sans-serif">Falha observada</text></svg><div class="chart-labels"><span>08h</span><span>12h</span><span>14h</span><span>18h</span></div></div><div class="chart-legend"><span class="small-dot" /> Série ilustrativa · não representa seu site</div></section>
    </div>
    <div class="lower-panels">
      <section class="panel"><div class="panel-heading"><div><h2>O que está no seu radar</h2><p>Experimente pausar e reativar um monitor.</p></div><NuxtLink class="text-link" to="/exemplo/monitores">Ver todos <ArrowUpRight :size="13" /></NuxtLink></div><div v-for="monitor in monitors.slice(0, 3)" :key="monitor.id" class="monitor-row"><Globe2 :size="17" /><div><strong>{{ monitor.name }}</strong><small>{{ monitor.url.replace('https://', '') }}</small></div><USwitch :model-value="monitor.enabled" :aria-label="(monitor.enabled ? 'Pausar' : 'Ativar') + ' monitor ' + monitor.name" @update:model-value="toggleMonitor(monitor.id)" /></div></section>
      <section class="panel"><div class="panel-heading"><div><h2>Seu caminho até aqui</h2><p>Ações feitas nesta demonstração</p></div></div><ul class="activity-list"><li v-for="(item,index) in activity.slice(0,3)" :key="index"><div>{{ item }}<small>Nesta sessão</small></div></li><li><div>Demonstração pronta para explorar<small>Dados de exemplo carregados, sem conectar contas.</small></div></li></ul></section>
    </div>
    <UModal v-model:open="detailOpen" :title="selected.signal" description="Entenda a evidência antes de tomar uma decisão. Este é um exemplo, não uma análise real.">
      <template #body><span class="status-pill" :class="{ resolved: selected.resolved }">{{ selected.resolved ? 'Revisado' : 'Para revisar' }}</span><div class="detail-evidence"><p class="mono">O QUE FOI OBSERVADO NO EXEMPLO</p><p>{{ selected.evidence }}</p><div class="detail-comparison"><div>Antes<strong>{{ selected.before }}</strong></div><div>Agora<strong>{{ selected.after }}</strong></div></div></div><h3 style="font-size:16px;margin-bottom:10px">{{ selected.action }}</h3><p class="modal-copy">{{ selected.detail }}</p></template>
      <template #footer><button class="button button-primary" :disabled="selected.resolved" @click="markReviewed"><Check :size="16" />{{ selected.resolved ? 'Já revisado' : 'Marcar como revisado' }}</button><button class="button button-secondary" @click="detailOpen = false">Fechar</button></template>
    </UModal>
  </div>
</template>
