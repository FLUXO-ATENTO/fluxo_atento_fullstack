<script setup lang="ts">
definePageMeta({ layout: 'superadmin' })
useSeoMeta({ title: 'Super Admin · FLUXO', robots: 'noindex, nofollow' })
type Tenant = { id: string; name: string; created_at: string }
type Provider = { id: string; display_name: string; channel: string; status: string; credential_reference: string }
type Member = { user_id: string; role: string; email?: string }
type Audit = { id: number; actor_id: string; action: string; created_at: string }
const request = useWorkspaceApi()
const workspace = useWorkspace()
const { dashboardPath } = useDeployment()
const providers = ref<Provider[]>([]), tenants = ref<Tenant[]>([]), events = ref<Audit[]>([])
const members = ref<Member[]>([]), selectedTenant = ref<Tenant | null>(null)
const loading = ref(true), busy = ref(false), notice = ref(''), error = ref(''), page = ref(0), total = ref(0)
const provider = reactive({ provider_key: '', display_name: '', channel: 'whatsapp_waba', credential_reference: '' })
const invitation = reactive({ name: '', email: '', tenant_name: '' })
const statusLabels: Record<string, string> = { pending: 'Configuração pendente', validated: 'Conexão validada', disabled: 'Desativado', error: 'Precisa de atenção' }
async function load() {
  loading.value = true; error.value = ''
  try {
    const [p, t, a] = await Promise.all([
      request<{ providers: Provider[] }>('/v1/admin/providers'),
      request<{ tenants: Tenant[]; total: number }>(`/v1/admin/tenants?page=${page.value}`),
      request<{ events: Audit[] }>('/v1/admin/audit')
    ])
    providers.value = p.providers; tenants.value = t.tenants; total.value = t.total; events.value = a.events
  } catch (cause) { error.value = cause instanceof Error ? cause.message : 'Administração indisponível.' }
  finally { loading.value = false }
}
async function action(work: () => Promise<void>) {
  if (busy.value) return
  busy.value = true; error.value = ''; notice.value = ''
  try { await work() } catch (cause) { error.value = cause instanceof Error ? cause.message : 'Não foi possível concluir.' }
  finally { busy.value = false }
}
async function addProvider() { await action(async () => {
  await request('/v1/admin/providers', { method: 'POST', body: JSON.stringify(provider) })
  notice.value = 'Provedor registrado como pendente. A chave privada deve permanecer na VPS. Este cadastro não ativa o canal.'
  Object.assign(provider, { provider_key: '', display_name: '', channel: 'whatsapp_waba', credential_reference: '' }); await load()
}) }
async function invite() { await action(async () => {
  await request('/v1/admin/users', { method: 'POST', body: JSON.stringify(invitation) })
  notice.value = 'Convite enviado. A pessoa define a própria senha e recebe acesso apenas ao seu tenant.'
  Object.assign(invitation, { name: '', email: '', tenant_name: '' }); await load()
}) }
async function openTenant(tenant: Tenant) { await action(async () => {
  if (!await workspace.load(tenant.id)) throw new Error('Não foi possível confirmar o acesso ao tenant.')
  await navigateTo(dashboardPath('/dashboard/monitores'))
}) }
async function showMembers(tenant: Tenant) { await action(async () => {
  members.value = []; selectedTenant.value = null
  const result = await request<{ members: Member[] }>(`/v1/admin/tenants/${tenant.id}/members`)
  selectedTenant.value = tenant; members.value = result.members
}) }
async function changeRole(member: Member, event: Event) {
  const input = event.target as HTMLSelectElement, role = input.value
  input.value = member.role
  if (!selectedTenant.value || role === member.role) return
  const tenantId = selectedTenant.value.id
  await action(async () => {
    await request(`/v1/admin/tenants/${tenantId}/members/${member.user_id}`, { method: 'PATCH', body: JSON.stringify({ role }) })
    member.role = role; notice.value = 'Permissão atualizada e registrada em auditoria.'; await load()
  })
}
async function setProviderStatus(item: Provider) { await action(async () => {
  const status = item.status === 'disabled' ? 'pending' : 'disabled'
  if (status === 'disabled' && !window.confirm(`Desativar ${item.display_name}? As conexões que dependem deste provedor também serão desativadas.`)) return
  await request(`/v1/admin/providers/${item.id}`, { method: 'PATCH', body: JSON.stringify({ status }) })
  notice.value = status === 'disabled' ? 'Provedor e conexões dependentes desativados.' : 'Provedor devolvido à configuração. Uma nova validação será necessária.'; await load()
}) }
async function paginate(delta: number) { page.value += delta; await load() }
onMounted(load)
</script>
<template>
  <div>
    <header class="page-heading"><div><p class="eyebrow">FLUXO · ADMINISTRAÇÃO GLOBAL</p><h1>Seu centro de controle.</h1><p>Um painel exclusivo para administrar tenants, usuários e provedores. O acesso aos dados de uma empresa exige selecionar seu contexto.</p></div></header>
    <p v-if="error" class="form-error" role="alert">{{ error }}</p><p v-if="notice" class="live-notice" role="status">{{ notice }}</p>
    <div v-if="loading" class="empty-state" role="status">Carregando a administração…</div>
    <template v-else>
      <section class="admin-summary" aria-label="Resumo da plataforma"><article class="panel">Tenants cadastrados<strong>{{ total }}</strong></article><article class="panel">Provedores globais<strong>{{ providers.length }}</strong></article><article class="panel">Provedores validados<strong>{{ providers.filter(p => p.status === 'validated').length }}</strong></article></section>
      <section id="tenants" class="panel admin-list"><h2>Tenants e permissões</h2><p>Usuários comuns não acessam esta lista. Abrir um tenant mantém sua identidade de Super Admin; não é uma personificação do cliente.</p>
        <p v-if="!tenants.length">Nenhum tenant cadastrado.</p>
        <article v-for="item in tenants" :key="item.id"><h3>{{ item.name }}</h3><small>{{ item.id }}</small><div class="admin-actions"><button class="button button-primary" :disabled="busy" @click="openTenant(item)">Abrir tenant</button><button class="button button-secondary" :disabled="busy" @click="showMembers(item)">Ver membros e permissões</button></div></article>
        <div class="admin-actions"><button class="button" :disabled="page === 0 || busy" @click="paginate(-1)">Anterior</button><span>Página {{ page + 1 }} · {{ total }} tenants</span><button class="button" :disabled="(page + 1) * 25 >= total || busy" @click="paginate(1)">Próxima</button></div>
        <section v-if="selectedTenant"><h3>Membros · {{ selectedTenant.name }}</h3><p>Responsável: propriedade do tenant. Administrador: configura conexões. Membro: operação diária. Nenhuma dessas permissões concede acesso global.</p><ul><li v-for="member in members" :key="member.user_id"><span>{{ member.email || member.user_id }}</span><select :value="member.role" :disabled="busy" :aria-label="'Permissão de ' + (member.email || member.user_id)" @change="changeRole(member, $event)"><option value="owner">Responsável</option><option value="admin">Administrador do tenant</option><option value="member">Membro</option></select></li></ul><small>Até 100 membros por consulta nesta etapa. O último responsável não pode ser rebaixado.</small></section>
      </section>
      <section class="admin-grid">
        <form id="usuarios" class="panel admin-form" @submit.prevent="invite"><h2>Cadastrar usuário</h2><p>Convite pelo Supabase e tenant isolado. Nenhuma senha é definida ou exibida pelo administrador.</p><div class="field"><label for="invite-name">Nome</label><input id="invite-name" v-model="invitation.name" required maxlength="120"></div><div class="field"><label for="invite-email">E-mail</label><input id="invite-email" v-model="invitation.email" type="email" required maxlength="254"></div><div class="field"><label for="invite-tenant">Nome do tenant</label><input id="invite-tenant" v-model="invitation.tenant_name" required maxlength="120"></div><button class="button button-primary" :disabled="busy">Enviar convite</button></form>
        <form class="panel admin-form" @submit.prevent="addProvider"><h2>Cadastrar provedor global</h2><p>Informe somente o nome da variável privada da VPS, nunca o valor da chave.</p><div class="field"><label for="provider-key">Chave interna</label><input id="provider-key" v-model="provider.provider_key" pattern="[a-z0-9][a-z0-9_-]{2,62}" required placeholder="meta_waba_principal"></div><div class="field"><label for="provider-name">Nome visível</label><input id="provider-name" v-model="provider.display_name" required maxlength="120"></div><div class="field"><label for="provider-channel">Canal</label><select id="provider-channel" v-model="provider.channel"><option value="whatsapp_waba">WhatsApp Business / WABA</option><option value="email_smtp">E-mail SMTP</option></select></div><div class="field"><label for="provider-ref">Nome da variável na VPS</label><input id="provider-ref" v-model="provider.credential_reference" pattern="[A-Z][A-Z0-9_]{2,127}" required placeholder="META_WABA_PRIMARY"></div><button class="button button-primary" :disabled="busy">Registrar como pendente</button></form>
      </section>
      <section id="provedores" class="panel admin-list"><h2>Provedores e integrações globais</h2><p>O cadastro prepara a configuração. Envio, recebimento e histórico dependem da implementação e validação de cada conector.</p><p v-if="!providers.length">Nenhum provedor cadastrado; nenhum canal global está ativado.</p><article v-for="item in providers" :key="item.id"><h3>{{ item.display_name }}</h3><p>{{ item.channel }} · {{ statusLabels[item.status] || item.status }}</p><small>Referência privada: {{ item.credential_reference }}</small><div class="admin-actions"><button class="button" :disabled="busy" @click="setProviderStatus(item)">{{ item.status === 'disabled' ? 'Voltar à configuração' : 'Desativar provedor' }}</button></div></article></section>
      <section id="auditoria" class="panel admin-list"><h2>Auditoria administrativa</h2><p>Últimas 100 alterações de permissões e de status de provedores. Sem senhas, tokens ou conteúdo das conversas.</p><p v-if="!events.length">Nenhuma alteração registrada nesta etapa.</p><ul><li v-for="item in events" :key="item.id"><strong>{{ item.action }}</strong><span>{{ new Date(item.created_at).toLocaleString('pt-BR') }} · Autor {{ item.actor_id }}</span></li></ul></section>
    </template>
  </div>
</template>
