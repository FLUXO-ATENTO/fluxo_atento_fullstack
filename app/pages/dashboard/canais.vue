<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })
useSeoMeta({ title: 'Integrações · Fluxo Atento', robots: 'noindex' })
const auth = useAuth(); const workspace = useWorkspace(); const config = useRuntimeConfig().public
const { dashboardPath } = useDeployment()
const loading = ref(true); const error = ref('')
const connections = ref<{ id: string; channel: string; status: string }[]>([])
const integrations = [
  { id: 'meta_ads', name: 'Meta Ads', icon: 'i-lucide-megaphone', purpose: 'Entender campanhas do Facebook e Instagram.', needs: 'Uma conta com acesso à conta de anúncios da sua empresa.', available: false },
  { id: 'google_ads', name: 'Google Ads', icon: 'i-lucide-chart-column-increasing', purpose: 'Acompanhar anúncios, investimento e conversões.', needs: 'Uma conta com acesso aos anúncios que deseja analisar.', available: false },
  { id: 'whatsapp_waba', name: 'WhatsApp Business', icon: 'i-lucide-messages-square', purpose: 'Reunir atendimento e conversas autorizadas.', needs: 'Um provedor validado pela Fluxo Atento e um número autorizado da sua empresa.', available: true },
  { id: 'email_smtp', name: 'E-mail', icon: 'i-lucide-mail', purpose: 'Preparar o canal de e-mail da sua empresa.', needs: 'Um provedor de envio configurado e remetente validado.', available: true }
]
function status(id: string, available: boolean) {
  if (!available) return 'Em desenvolvimento'
  if (loading.value) return 'Consultando…'
  if (error.value) return 'Não foi possível consultar'
  const connection = connections.value.find(item => item.channel === id)
  const labels: Record<string, string> = { pending: 'Configuração pendente', configured: 'Aguardando validação', validated: 'Validada no cadastro', disabled: 'Desativada', error: 'Precisa de atenção' }
  return connection ? labels[connection.status] || 'Status não reconhecido' : 'Não conectada'
}
async function load() {
  loading.value = true; error.value = ''
  const identity = auth.user.value?.id
  try {
    const tenant = await workspace.ensure()
    const { data } = await auth.client()!.auth.getSession()
    if (!tenant || !data.session) throw new Error()
    const response = await fetch(String(config.apiBase).replace(/\/$/, '') + '/v1/integrations', { cache: 'no-store', signal: AbortSignal.timeout(15000), headers: { Authorization: 'Bearer ' + data.session.access_token, 'X-Fluxo-Tenant-Id': tenant.id } })
    if (!response.ok) throw new Error()
    const result = await response.json()
    if (auth.user.value?.id === identity) connections.value = result.connections
  } catch { error.value = 'Não conseguimos consultar suas conexões agora. Tente novamente.' }
  finally { loading.value = false }
}
onMounted(load)
</script>
<template>
  <div><header class="page-heading"><div><p class="eyebrow">CONEXÕES DA SUA EMPRESA</p><h1>Conecte os dados. Encontre o contexto.</h1><p>Cada conexão tem uma finalidade. Você escolhe as contas e confere as permissões antes de autorizar.</p></div><button class="button button-secondary" :disabled="loading" @click="load"><UIcon name="i-lucide-refresh-cw" />Atualizar situação</button></header>
    <details class="panel help-article"><summary><span><strong>Como funciona esta página?</strong><small>Saiba o que precisa conectar, sem configurar chaves.</small></span><UIcon name="i-lucide-circle-help" /></summary><div class="help-article-body"><ol><li>Encontre a fonte de dados da ferramenta que deseja usar.</li><li>Confira os requisitos. A conexão de uma conta não concede acesso a outras.</li><li>Quando a autorização estiver liberada, ela acontecerá no ambiente do próprio provedor.</li><li>Aguarde a validação e a sincronização. Cadastrar uma conexão não é o mesmo que ter dados prontos.</li></ol><p>Nunca envie senhas, tokens ou chaves no suporte. Os recursos em desenvolvimento ainda não têm botão de autorização.</p></div></details>
    <p v-if="error" role="alert" class="form-error">{{ error }}</p>
    <GoogleTenantPanel />
    <div class="roadmap-grid integration-cards"><article v-for="item in integrations" :key="item.id" class="panel admin-form"><div class="section-topline"><span class="feature-icon"><UIcon :name="item.icon" /></span><span class="ui-status">{{ status(item.id, item.available) }}</span></div><h2>{{ item.name }}</h2><p>{{ item.purpose }}</p><details class="inline-help"><summary>O que eu preciso para conectar?</summary><p>{{ item.needs }}</p><p>{{ item.available ? 'O cadastro de canais já existe, mas o assistente de conexão e a operação de mensagens ainda precisam ser concluídos.' : 'A conexão desta fonte ainda está em desenvolvimento. Não há autorização nem sincronização ativa nesta tela.' }}</p></details><NuxtLink :to="dashboardPath('/dashboard/ajuda')" class="text-link">Preciso de orientação <UIcon name="i-lucide-arrow-right" /></NuxtLink></article></div>
  </div>
</template>
