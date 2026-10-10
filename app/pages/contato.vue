<script setup lang="ts">
import { ArrowRight, ClipboardCopy, FileText } from '@lucide/vue'

useSeoMeta({
  title: 'Preparar um pedido · Fluxo Atento',
  description: 'Organize um pedido sobre o Fluxo Atento e copie o texto no seu dispositivo. Este formulário não envia mensagens.',
  robots: 'index, follow'
})

const name = ref('')
const email = ref('')
const message = ref('')
const errors = ref({ email: '', message: '' })
const preparedText = ref('')
const copying = ref(false)
const copyState = ref<'idle' | 'copied' | 'error'>('idle')
const manualSelected = ref(false)
const emailInput = ref<HTMLInputElement | null>(null)
const messageInput = ref<HTMLTextAreaElement | null>(null)
const preparedInput = ref<HTMLTextAreaElement | null>(null)
let draftVersion = 0

watch([name, email, message], () => {
  draftVersion += 1
  preparedText.value = ''
  copyState.value = 'idle'
  manualSelected.value = false
  errors.value = { email: '', message: '' }
}, { flush: 'sync' })

async function prepareMessage() {
  const cleanEmail = email.value.trim()
  const cleanMessage = message.value.trim()
  errors.value = {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) && cleanEmail.length <= 254
      ? '' : 'Digite um e-mail completo, como voce@exemplo.com.',
    message: cleanMessage.length >= 20 && cleanMessage.length <= 3000
      ? '' : 'Descreva seu pedido com 20 a 3.000 caracteres. Conte o que você precisa ou o que aconteceu.'
  }
  preparedText.value = ''
  copyState.value = 'idle'
  manualSelected.value = false
  if (errors.value.email || errors.value.message) {
    await nextTick()
    if (errors.value.email) emailInput.value?.focus()
    else messageInput.value?.focus()
    return
  }
  preparedText.value = [
    'Pedido sobre o Fluxo Atento',
    ...(name.value.trim() ? [`Nome: ${name.value.trim()}`] : []),
    `E-mail para contato: ${cleanEmail}`,
    '', 'Mensagem:', cleanMessage,
    '', 'Texto preparado localmente. Nenhum envio foi realizado pelo Fluxo Atento.'
  ].join('\n')
  await nextTick()
  preparedInput.value?.focus()
}

async function copyMessage() {
  if (!preparedText.value || copying.value) return
  const version = draftVersion
  const text = preparedText.value
  copying.value = true
  copyState.value = 'idle'
  manualSelected.value = false
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Cópia indisponível')
    await navigator.clipboard.writeText(text)
    if (version === draftVersion) copyState.value = 'copied'
  } catch {
    if (version === draftVersion) {
      copyState.value = 'error'
      await nextTick()
      preparedInput.value?.focus()
      preparedInput.value?.select()
    }
  } finally {
    copying.value = false
  }
}

function selectText() {
  preparedInput.value?.focus()
  preparedInput.value?.select()
  manualSelected.value = true
}
</script>

