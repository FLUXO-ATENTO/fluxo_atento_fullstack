<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })
useSeoMeta({ title: 'Contatos e histórico · FLUXO', robots: 'noindex, nofollow' })
type Contact = { id: string; display_name: string; contact_identities: { kind: string; normalized_value: string }[] }
type Message = { id: string; body_text: string; direction: string; occurred_at: string }
const request = useWorkspaceApi(), workspace = useWorkspace(), auth = useAuth()
const contacts = ref<Contact[]>([]), selected = ref<Contact | null>(null), messages = ref<Message[]>([])
const loading = ref(false), busy = ref(false), historyLoading = ref(false), error = ref(''), notice = ref('')
const page = ref(0), total = ref(0), nextCursor = ref<string | null>(null)
const form = reactive({ name: '', email: '', phone: '' })
let generation = 0, historyGeneration = 0
async function load() {
  const current = generation
  loading.value = true; error.value = ''
  try {
    const data = await request<{ contacts: Contact[]; total: number }>(`/v1/contacts?page=${page.value}`, {}, true)
    if (current === generation) { contacts.value = data.contacts; total.value = data.total }
  } catch (cause) { if (current === generation) error.value = cause instanceof Error ? cause.message : 'Não foi possível carregar os contatos.' }
  finally { if (current === generation) loading.value = false }
}
async function save() {
  if (busy.value) return
  const current = generation
  busy.value = true; error.value = ''; notice.value = ''
  try {
    const result = await request<{ id: string; created: boolean }>('/v1/contacts', { method: 'POST', body: JSON.stringify(form) }, true)
    if (current !== generation) return
    notice.value = result.created ? 'Contato salvo neste tenant.' : 'Já existe um contato com esse identificador. Nenhum dado foi sobrescrito ou unido automaticamente.'
    Object.assign(form, { name: '', email: '', phone: '' }); page.value = 0; await load()
  } catch (cause) { if (current === generation) error.value = cause instanceof Error ? cause.message : 'Não foi possível salvar.' }
  finally { if (current === generation) busy.value = false }
}
async function history(contact: Contact, append = false) {
  const current = ++historyGeneration
  selected.value = contact; historyLoading.value = true; error.value = ''
  if (!append) { messages.value = []; nextCursor.value = null }
  const cursor = append && nextCursor.value ? '?before=' + encodeURIComponent(nextCursor.value) : ''
  try {
    const result = await request<{ messages: Message[]; next_cursor: string | null }>(`/v1/contacts/${contact.id}/history${cursor}`, {}, true)
    if (current !== historyGeneration) return
    messages.value = append ? [...messages.value, ...result.messages] : result.messages
    nextCursor.value = result.next_cursor
  } catch (cause) { if (current === historyGeneration) error.value = cause instanceof Error ? cause.message : 'Histórico indisponível.' }
  finally { if (current === historyGeneration) historyLoading.value = false }
}
async function paginate(delta: number) { page.value += delta; await load() }
watch(() => [auth.user.value?.id, workspace.activeTenant.value?.id], () => {
  generation++; historyGeneration++; contacts.value = []; selected.value = null; messages.value = []
  nextCursor.value = null; notice.value = ''; error.value = ''; page.value = 0; total.value = 0
  loading.value = false; busy.value = false; historyLoading.value = false
  Object.assign(form, { name: '', email: '', phone: '' })
  if (auth.user.value && workspace.activeTenant.value) void load()
})
onMounted(load)
onBeforeUnmount(() => { generation++; historyGeneration++ })
</script>
<template>
  <div>
    <header class="page-heading"><div><p class="eyebrow">RELACIONAMENTO · SEU TENANT</p><h1>Contatos e histórico.</h1><p>Uma identidade por contato, dentro desta empresa. Cadastrar um contato não representa consentimento para campanhas.</p></div></header>
    <p v-if="error" role="alert" class="form-error">{{ error }}</p><p v-if="notice" role="status" class="live-notice">{{ notice }}</p>
    <form class="panel admin-form" @submit.prevent="save"><h2>Adicionar contato</h2><p>Informe e-mail ou telefone internacional. Identificadores já cadastrados não criam duplicatas.</p><div class="admin-grid"><div class="field"><label for="contact-name">Nome</label><input id="contact-name" v-model="form.name" required maxlength="160" :disabled="busy"></div><div class="field"><label for="contact-email">E-mail</label><input id="contact-email" v-model="form.email" type="email" maxlength="254" :disabled="busy"></div><div class="field"><label for="contact-phone">Telefone com código do país</label><input id="contact-phone" v-model="form.phone" type="tel" placeholder="+55 11 99999-9999" maxlength="30" :disabled="busy"></div></div><button class="button button-primary" :disabled="busy || (!form.email && !form.phone)">{{ busy ? 'Salvando…' : 'Salvar contato' }}</button></form>
    <div class="crm-columns">
      <section class="panel admin-list"><h2>Contatos deste tenant</h2><p v-if="loading" role="status">Carregando…</p><p v-else-if="!contacts.length">Nenhum contato cadastrado.</p><button v-for="contact in contacts" :key="contact.id" class="crm-row" :aria-pressed="selected?.id === contact.id" @click="history(contact)"><strong>{{ contact.display_name }}</strong><small>{{ contact.contact_identities.map(i => i.normalized_value).join(' · ') }}</small></button><div class="admin-actions"><button class="button" :disabled="page === 0 || loading" @click="paginate(-1)">Anterior</button><span>{{ total }} contatos</span><button class="button" :disabled="(page + 1) * 25 >= total || loading" @click="paginate(1)">Próxima</button></div></section>
      <section class="panel admin-list"><h2>{{ selected ? 'Histórico · ' + selected.display_name : 'Histórico de conversas' }}</h2><p v-if="!selected">Selecione um contato para consultar as mensagens já armazenadas.</p><p v-else-if="!messages.length && !historyLoading">Nenhuma mensagem armazenada. A recuperação de conversas externas depende de um conector autorizado e de sincronização implementada; não ocorre apenas ao cadastrar o contato.</p><article v-for="message in messages" :key="message.id"><small>{{ message.direction === 'inbound' ? 'Recebida' : 'Enviada' }} · {{ new Date(message.occurred_at).toLocaleString('pt-BR') }}</small><p class="history-body">{{ message.body_text }}</p></article><p v-if="historyLoading" role="status">Carregando histórico…</p><button v-if="nextCursor && selected" class="button" :disabled="historyLoading" @click="history(selected, true)">Carregar mensagens anteriores</button></section>
    </div>
  </div>
</template>
