<script setup lang="ts">
type Tenant = { id: string; name: string }
type Plan = { id: string; name: string; audience: 'global' | 'selected'; status: string; target_tenant_ids: string[] }
type Controls = {
  identifier: string | null; status: 'active' | 'paused'; plan_id: string | null
  max_users: number | null; max_connections: number | null; gallery_storage_mb: number
  trial_days: number; allowed_channels: string[]; channel_limits: Record<string, number | null>
  provider_mode: 'platform'
}
const props = defineProps<{ tenants: Tenant[]; request: (path: string, init?: RequestInit) => Promise<any> }>()
const emit = defineEmits<{ refresh: [] }>()
const workspace = useWorkspace()
const selected = ref('')
const plans = ref<Plan[]>([])
const tenantName = ref('')
const busy = ref(false)
const loading = ref(false)
const error = ref('')
const notice = ref('')
const confirmPause = ref(false)
const channels = [
  { id: 'whatsapp_waba', label: 'WhatsApp Business / WABA' },
  { id: 'email_smtp', label: 'E-mail SMTP' }
]
const controls = reactive<Controls>({ identifier: null, status: 'active', plan_id: null, max_users: null,
  max_connections: null, gallery_storage_mb: 0, trial_days: 0,
  allowed_channels: ['whatsapp_waba', 'email_smtp'], channel_limits: { whatsapp_waba: null, email_smtp: null }, provider_mode: 'platform' })
const eligiblePlans = computed(() => plans.value.filter(plan => plan.status === 'published'
  && (plan.audience === 'global' || plan.target_tenant_ids.includes(selected.value))))
