<script setup lang="ts">
const props = defineProps<{ platformArea?: boolean }>()
const open = defineModel<boolean>('open', { default: false })
const auth = useAuth()
const config = useRuntimeConfig().public
const { dashboardPath } = useDeployment()
type Tenant = { id: string; name: string }
type Message = { id: string; tenant_id: string; sender_id: string; sender_platform: boolean; body: string; created_at: string }
const tenants = ref<Tenant[]>([])
const activeTenantId = ref('')
const messages = ref<Message[]>([])
const draft = ref('')
const loading = ref(false)
const sending = ref(false)
const error = ref('')
let poller: ReturnType<typeof setInterval> | undefined
const channelReady = computed(() => !props.platformArea || Boolean(activeTenantId.value))
const endpoint = computed(() => props.platformArea
  ? `/v1/admin/support/${activeTenantId.value}/messages`
  : '/v1/support/messages')
async function request(path: string, init: RequestInit = {}) {
  const client = auth.client()
  const { data } = await client?.auth.getSession() || { data: { session: null } }
  if (!data.session) throw new Error('Sua sessão terminou. Entre novamente.')
  const response = await fetch(String(config.apiBase).replace(/\/$/, '') + path, {
    ...init, cache: 'no-store', signal: AbortSignal.timeout(20000),
    headers: { Authorization: `Bearer ${data.session.access_token}`, ...(init.body ? { 'Content-Type': 'application/json' } : {}) }
  })
  if (!response.ok) throw new Error('Não foi possível acessar o chat agora.')
  return response.json()
}
async function loadDirectory() {
  if (!props.platformArea) return
  try {
    const payload = await request('/v1/admin/tenants') as { tenants: Tenant[] }
    tenants.value = payload.tenants
    if (activeTenantId.value && !tenants.value.some(tenant => tenant.id === activeTenantId.value)) activeTenantId.value = ''
  } catch { error.value = 'Não foi possível consultar as empresas agora.' }
}
async function loadMessages(silent = false) {
  if (!open.value || !channelReady.value || document.visibilityState !== 'visible') return
  if (!silent) loading.value = true
  try {
    const payload = await request(endpoint.value) as { messages: Message[] }
    messages.value = payload.messages
    error.value = ''
  } catch { if (!silent) error.value = 'Não foi possível carregar esta conversa. Tente novamente.' }
  finally { loading.value = false }
}
async function send() {
  const body = draft.value.trim()
  if (!body || body.length > 2000 || sending.value || !channelReady.value) return
  sending.value = true; error.value = ''
  try {
    await request(endpoint.value, { method: 'POST', body: JSON.stringify({ body }) })
    draft.value = ''
    await loadMessages(true)
  } catch { error.value = 'A mensagem não foi enviada. Seu texto foi mantido para tentar novamente.' }
  finally { sending.value = false }
}
const time = (value: string) => new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
watch(open, value => {
  clearInterval(poller)
  if (!value) return
  error.value = ''
  if (props.platformArea) void loadDirectory()
  else void loadMessages()
  poller = setInterval(() => void loadMessages(true), 15000)
})
watch(activeTenantId, () => { messages.value = []; if (open.value) void loadMessages() })
onBeforeUnmount(() => clearInterval(poller))
</script>
<template>
  <USlideover v-model:open="open" side="right" title="Chat suporte" description="Conversa interna entre a empresa e a equipe Fluxo Atento." :ui="{ content: 'workspace-drawer' }">
    <template #body>
      <div class="support-chat">
        <div v-if="platformArea" class="field">
          <label for="support-tenant">Empresa</label>
          <select id="support-tenant" v-model="activeTenantId">
            <option value="">Selecione uma empresa</option>
            <option v-for="tenant in tenants" :key="tenant.id" :value="tenant.id">{{ tenant.name }}</option>
          </select>
          <p class="field-help">Cada empresa possui sua própria conversa. Esta seleção não abre o painel privado do tenant.</p>
        </div>
        <div v-if="!channelReady" class="note-box"><p>Selecione uma empresa para abrir ou iniciar a conversa de suporte.</p></div>
        <template v-else>
          <div class="support-chat-log" role="log" aria-label="Mensagens do suporte" aria-live="polite">
            <p v-if="loading" role="status">Carregando conversa…</p>
            <p v-else-if="!messages.length" class="field-help">Ainda não há mensagens. Escreva abaixo para iniciar a conversa.</p>
            <div v-for="message in messages" :key="message.id" class="support-chat-message" :class="{ 'support-chat-platform': message.sender_platform }">
              <strong>{{ message.sender_platform ? 'Equipe Fluxo Atento' : message.sender_id === auth.user.value?.id ? 'Você' : 'Sua empresa' }}</strong>
              <p>{{ message.body }}</p><small>{{ time(message.created_at) }}</small>
            </div>
          </div>
          <form class="support-chat-compose" @submit.prevent="send">
            <label for="support-message">Mensagem</label>
            <textarea id="support-message" v-model="draft" rows="3" maxlength="2000" placeholder="Descreva sua dúvida…" :disabled="sending" />
            <div class="support-chat-actions"><small>{{ draft.length }}/2000</small><button class="button button-primary" :disabled="sending || !draft.trim()">{{ sending ? 'Enviando…' : 'Enviar mensagem' }}</button></div>
          </form>
        </template>
        <p v-if="error" class="form-error" role="alert">{{ error }}</p>
        <NuxtLink :to="dashboardPath('/dashboard/ajuda')" class="text-link" @click="open = false">Abrir central de ajuda <UIcon name="i-lucide-arrow-up-right" /></NuxtLink>
      </div>
    </template>
  </USlideover>
</template>
<style scoped>
.support-chat { display:flex; flex-direction:column; gap:18px; min-height:100%; }
.support-chat-log { display:flex; flex-direction:column; gap:12px; min-height:180px; max-height:48vh; overflow:auto; padding:4px 2px 12px; }
.support-chat-message { padding:12px 14px; border:1px solid var(--border); border-radius:var(--radius-md); background:var(--surface-2); overflow-wrap:anywhere; }
.support-chat-platform { border-color:color-mix(in srgb,var(--brand) 35%,var(--border)); background:var(--brand-soft); }
.support-chat-message strong { font-size:12px; color:var(--text); }
.support-chat-message p { margin:5px 0; color:var(--text-secondary); white-space:pre-wrap; }
.support-chat-message small { color:var(--text-muted); font-size:11px; }
.support-chat-compose { display:flex; flex-direction:column; gap:10px; margin-top:auto; }
.support-chat-compose label { color:var(--text-secondary); font-size:12px; }
.support-chat-compose textarea { width:100%; min-height:90px; resize:vertical; }
.support-chat-actions { display:flex; justify-content:space-between; align-items:center; gap:12px; }
.support-chat-actions small { color:var(--text-muted); }
</style>
