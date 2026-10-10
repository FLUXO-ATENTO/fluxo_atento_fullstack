<script setup lang="ts">
import { Plus, ArrowRight } from '@lucide/vue'
import { normalizeWebsiteUrl } from '~/utils/website'
const open = ref(false)
const address = ref('')
const message = ref('')
const { addMonitor } = useDemoWorkspace()
const toast = useToast()
function submit() {
  const result = normalizeWebsiteUrl(address.value)
  if (!result.valid) { message.value = result.message; return }
  if (!addMonitor(result.url)) { message.value = 'Este endereço já está na demonstração.'; return }
  open.value = false
  address.value = ''; message.value = ''
  toast.add({ title: 'Adicionado à demonstração', description: 'O endereço não foi acessado. Nenhum monitoramento real foi iniciado.', color: 'success' })
}
</script>
<template>
  <UModal v-model:open="open" title="Experimente adicionar um site" description="O endereço será usado apenas nesta demonstração. Nenhuma página será acessada.">
    <button class="button button-primary"><Plus :size="16" /> Adicionar site</button>
    <template #body><form @submit.prevent="submit"><div class="field"><label for="monitor-url">Endereço do seu site</label><input id="monitor-url" v-model="address" inputmode="url" autocomplete="url" placeholder="sualoja.com.br" :aria-invalid="Boolean(message)" :aria-describedby="message ? 'monitor-error' : 'monitor-hint'" @input="message = ''"><small id="monitor-hint">Use uma página pública, sem senhas ou informações pessoais na URL.</small></div><p v-if="message" id="monitor-error" role="alert" class="form-error">{{ message }}</p><button class="button button-primary button-full" type="submit">Adicionar à demonstração <ArrowRight :size="16" /></button></form></template>
  </UModal>
</template>