watch(() => props.tenants, value => { if (!selected.value && value.length) selected.value = value[0]!.id }, { immediate: true })
watch(selected, () => { if (selected.value) void load() })
onMounted(async () => { try { plans.value = (await props.request('/v1/admin/plans')).plans } catch { /* Tenant controls still work without plans. */ } })
async function load() {
  if (!selected.value) return
  loading.value = true; error.value = ''; notice.value = ''
  const identity = selected.value
  try {
    const payload = await props.request(`/v1/admin/tenants/${identity}`) as { tenant: Tenant; controls: Controls }
    if (selected.value !== identity) return
    tenantName.value = payload.tenant.name
    Object.assign(controls, payload.controls, { channel_limits: {
      whatsapp_waba: payload.controls.channel_limits.whatsapp_waba ?? null,
      email_smtp: payload.controls.channel_limits.email_smtp ?? null
    } })
  } catch { error.value = 'Não foi possível carregar as regras desta empresa.' }
  finally { loading.value = false }
}
function allow(channel: string, checked: boolean) {
  controls.allowed_channels = checked
    ? [...new Set([...controls.allowed_channels, channel])]
    : controls.allowed_channels.filter(item => item !== channel)
}
function unlimited(channel: string, checked: boolean) { controls.channel_limits[channel] = checked ? null : 1 }
async function save() {
  if (controls.status === 'paused') { confirmPause.value = true; return }
  await commit()
}
async function commit() {
  if (!selected.value || busy.value) return
  busy.value = true; error.value = ''; notice.value = ''; confirmPause.value = false
  try {
    await props.request(`/v1/admin/tenants/${selected.value}`, { method: 'PATCH', body: JSON.stringify({ ...controls, identifier: controls.identifier || null }) })
    await load()
    notice.value = 'Regras da empresa salvas.'
  } catch { error.value = 'Não foi possível salvar as regras. Nenhuma liberação foi presumida.' }
  finally { busy.value = false }
}
async function createPilot() {
  if (busy.value) return
  busy.value = true; error.value = ''
  try {
    const result = await props.request('/v1/admin/tenants/pilot', { method: 'POST', body: '{}' }) as { tenant_id: string }
    await workspace.load()
    selected.value = result.tenant_id
    emit('refresh')
    notice.value = 'Seu tenant piloto está disponível. O papel global continua separado.'
  } catch { error.value = 'Não foi possível criar seu tenant. Tente novamente sem repetir convites.' }
  finally { busy.value = false }
}
async function rename() {
  const name = tenantName.value.trim()
  if (!selected.value || !name || busy.value) return
  busy.value = true; error.value = ''; notice.value = ''
  try {
    await props.request(`/v1/admin/tenants/${selected.value}/name`, { method: 'PATCH', body: JSON.stringify({ name }) })
    emit('refresh')
    notice.value = 'Nome da empresa atualizado.'
  } catch { error.value = 'Não foi possível atualizar o nome.' }
  finally { busy.value = false }
}
</script>
<template>
  <section class="panel admin-form tenant-control-panel">
    <div class="section-topline"><div><h2>Configuração de cada tenant</h2><p>O Superadmin define o escopo; cada empresa continua isolada.</p></div><NuxtLink v-if="workspace.activeTenant.value" to="/" class="text-link">Abrir meu tenant <UIcon name="i-lucide-arrow-up-right" /></NuxtLink></div>
    <div v-if="!workspace.tenants.value.length" class="note-box"><strong>Também quer acessar como tenant?</strong><p>A mesma conta pode ter um tenant piloto próprio sem conceder direitos globais a outros usuários.</p><button class="button button-secondary" :disabled="busy" @click="createPilot">Criar meu tenant piloto</button></div>
    <div class="field"><label for="tenant-controls-select">Empresa a configurar</label><select id="tenant-controls-select" v-model="selected"><option value="">Selecione</option><option v-for="tenant in tenants" :key="tenant.id" :value="tenant.id">{{ tenant.name }}</option></select></div>
    <p v-if="loading" role="status">Carregando regras…</p>
    <template v-else-if="selected"><form class="tenant-name-form" @submit.prevent="rename"><div class="field"><label for="tenant-display-name">Nome da empresa</label><input id="tenant-display-name" v-model="tenantName" required maxlength="120" /></div><button class="button button-secondary" :disabled="busy">Salvar nome</button></form>
    <form @submit.prevent="save">
      <p class="field-help">Alterações nesta área afetam somente esta empresa.</p>
      <div class="tenant-control-grid">
        <div class="field"><label for="tenant-identifier">Identificador único</label><input id="tenant-identifier" v-model="controls.identifier" pattern="[a-z0-9][a-z0-9-]{2,62}" placeholder="empresa-exemplo" /><small>Nome técnico opcional. Não altera o domínio.</small></div>
        <div class="field"><label for="tenant-status">Estado operacional</label><select id="tenant-status" v-model="controls.status"><option value="active">Ativo</option><option value="paused">Pausado</option></select><small>Ao pausar, as operações param; o chat suporte permanece disponível.</small></div>
        <div class="field"><label for="tenant-plan">Plano atribuído</label><select id="tenant-plan" v-model="controls.plan_id"><option :value="null">Sem plano</option><option v-for="plan in eligiblePlans" :key="plan.id" :value="plan.id">{{ plan.name }}</option></select><small>Somente planos publicados para todos ou para esta empresa.</small></div>
        <div class="field"><label for="tenant-gallery">Galeria reservada (MB)</label><input id="tenant-gallery" v-model.number="controls.gallery_storage_mb" type="number" min="0" max="1000000" /><small>A galeria ainda não está conectada; este valor não cria armazenamento.</small></div>
        <div class="field"><label for="tenant-users">Máximo de usuários</label><input id="tenant-users" v-model.number="controls.max_users" type="number" min="1" max="100000" :disabled="controls.max_users === null" /><label class="field-help"><input type="checkbox" :checked="controls.max_users === null" @change="controls.max_users = ($event.target as HTMLInputElement).checked ? null : 100" /> Sem limite configurado</label><small>A gestão de equipe ainda precisa aplicar este teto.</small></div>
        <div class="field"><label for="tenant-connections">Máximo de conexões</label><input id="tenant-connections" v-model.number="controls.max_connections" type="number" min="1" max="100000" :disabled="controls.max_connections === null" /><label class="field-help"><input type="checkbox" :checked="controls.max_connections === null" @change="controls.max_connections = ($event.target as HTMLInputElement).checked ? null : 2" /> Sem limite configurado</label><small>O catálogo atual admite uma conexão por tipo de canal.</small></div>
        <div class="field"><label for="tenant-trial">Dias de teste</label><input id="tenant-trial" v-model.number="controls.trial_days" type="number" min="0" max="365" /><small>Zero desativa. Sem cobrança conectada, este campo não inicia uma assinatura.</small></div>
      </div>
      <fieldset class="tenant-channel-fieldset"><legend>Canais permitidos</legend><p class="field-help">A API já rejeita novos pedidos de conexão para canais desmarcados.</p><div v-for="channel in channels" :key="channel.id" class="tenant-channel-row"><label><input type="checkbox" :checked="controls.allowed_channels.includes(channel.id)" @change="allow(channel.id, ($event.target as HTMLInputElement).checked)" /> {{ channel.label }}</label><label><input type="checkbox" :checked="controls.channel_limits[channel.id] === null" @change="unlimited(channel.id, ($event.target as HTMLInputElement).checked)" /> Ilimitado</label><input v-if="controls.channel_limits[channel.id] !== null" v-model.number="controls.channel_limits[channel.id]" type="number" min="0" max="100000" :aria-label="'Limite para ' + channel.label" /></div><small>O limite numérico acima de 1 depende da futura conexão múltipla do canal; zero bloqueia novos pedidos agora.</small></fieldset>
      <p class="field-help">Provedor por tenant, credenciais Meta Embedded Signup, senha definida pelo admin, galeria e recursos ainda não implementados permanecem fora dos controles ativos. Nenhum segredo é inserido aqui.</p>
      <button class="button button-primary" :disabled="busy">{{ busy ? 'Salvando…' : 'Salvar regras do tenant' }}</button>
    </form></template>
    <p v-if="error" class="form-error" role="alert">{{ error }}</p><p v-if="notice" class="live-notice" role="status">{{ notice }}</p>
    <UModal v-model:open="confirmPause" title="Pausar operações desta empresa?" description="Esta ação altera o acesso operacional do tenant."><template #body><p>Monitores e integrações desta empresa ficarão bloqueados enquanto ela estiver pausada. O chat suporte continuará disponível.</p></template><template #footer><div class="dialog-actions"><button class="button button-secondary" @click="confirmPause = false">Voltar</button><button class="button button-danger" :disabled="busy" @click="commit">Confirmar pausa</button></div></template></UModal>
  </section>
</template>
<style scoped>
.tenant-control-panel { margin-top:24px; }
.tenant-control-panel .section-topline { align-items:flex-start; }
.tenant-control-panel .section-topline p { margin:4px 0 0; }
.tenant-name-form { display:flex; align-items:end; gap:12px; margin:10px 0 22px; }
.tenant-name-form .field { flex:1; margin:0; }
.tenant-control-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:16px 22px; }
.tenant-channel-fieldset { border:1px solid var(--border); border-radius:var(--radius-md); padding:18px; margin:16px 0 24px; }
.tenant-channel-fieldset legend { color:var(--text); padding-inline:8px; }
.tenant-channel-row { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:14px; border-top:1px solid var(--border); padding:12px 0; }
.tenant-channel-row label { display:inline-flex; gap:8px; align-items:center; font-size:12px; }
.tenant-channel-row input[type=number] { max-width:110px; }
@media(max-width:700px) { .tenant-control-grid { grid-template-columns:1fr; } }
@media(max-width:520px) { .tenant-name-form { flex-direction:column; align-items:stretch; } }
</style>