<template>
  <div class="container">
    <header class="page-hero">
      <p class="eyebrow">CONTATO · PREPARAÇÃO LOCAL</p>
      <h1>Organize seu pedido.</h1>
      <p>Escreva o que você precisa e prepare um texto para copiar. Este formulário não envia mensagens, não escolhe um destinatário e não abre um atendimento.</p>
    </header>

    <div class="contact-layout">
      <section aria-labelledby="contact-guidance-title" class="min-w-0">
        <div class="flow-detail">
          <span class="feature-icon mb-5"><FileText :size="22" aria-hidden="true" /></span>
          <h2 id="contact-guidance-title">O texto fica com você.</h2>
          <p>Conte o que tentou fazer, o que esperava e o que apareceu. Se a dúvida for sobre a proposta do produto, descreva o que você gostaria de entender.</p>
          <p class="mt-4">Depois de preparar, revise o texto e escolha copiar. Você decide onde guardar ou colar; nenhum canal de atendimento está conectado nesta versão.</p>
        </div>
        <p>Não inclua senhas, códigos de acesso, documentos ou informações de clientes. Estes campos não são gravados em uma conta nem no armazenamento local do navegador. Ao sair ou atualizar a página, o rascunho pode se perder.</p>
        <div class="mt-6 flex flex-wrap gap-4">
          <NuxtLink class="text-link" to="/ajuda">Consultar a ajuda <ArrowRight :size="16" aria-hidden="true" /></NuxtLink>
          <NuxtLink class="text-link" to="/suporte">Ver orientações de suporte <ArrowRight :size="16" aria-hidden="true" /></NuxtLink>
        </div>
      </section>

      <section class="contact-form min-w-0" aria-labelledby="contact-form-title">
        <h2 id="contact-form-title">Prepare um pedido para copiar.</h2>
        <p id="contact-notice">Preparar e copiar não envia este pedido. Nome é opcional; e-mail e mensagem são necessários para compor o texto.</p>
        <form novalidate aria-describedby="contact-notice" @submit.prevent="prepareMessage">
          <div class="field">
            <label for="contact-name">Seu nome (opcional)</label>
            <input id="contact-name" v-model="name" type="text" autocomplete="name" maxlength="100" placeholder="Como você prefere ser chamado">
          </div>
          <div class="field">
            <label for="contact-email">E-mail para incluir no pedido</label>
            <input id="contact-email" ref="emailInput" v-model="email" type="email" inputmode="email" autocomplete="email" maxlength="254" required placeholder="voce@exemplo.com" :aria-invalid="Boolean(errors.email)" :aria-describedby="errors.email ? 'contact-email-hint contact-email-error' : 'contact-email-hint'">
            <small id="contact-email-hint">Será incluído apenas no texto que você preparar. Não faremos um envio.</small>
            <p v-if="errors.email" id="contact-email-error" class="form-error" role="alert">{{ errors.email }}</p>
          </div>
          <div class="field">
            <label for="contact-message">O que você precisa?</label>
            <textarea id="contact-message" ref="messageInput" v-model="message" rows="6" minlength="20" maxlength="3000" required placeholder="Descreva sua dúvida ou o que aconteceu ao explorar a demonstração." :aria-invalid="Boolean(errors.message)" :aria-describedby="errors.message ? 'contact-message-hint contact-message-error' : 'contact-message-hint'" />
            <small id="contact-message-hint">De 20 a 3.000 caracteres. Use apenas as informações necessárias para explicar o pedido.</small>
            <p v-if="errors.message" id="contact-message-error" class="form-error" role="alert">{{ errors.message }}</p>
          </div>
          <UButton class="button button-primary" type="submit" :disabled="copying">Preparar pedido <ArrowRight :size="16" aria-hidden="true" /></UButton>
        </form>

        <div aria-live="polite" aria-atomic="true" class="mt-5">
          <p v-if="preparedText && copyState === 'idle' && !manualSelected">Texto preparado para revisão. Nenhum envio foi realizado.</p>
          <p v-if="copyState === 'copied'" class="form-success">Texto copiado para a área de transferência. Nenhum envio foi realizado.</p>
          <p v-if="manualSelected">Texto selecionado. Use o comando Copiar do seu dispositivo.</p>
        </div>

        <section v-if="preparedText" class="mt-6" aria-labelledby="prepared-title">
          <h3 id="prepared-title" class="mb-4 text-lg">Revise antes de copiar.</h3>
          <p v-if="copyState === 'error'" id="clipboard-error" class="form-error" role="alert">Não foi possível copiar automaticamente. Selecione o texto abaixo e use o comando Copiar do seu dispositivo. Nenhum envio foi realizado.</p>
          <div class="field">
            <label for="prepared-message">Seu pedido preparado</label>
            <textarea id="prepared-message" ref="preparedInput" :value="preparedText" rows="10" readonly :aria-describedby="copyState === 'error' ? 'prepared-hint clipboard-error' : 'prepared-hint'" />
            <small id="prepared-hint">Para mudar o texto, edite os campos acima e prepare o pedido novamente.</small>
          </div>
          <div class="flex flex-wrap gap-3">
            <UButton class="button button-primary" type="button" :loading="copying" :disabled="copying" @click="copyMessage"><ClipboardCopy :size="16" aria-hidden="true" /> {{ copying ? 'Copiando texto' : 'Copiar texto' }}</UButton>
            <UButton v-if="copyState === 'error'" type="button" color="neutral" variant="outline" class="button button-secondary" @click="selectText">Selecionar texto</UButton>
          </div>
        </section>
      </section>
    </div>
  </div>
</template>
