<script setup lang="ts">
import { Globe2, Plus, RefreshCw, Play, CircleAlert, ShieldCheck, Clock3 } from '@lucide/vue'
import { normalizeWebsiteUrl } from '~/utils/website'
const { monitors, loading, error, busy, load, add, check, toggle } = useMonitors()
const address = ref(''); const validation = ref(''); const notice = ref('')
const selected = ref<string | null>(null)
const history = computed(() => monitors.value.find(item => item.id === selected.value))
const sites = computed(() => new Set(monitors.value.map(item => item.hostname)).size)
const attention = computed(() => monitors.value.filter(item => item.checks[0] && item.checks[0].status !== 'ok').length)
const statusText = (status?: string) => status === 'ok' ? 'Respondeu' : status === 'attention' ? 'Confira a resposta' : status === 'failed' ? 'Verificação incompleta' : 'Ainda não verificado'
const formatDate = (date: string) => new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(date))
async function submit() {
  const result = normalizeWebsiteUrl(address.value)
  if (!result.valid) { validation.value = result.message; return }
  validation.value = ''; notice.value = ''
  if (await add(result.url)) { address.value = ''; notice.value = 'Página cadastrada. Clique em Verificar agora para fazer a primeira consulta.' }
}
async function verify(id: string) { notice.value = ''; if (await check(id)) notice.value = 'Verificação concluída e resultado salvo. Confira os detalhes abaixo.' }
</script>
<template>
  <div>
    <div class="page-heading"><div><p class="eyebrow">SEU SITE, SEM ACHISMO</p><h1>Veja como sua página responde.</h1><p>Cadastre uma página do seu negócio e faça uma verificação quando precisar.</p></div><button class="button button-secondary" :disabled="loading || Boolean(busy)" @click="load"><RefreshCw :size="16" /> Atualizar</button></div>
    <div class="metrics-grid live-metrics"><article class="metric-card"><span>Sites cadastrados <Globe2 :size="15" /></span><strong>{{ loading ? '—' : sites }}</strong><small>Somente os dados da sua conta</small></article><article class="metric-card"><span>Páginas no seu radar <ShieldCheck :size="15" /></span><strong>{{ loading ? '—' : monitors.length }}</strong><small>Até duas páginas nesta etapa</small></article><article class="metric-card"><span>Para conferir <CircleAlert :size="15" /></span><strong>{{ loading ? '—' : attention }}</strong><small>Baseado na última consulta</small></article></div>
    <section class="panel live-add"><h2>Comece por uma página importante.</h2><p>Use apenas endereços públicos de sites que você administra. Não inclua senhas ou dados de clientes.</p><form class="live-add-form" @submit.prevent="submit"><div class="field"><label for="live-url">Endereço da página</label><input id="live-url" v-model="address" inputmode="url" autocomplete="url" required maxlength="2048" placeholder="sualoja.com.br/contato" :disabled="Boolean(busy)" :aria-invalid="Boolean(validation)" aria-describedby="live-url-hint" @input="validation = ''"><small id="live-url-hint">Uma conta, um site e até duas páginas. Os planos pagos ainda não estão ativos.</small></div><button class="button button-primary" type="submit" :disabled="Boolean(busy) || loading"><Plus :size="16" />{{ busy === 'add' ? 'Cadastrando…' : 'Cadastrar página' }}</button></form><p v-if="validation" class="form-error" role="alert">{{ validation }}</p></section>
    <div v-if="error" class="live-error" role="alert"><CircleAlert :size="20" /><div><strong>Não foi possível concluir.</strong><p>{{ error }}</p><button class="text-link" :disabled="loading || Boolean(busy)" @click="load">Tentar conectar novamente</button></div></div>
    <p v-if="notice" class="live-notice" role="status">{{ notice }}</p>
    <section class="panel" :aria-busy="loading">
      <div class="panel-heading"><div><h2>Suas páginas</h2><p>Resultados reais, com o horário de cada consulta.</p></div><Clock3 :size="17" /></div>
      <div v-if="loading && !monitors.length" class="empty-state" role="status">Carregando suas páginas…</div>
      <div v-else-if="!monitors.length && !error" class="empty-state"><Globe2 :size="30" /><h3>Seu radar começa aqui.</h3><p>Cadastre uma página acima. Nenhum resultado será criado antes da primeira verificação.</p></div>
      <article v-for="monitor in monitors" :key="monitor.id" class="live-monitor">
        <div class="live-monitor-heading"><div><h3>{{ monitor.name }}</h3><p class="mono live-url">{{ monitor.url }}</p></div><span class="status-pill" :class="{ resolved: monitor.checks[0]?.status === 'ok' }">{{ !monitor.enabled ? 'Pausado' : statusText(monitor.checks[0]?.status) }}</span></div>
        <p>{{ monitor.checks[0]?.detail || 'Ainda não há resultados para esta página.' }}</p>
        <small v-if="monitor.checks[0]">{{ formatDate(monitor.checks[0].checked_at) }} · {{ monitor.checks[0].duration_ms }} ms<span v-if="monitor.checks[0].http_status"> · HTTP {{ monitor.checks[0].http_status }}</span></small>
        <div class="live-monitor-actions"><button class="button button-primary button-small" :disabled="Boolean(busy) || !monitor.enabled" @click="verify(monitor.id)"><Play :size="14" />{{ busy === monitor.id ? 'Aguarde…' : 'Verificar agora' }}</button><button class="button button-secondary button-small" :disabled="Boolean(busy)" @click="toggle(monitor)">{{ monitor.enabled ? 'Pausar' : 'Reativar' }}</button><button class="text-link" :disabled="!monitor.checks.length" @click="selected = monitor.id">Ver histórico</button></div>
      </article>
    </section>
    <p class="section-note"><ShieldCheck :size="16" />Nesta etapa, a consulta verifica a resposta HTTP da página. Não testa compras, formulários ou mensagens. As verificações são manuais, sem agendamento automático.</p>
    <UModal :open="Boolean(history)" title="Histórico da página" description="Últimas verificações salvas para este endereço." @update:open="value => { if (!value) selected = null }"><template #body><ul class="activity-list"><li v-for="item in history?.checks" :key="item.id"><div><strong>{{ statusText(item.status) }}</strong><p>{{ item.detail }}</p><small>{{ formatDate(item.checked_at) }} · {{ item.duration_ms }} ms</small></div></li></ul></template></UModal>
  </div>
</template>
