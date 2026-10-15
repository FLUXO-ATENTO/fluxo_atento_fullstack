<script setup lang="ts">
import { googleAuthorizationUrl, googleConnectionLabel, googleReturnMessage, googleDisconnectMessage, type GoogleConnectionStatus, type GoogleResources, type GoogleDisconnectResult } from '~/utils/google-integration'
const api = useGoogleApi(); const workspace = useWorkspace(); const route = useRoute(); const router = useRouter()
const { dashboardPath } = useDeployment()
const status = ref<GoogleConnectionStatus | null>(null)
const resources = ref<GoogleResources | null>(null)
const loading = ref(false); const busy = ref(false); const error = ref(''); const notice = ref('')
const connectOpen = ref(false); const disconnectOpen = ref(false)
let loadVersion = 0
const canManage = computed(() => ['owner', 'admin'].includes(workspace.activeTenant.value?.role || ''))
const connected = computed(() => status.value?.connection?.status === 'connected')
const partial = computed(() => Boolean(resources.value?.errors?.analytics || resources.value?.errors?.search_console))
const formatDate = (value?: string | null) => value && Number.isFinite(Date.parse(value)) ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : 'Não consultado'
async function load() {
  const version = ++loadVersion
  loading.value = true; error.value = ''; resources.value = null
  try {
    const current = await api<GoogleConnectionStatus>('/v1/integrations/google')
    if (version === loadVersion) status.value = current
  }
  catch (cause) { if (version === loadVersion) { status.value = null; error.value = cause instanceof Error ? cause.message : 'Não foi possível consultar a conexão.' } }
  finally { if (version === loadVersion) loading.value = false }
}
async function authorize() {
  if (busy.value || !canManage.value || !status.value?.available) return
  busy.value = true; error.value = ''
  try {
    const result = await api<{ authorization_url: string }>('/v1/integrations/google/authorize', { method: 'POST', body: '{}' })
    const url = googleAuthorizationUrl(result.authorization_url)
    if (!url) throw new Error('O endereço de autorização não pôde ser confirmado. Nenhuma conta foi conectada.')
    await navigateTo(url, { external: true })
  } catch (cause) { error.value = cause instanceof Error ? cause.message : 'Não foi possível iniciar a autorização.'; busy.value = false }
}
async function discover() {
  if (busy.value || !canManage.value) return
  busy.value = true; error.value = ''; resources.value = null
  try { resources.value = await api<GoogleResources>('/v1/integrations/google/resources') }
  catch (cause) { error.value = cause instanceof Error ? cause.message : 'Não foi possível consultar as fontes.' }
  finally { busy.value = false }
}
async function disconnect() {
  if (busy.value || !canManage.value) return
  busy.value = true; error.value = ''; notice.value = ''
  try {
    const result = await api<GoogleDisconnectResult>('/v1/integrations/google/disconnect', { method: 'POST', body: '{}' })
    disconnectOpen.value = false
    notice.value = googleDisconnectMessage(result)
    await load()
  } catch (cause) { error.value = cause instanceof Error ? cause.message : 'Não foi possível desconectar.' }
  finally { busy.value = false }
}
watch(() => workspace.activeTenant.value?.id, (next, previous) => {
  if (previous && next !== previous) { status.value = null; resources.value = null; connectOpen.value = false; disconnectOpen.value = false; notice.value = ''; void load() }
})
onMounted(() => {
  notice.value = googleReturnMessage(route.query.google)
  if ('google' in route.query) { const query = { ...route.query }; delete query.google; void router.replace({ query }) }
  void load()
})
</script>
<template>
  <section class="panel google-provider-panel" aria-labelledby="google-tenant-title">
    <header class="section-topline"><div><p class="eyebrow">LEITURA DE DADOS · GOOGLE</p><h2 id="google-tenant-title">Do interesse na busca à visita no site.</h2></div><span class="ui-status">{{ loading ? 'Consultando…' : googleConnectionLabel(status) }}</span></header>
    <p>Conecte a conta que tem acesso ao seu Google Analytics e Search Console. Entrar no Fluxo Atento com Google não faz essa conexão automaticamente.</p>
    <div class="google-purpose-grid"><article><span class="feature-icon"><UIcon name="i-lucide-chart-pie" /></span><h3>Google Analytics (GA4)</h3><p>Descubra as propriedades que sua conta pode consultar. Relatórios de visitas e conversões serão a próxima etapa.</p></article><article><span class="feature-icon"><UIcon name="i-lucide-search" /></span><h3>Search Console</h3><p>Identifique os sites autorizados para analisar a presença na busca. A conexão não modifica seu site.</p></article></div>
    <p v-if="error" class="form-error" role="alert">{{ error }}</p><p v-if="notice" class="live-notice" role="status">{{ notice }}</p>
    <p v-if="status && !status.available" class="field-help">A Fluxo Atento ainda precisa concluir ou liberar o provedor. Você não precisa criar uma chave de API.</p>
    <p v-if="!canManage" class="field-help">Peça ao responsável pela empresa para conectar ou gerenciar estas fontes.</p>
    <details class="inline-help"><summary>O que será autorizado e como funciona?</summary><ol><li>Confirme a empresa: <strong>{{ workspace.activeTenant.value?.name || 'seu espaço atual' }}</strong>.</li><li>Escolha sua conta na tela oficial do Google e revise as permissões de leitura.</li><li>Ao voltar, consulte as fontes para confirmar quais propriedades e sites estão disponíveis.</li></ol><p>Não pedimos acesso a Gmail, Drive ou Calendar. Esta etapa não altera campanhas, não configura anúncios e não ativa o BigQuery.</p><p>Uma empresa usa uma conexão Google nesta primeira versão. Para usar outra conta, revise e desconecte a atual antes de conectar novamente.</p></details>
    <div class="google-actions"><button v-if="canManage && status?.available && !connected" class="button button-primary" :disabled="busy || loading" @click="connectOpen = true"><UIcon name="i-lucide-plug" />{{ status.connection ? 'Autorizar novamente' : 'Conectar Google' }}</button><button v-if="canManage && connected && status?.available" class="button button-primary" :disabled="busy || loading" @click="discover">{{ busy ? 'Consultando…' : 'Consultar fontes autorizadas' }}</button><button class="button button-secondary" :disabled="busy || loading" @click="load"><UIcon name="i-lucide-refresh-cw" />Atualizar situação</button><button v-if="canManage && status?.connection" class="button button-secondary" :disabled="busy || loading" @click="disconnectOpen = true">Desconectar</button><NuxtLink :to="dashboardPath('/dashboard/ajuda')" class="text-link">Preciso de orientação</NuxtLink></div>
    <div v-if="resources" class="google-resources" aria-live="polite"><div class="section-topline"><h3>{{ partial ? 'Consulta parcialmente concluída' : 'Fontes consultadas' }}</h3><small>{{ formatDate(resources.checked_at) }}</small></div><p class="field-help">Esta é a lista de fontes acessíveis, não um relatório de desempenho. Nenhum dado de campanhas foi alterado.</p><p v-if="resources.truncated" class="field-help">Há mais fontes do que o limite desta consulta. A lista abaixo está parcial.</p><div class="google-purpose-grid"><article><h4>Propriedades GA4</h4><p v-if="resources.errors?.analytics" class="form-error">Não foi possível consultar o Analytics. Confira o acesso e tente novamente.</p><p v-else-if="!resources.analytics.length">Nenhuma propriedade foi retornada para esta conta.</p><ul v-else class="google-resource-list"><li v-for="item in resources.analytics" :key="item.id"><strong>{{ item.name }}</strong><small>{{ item.account_name }} · {{ item.id }}</small></li></ul></article><article><h4>Sites no Search Console</h4><p v-if="resources.errors?.search_console" class="form-error">Não foi possível consultar o Search Console. Confira o acesso e tente novamente.</p><p v-else-if="!resources.search_console.length">Nenhum site foi retornado para esta conta.</p><ul v-else class="google-resource-list"><li v-for="item in resources.search_console" :key="item.id"><strong>{{ item.name }}</strong><small>{{ item.id }}</small></li></ul></article></div></div>
    <UModal v-model:open="connectOpen" title="Conectar dados Google?" description="Você vai revisar as permissões no próprio Google." :ui="{ content: 'workspace-dialog' }"><template #body><p>Esta autorização ficará vinculada à empresa <strong>{{ workspace.activeTenant.value?.name }}</strong>. O Fluxo Atento solicitará leitura de Analytics e Search Console; não receberá sua senha Google.</p><p>Autorize somente uma conta que você pode usar em nome desta empresa. Você poderá desconectar depois.</p><p v-if="error" class="form-error" role="alert">{{ error }}</p></template><template #footer><div class="dialog-actions"><button class="button button-secondary" :disabled="busy" @click="connectOpen = false">Agora não</button><button class="button button-primary" :disabled="busy" @click="authorize">{{ busy ? 'Preparando…' : 'Continuar no Google' }}<UIcon name="i-lucide-arrow-up-right" /></button></div></template></UModal>
    <UModal v-model:open="disconnectOpen" title="Desconectar Google desta empresa?" description="A leitura por esta conexão será interrompida." :ui="{ content: 'workspace-dialog' }"><template #body><p>Vamos remover a conexão da empresa <strong>{{ workspace.activeTenant.value?.name }}</strong> e solicitar a revogação no Google.</p><p>O Google pode revogar também outras autorizações desta mesma conta para o aplicativo Fluxo Atento. Outras empresas conectadas por ela e um futuro login com Google podem pedir novo consentimento. Nenhuma conta ou empresa será excluída.</p><p v-if="error" class="form-error" role="alert">{{ error }}</p></template><template #footer><div class="dialog-actions"><button class="button button-secondary" :disabled="busy" @click="disconnectOpen = false">Manter conexão</button><button class="button button-primary" :disabled="busy" @click="disconnect">{{ busy ? 'Desconectando…' : 'Confirmar desconexão' }}</button></div></template></UModal>
  </section>
</template>
