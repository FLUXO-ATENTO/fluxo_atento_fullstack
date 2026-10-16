<script setup lang="ts">
type Tenant = { id: string; name: string }
type Plan = { id: string; name: string; price_cents: number; billing_interval: 'monthly' | 'yearly';
  max_users: number | null; max_connections: number | null; gallery_storage_mb: number; trial_days: number;
  features: string[]; audience: 'global' | 'selected'; status: 'draft' | 'published' | 'archived'; target_tenant_ids: string[] }
const props = defineProps<{ tenants: Tenant[]; request: (path: string, init?: RequestInit) => Promise<any> }>()
const plans = ref<Plan[]>([])
const editId = ref<string | null>(null)
const priceReais = ref(0)
const busy = ref(false)
const error = ref('')
const notice = ref('')
const form = reactive<Omit<Plan, 'id'>>({ name: '', price_cents: 0, billing_interval: 'monthly', max_users: null,
  max_connections: null, gallery_storage_mb: 0, trial_days: 0, features: [], audience: 'selected',
  status: 'draft', target_tenant_ids: [] })
const features = [
  { id: 'monitoring', label: 'Páginas monitoradas', current: true },
  { id: 'google_data', label: 'Dados Google', current: false },
  { id: 'whatsapp_waba', label: 'WhatsApp Business', current: false },
  { id: 'email_smtp', label: 'E-mail SMTP', current: false },
  { id: 'campaigns', label: 'Campanhas', current: false },
  { id: 'bulk_send', label: 'Envio em massa', current: false },
  { id: 'gallery', label: 'Galeria', current: false },
  { id: 'auto_responses', label: 'Respostas automáticas', current: false },
  { id: 'ai_copilot', label: 'Copiloto de IA', current: false }
]
const money = (cents: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100)
onMounted(load)
async function load() {
  try { plans.value = (await props.request('/v1/admin/plans')).plans }
  catch { error.value = 'Não foi possível consultar os planos.' }
}
function reset() {
  editId.value = null; priceReais.value = 0
  Object.assign(form, { name: '', price_cents: 0, billing_interval: 'monthly', max_users: null,
    max_connections: null, gallery_storage_mb: 0, trial_days: 0, features: [], audience: 'selected',
    status: 'draft', target_tenant_ids: [] })
}
function edit(plan: Plan) {
  editId.value = plan.id; priceReais.value = plan.price_cents / 100
  Object.assign(form, { ...plan, features: [...plan.features], target_tenant_ids: [...plan.target_tenant_ids] })
}
function toggleFeature(id: string, checked: boolean) { form.features = checked ? [...form.features, id] : form.features.filter(item => item !== id) }
function toggleTenant(id: string, checked: boolean) { form.target_tenant_ids = checked ? [...form.target_tenant_ids, id] : form.target_tenant_ids.filter(item => item !== id) }
async function save() {
  if (busy.value) return
  busy.value = true; error.value = ''; notice.value = ''
  const body = { ...form, name: form.name.trim(), price_cents: Math.round(priceReais.value * 100),
    target_tenant_ids: form.audience === 'global' ? [] : form.target_tenant_ids }
  try {
    await props.request(editId.value ? `/v1/admin/plans/${editId.value}` : '/v1/admin/plans', {
      method: editId.value ? 'PATCH' : 'POST', body: JSON.stringify(body)
    })
    await load(); reset()
    notice.value = 'Plano salvo no catálogo. Nenhuma cobrança foi iniciada.'
  } catch { error.value = 'Não foi possível salvar o plano. Revise o público e os limites.' }
  finally { busy.value = false }
}
</script>
<template>
  <div class="platform-plan-columns">
    <section class="panel admin-form"><h2>Planos cadastrados</h2><p>Catálogo configurado pelo Superadmin; não equivale a uma assinatura paga.</p><p v-if="!plans.length">Nenhum plano cadastrado.</p><ul v-else class="provider-list"><li v-for="plan in plans" :key="plan.id"><strong>{{ plan.name }}</strong><span class="ui-status">{{ plan.status === 'published' ? 'Publicado' : plan.status === 'archived' ? 'Arquivado' : 'Rascunho' }}</span><small>{{ money(plan.price_cents) }} / {{ plan.billing_interval === 'monthly' ? 'mês' : 'ano' }} · {{ plan.audience === 'global' ? 'Todos os tenants' : `${plan.target_tenant_ids.length} tenant(s)` }}</small><button class="text-link" @click="edit(plan)">Editar plano <UIcon name="i-lucide-arrow-right" /></button></li></ul></section>
    <form class="panel admin-form" @submit.prevent="save"><div class="section-topline"><h2>{{ editId ? 'Editar plano' : 'Novo plano' }}</h2><button v-if="editId" type="button" class="text-link" @click="reset">Criar outro</button></div>
      <div class="field"><label for="plan-name">Nome do plano</label><input id="plan-name" v-model="form.name" required maxlength="80" /></div>
      <div class="plan-field-grid"><div class="field"><label for="plan-price">Preço em reais</label><input id="plan-price" v-model.number="priceReais" type="number" min="0" max="1000000" step="0.01" required /></div><div class="field"><label for="plan-interval">Período</label><select id="plan-interval" v-model="form.billing_interval"><option value="monthly">Mensal</option><option value="yearly">Anual</option></select></div>
        <div class="field"><label for="plan-users">Usuários</label><input id="plan-users" v-model.number="form.max_users" type="number" min="1" max="100000" :disabled="form.max_users === null" /><label class="field-help"><input type="checkbox" :checked="form.max_users === null" @change="form.max_users = ($event.target as HTMLInputElement).checked ? null : 10" /> Sem limite definido</label></div>
        <div class="field"><label for="plan-connections">Conexões</label><input id="plan-connections" v-model.number="form.max_connections" type="number" min="1" max="100000" :disabled="form.max_connections === null" /><label class="field-help"><input type="checkbox" :checked="form.max_connections === null" @change="form.max_connections = ($event.target as HTMLInputElement).checked ? null : 2" /> Sem limite definido</label></div>
        <div class="field"><label for="plan-gallery">Galeria (MB)</label><input id="plan-gallery" v-model.number="form.gallery_storage_mb" type="number" min="0" max="1000000" /></div><div class="field"><label for="plan-trial">Dias de trial</label><input id="plan-trial" v-model.number="form.trial_days" type="number" min="0" max="365" /><small>Zero desativa.</small></div></div>
      <fieldset class="plan-fieldset"><legend>Funcionalidades incluídas</legend><p class="field-help">Itens futuros podem ser planejados aqui; selecionar não ativa módulos que ainda não existem.</p><label v-for="feature in features" :key="feature.id" class="plan-check"><input type="checkbox" :checked="form.features.includes(feature.id)" @change="toggleFeature(feature.id, ($event.target as HTMLInputElement).checked)" /> {{ feature.label }} <small v-if="!feature.current">Em desenvolvimento</small></label></fieldset>
      <fieldset class="plan-fieldset"><legend>Disponibilidade</legend><label class="plan-check"><input v-model="form.audience" type="radio" value="global" /> Todos os tenants</label><label class="plan-check"><input v-model="form.audience" type="radio" value="selected" /> Somente tenants selecionados</label><div v-if="form.audience === 'selected'" class="plan-targets"><label v-for="tenant in tenants" :key="tenant.id" class="plan-check"><input type="checkbox" :checked="form.target_tenant_ids.includes(tenant.id)" @change="toggleTenant(tenant.id, ($event.target as HTMLInputElement).checked)" /> {{ tenant.name }}</label><p v-if="!tenants.length" class="field-help">Cadastre uma empresa antes de publicar um plano selecionado.</p></div></fieldset>
      <div class="field"><label for="plan-status">Estado do catálogo</label><select id="plan-status" v-model="form.status"><option value="draft">Rascunho</option><option value="published">Publicado para o público escolhido</option><option value="archived">Arquivado</option></select><small>Publicado torna o plano visível, mas não cobra nem libera recursos sem a integração correspondente.</small></div>
      <button class="button button-primary" :disabled="busy">{{ busy ? 'Salvando…' : 'Salvar plano' }}</button><p v-if="error" class="form-error" role="alert">{{ error }}</p><p v-if="notice" class="live-notice" role="status">{{ notice }}</p>
    </form>
  </div>
</template>
<style scoped>
.platform-plan-columns { display:grid; grid-template-columns:minmax(260px,.7fr) minmax(400px,1.3fr); gap:20px; }
.plan-field-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px 18px; }
.plan-fieldset { border:1px solid var(--border); border-radius:var(--radius-md); padding:16px; margin:0 0 18px; }
.plan-fieldset legend { color:var(--text); padding-inline:8px; }
.plan-check { display:flex; gap:9px; align-items:center; min-height:36px; font-size:12px; color:var(--text-secondary); }
.plan-check small { color:var(--text-muted); margin-left:auto; }
.plan-targets { max-height:180px; overflow:auto; margin:8px 0 0 24px; }
@media(max-width:950px) { .platform-plan-columns { grid-template-columns:1fr; } }
@media(max-width:600px) { .plan-field-grid { grid-template-columns:1fr; } }
</style>
