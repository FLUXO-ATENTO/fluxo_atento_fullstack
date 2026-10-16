<script setup lang="ts">
import { publicErrorMessage } from '~/utils/monitor-response'
definePageMeta({ layout: 'dashboard' })
useSeoMeta({ title: 'Superadmin · Fluxo Atento', robots: 'noindex, nofollow' })
const route = useRoute()
const auth = useAuth(); const config = useRuntimeConfig().public
const { dashboardPath } = useDeployment()
type Provider = { id: string; display_name: string; channel: string; status: string; credential_reference: string }
type Tenant = { id: string; name: string }
const providers = ref<Provider[]>([]); const tenants = ref<Tenant[]>([])
const loading = ref(true); const saving = ref(false); const notice = ref(''); const error = ref(''); const inviteOpen = ref(false)
const provider = reactive({ provider_key: '', display_name: '', channel: 'whatsapp_waba', credential_reference: '' })
const invitation = reactive({ name: '', email: '', tenant_name: '' })
const section = computed(() => typeof route.query.secao === 'string' ? route.query.secao : '')
const titles: Record<string, string> = { clientes: 'Tenants', provedores: 'Provedores globais', planos: 'Planos', financeiro: 'Pagamentos', personalizacao: 'Personalização', comunicacao: 'E-mail e notificações', sistema: 'Segurança e operação' }
const planned: Record<string, { intro: string; items: string[] }> = {
  personalizacao: { intro: 'A identidade global será a base dos tenants. Preferências pessoais de tema já ficam na área de perfil.', items: ['Paletas, tipografia, sons e restauração dos padrões', 'Nome do app, logos claro e escuro e ícone PWA 512 × 512', 'Telas de entrada e cadastro', 'Tutoriais e ajuda contextual por página'] },
  comunicacao: { intro: 'SMTP global, SMTP por tenant e notificações terão escopos explícitos. Ainda não há envio configurável nesta tela.', items: ['SMTP: ativação, host, porta, usuário e segredo privado', 'Remetente, TLS e teste para destinatário confirmado', 'Notificações ativas/inativas, público e próxima sessão', 'Histórico, leitura e arquivamento com confirmação'] },
  sistema: { intro: 'Operações sensíveis serão protegidas por confirmação reforçada, identidade e auditoria.', items: ['Backup externo com restauração testada', 'Migrações e publicação reversível', 'Revogação de sessões e acesso de emergência com MFA', 'Auditoria, saúde de serviços e filas', 'Terminal restrito à infraestrutura, nunca aos tenants'] }
}
async function request(path: string, init: RequestInit = {}) {
  const client = auth.client()
  if (!client) throw new Error('Entre novamente para continuar.')
  const { data } = await client.auth.getSession()
  if (!data.session) throw new Error('Sua sessão terminou. Entre novamente.')
  const response = await fetch(String(config.apiBase).replace(/\/$/, '') + path, { ...init, cache: 'no-store', signal: AbortSignal.timeout(20000), headers: { Authorization: 'Bearer ' + data.session.access_token, ...(init.body ? { 'Content-Type': 'application/json' } : {}) } })
  const payload = await response.json().catch(() => null)
  if (!response.ok) throw new Error(publicErrorMessage(response.status, payload))
  return payload
}
async function load() {
  loading.value = true; error.value = ''
  const identity = auth.user.value?.id
  try {
    const [p, t] = await Promise.all([request('/v1/admin/providers'), request('/v1/admin/tenants')])
    if (auth.user.value?.id !== identity) return
    providers.value = p.providers; tenants.value = t.tenants
  } catch { error.value = 'Não foi possível consultar a administração. Confira seu acesso e tente novamente.' }
  finally { loading.value = false }
}
async function addProvider() {
  if (saving.value) return
  saving.value = true; error.value = ''; notice.value = ''
  try {
    await request('/v1/admin/providers', { method: 'POST', body: JSON.stringify(provider) })
    notice.value = 'Provedor registrado como pendente. A credencial e a validação precisam ser concluídas no ambiente privado.'
    Object.assign(provider, { provider_key: '', display_name: '', channel: 'whatsapp_waba', credential_reference: '' })
    await load()
  } catch { error.value = 'Não conseguimos registrar o provedor. Confira os campos e tente novamente.' }
  finally { saving.value = false }
}
async function invite() {
  if (saving.value) return
  saving.value = true; error.value = ''; notice.value = ''
  try {
    await request('/v1/admin/users', { method: 'POST', body: JSON.stringify(invitation) })
    notice.value = 'Convite solicitado e tenant inicial provisionado. O destinatário precisará concluir o acesso pelo e-mail.'
    Object.assign(invitation, { name: '', email: '', tenant_name: '' }); inviteOpen.value = false
    await load()
  } catch { error.value = 'Não foi possível concluir o convite. Confira o destinatário e o estado do cadastro antes de repetir.' }
  finally { saving.value = false }
}
onMounted(load)
</script>
<template>
  <div><header class="page-heading"><div><p class="eyebrow">SUPERADMIN · OPERAÇÃO GLOBAL</p><h1>{{ titles[section] || 'Sua plataforma, em perspectiva.' }}</h1><p>Gestão da Fluxo Atento. As operações das empresas ficam em seus próprios painéis.</p></div><button class="button button-secondary" :disabled="loading || saving" @click="load"><UIcon name="i-lucide-refresh-cw" />Atualizar dados</button></header>
    <p v-if="error" class="form-error" role="alert">{{ error }}</p><p v-if="notice" class="live-notice" role="status">{{ notice }}</p>
    <div v-if="loading" class="empty-state" role="status">Consultando dados da plataforma…</div>
    <template v-else>
      <template v-if="!section">
        <div class="admin-overview"><div class="panel stat-tile"><span>Tenants cadastrados</span><strong>{{ error ? '—' : tenants.length }}</strong><small>Empresas retornadas pelo serviço</small></div><div class="panel stat-tile"><span>Provedores registrados</span><strong>{{ error ? '—' : providers.length }}</strong><small>Cadastro não significa conexão ativa</small></div><div class="panel stat-tile"><span>Licença da instalação</span><strong class="stat-text">Não conectada</strong><small>Sem validade presumida</small></div></div>
        <div class="section-topline"><h2>O que você quer preparar?</h2><span class="subtle-label">PRÓXIMAS AÇÕES</span></div>
        <div class="quick-access-grid"><NuxtLink :to="dashboardPath('/dashboard/admin?secao=clientes')" class="quick-card"><span class="feature-icon"><UIcon name="i-lucide-building-2" /></span><h3>Clientes e usuários</h3><p>Consulte empresas e convide um responsável para um novo espaço.</p><span class="quick-card-footer">Gerenciar clientes <UIcon name="i-lucide-arrow-up-right" /></span></NuxtLink><NuxtLink :to="dashboardPath('/dashboard/admin?secao=provedores')" class="quick-card"><span class="feature-icon"><UIcon name="i-lucide-plug" /></span><h3>Provedores globais</h3><p>Cadastre referências de WABA e SMTP sem expor seus segredos.</p><span class="quick-card-footer">Preparar provedores <UIcon name="i-lucide-arrow-up-right" /></span></NuxtLink></div>
        <div class="note-box"><strong>Base funcional, expansão controlada.</strong><p>Catálogo de planos, regras por tenant e chat suporte usam a API privada. Pagamentos, integrações de anúncios e presença ainda exigem serviços externos e aceite; nenhuma cobrança é presumida.</p></div>
      </template>
      <template v-else-if="section === 'clientes'">
        <div class="profile-columns"><section class="panel admin-form"><h2>Tenants</h2><p>Empresas cadastradas na plataforma.</p><p v-if="!tenants.length && !error">Nenhuma empresa retornada.</p><ul class="tenant-list"><li v-for="tenant in tenants" :key="tenant.id"><span class="context-icon"><UIcon name="i-lucide-building-2" /></span><div><strong>{{ tenant.name }}</strong><small>{{ tenant.id }}</small></div></li></ul></section>
        <form class="panel admin-form" @submit.prevent="inviteOpen = true"><h2>Convidar para uma nova empresa</h2><p>Este fluxo envia um convite e cria um tenant inicial. Não adiciona uma pessoa a uma equipe já existente.</p><div class="field"><label for="invite-name">Nome do responsável</label><input id="invite-name" v-model="invitation.name" required maxlength="120" autocomplete="name" :disabled="saving"></div><div class="field"><label for="invite-email">E-mail do responsável</label><input id="invite-email" v-model="invitation.email" type="email" required maxlength="254" autocomplete="email" :disabled="saving"></div><div class="field"><label for="invite-tenant">Nome da empresa</label><input id="invite-tenant" v-model="invitation.tenant_name" required maxlength="120" autocomplete="organization" :disabled="saving"></div><button class="button button-primary" :disabled="saving">Revisar convite <UIcon name="i-lucide-arrow-right" /></button></form></div>
        <PlatformTenantControls :tenants="tenants" :request="request" @refresh="load" />
        <div class="note-box"><strong>Limites desta etapa</strong><p>O chat suporte textual fica no botão fixo do topo. Anexos, áudio, equipes, política de senhas, galeria e permissões de módulos ainda dependem dos respectivos serviços; não são liberados por uma marcação visual.</p></div>
      </template>
      <PlatformPlans v-else-if="section === 'planos'" :tenants="tenants" :request="request" />
      <PlatformBilling v-else-if="section === 'financeiro'" :request="request" />
      <template v-else-if="section === 'provedores'">
        <GoogleProviderPanel />
        <div class="profile-columns"><form class="panel admin-form" @submit.prevent="addProvider"><h2>Registrar provedor</h2><p>Informe apenas o nome da variável privada. Nunca cole tokens ou senhas neste formulário.</p><div class="field"><label for="provider-key">Identificador interno</label><input id="provider-key" v-model="provider.provider_key" pattern="[a-z0-9][a-z0-9_-]{2,62}" required placeholder="meta_waba_principal" :disabled="saving"></div><div class="field"><label for="provider-name">Nome de exibição</label><input id="provider-name" v-model="provider.display_name" required maxlength="120" :disabled="saving"></div><div class="field"><label for="provider-channel">Canal</label><select id="provider-channel" v-model="provider.channel" :disabled="saving"><option value="whatsapp_waba">WhatsApp Business / WABA</option><option value="email_smtp">E-mail SMTP</option></select></div><div class="field"><label for="provider-reference">Referência da credencial privada</label><input id="provider-reference" v-model="provider.credential_reference" pattern="[A-Z][A-Z0-9_]{2,127}" required placeholder="META_WABA_PRIMARY" :disabled="saving" aria-describedby="credential-hint"><small id="credential-hint">A credencial permanece no servidor. O cadastro inicia como pendente.</small></div><button class="button button-primary" :disabled="saving">{{ saving ? 'Registrando…' : 'Registrar provedor pendente' }}</button></form>
        <section class="panel admin-form"><h2>Provedores cadastrados</h2><p v-if="!providers.length && !error">Nenhum provedor retornado pelo serviço.</p><ul class="provider-list"><li v-for="item in providers" :key="item.id"><strong>{{ item.display_name }}</strong><span class="ui-status">{{ item.status }}</span><small>{{ item.channel }} · {{ item.credential_reference }}</small></li></ul><div class="note-box"><strong>Outros provedores</strong><p>Meta Ads e OpenAI ainda precisam de conexão operacional. WABA e Meta Ads têm permissões e finalidades diferentes. O provedor Google possui configuração própria acima.</p></div></section></div>
      </template>
      <section v-else-if="planned[section]" class="panel admin-form"><span class="ui-status ui-status-pending">Em preparação</span><h2>{{ titles[section] }}</h2><p>{{ planned[section]!.intro }}</p><ul class="roadmap-list"><li v-for="item in planned[section]!.items" :key="item"><UIcon name="i-lucide-circle-dashed" />{{ item }}</li></ul><NuxtLink :to="dashboardPath('/dashboard/configuracoes')" class="button button-secondary">Abrir meu perfil e preferências</NuxtLink></section>
      <section v-else class="empty-state"><h2>Seção não encontrada</h2><NuxtLink :to="dashboardPath('/dashboard/admin')" class="text-link">Voltar à visão geral</NuxtLink></section>
    </template>
    <UModal v-model:open="inviteOpen" title="Enviar convite para nova empresa?" description="Confira o destinatário antes de continuar." :ui="{ content: 'workspace-dialog' }"><template #body><p>Um e-mail será enviado para <strong>{{ invitation.email }}</strong>, com acesso inicial à empresa <strong>{{ invitation.tenant_name }}</strong>. Isso não concede Superadmin.</p><p v-if="error" role="alert" class="form-error">{{ error }}</p></template><template #footer><div class="dialog-actions"><button class="button button-secondary" :disabled="saving" @click="inviteOpen = false">Revisar dados</button><button class="button button-primary" :disabled="saving" @click="invite">{{ saving ? 'Enviando…' : 'Enviar convite' }}</button></div></template></UModal>
  </div>
</template>
