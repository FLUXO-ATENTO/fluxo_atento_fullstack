<script setup lang="ts">
const { tourOpen, copilotOpen } = useDashboardChrome()
const auth = useAuth()
const { activeTenant } = useWorkspace()
const step = ref(0); const saving = ref(false); const error = ref('')
let offeredTo = ''
const steps = [
  { icon: 'i-lucide-building-2', title: 'Seu negócio, no seu espaço', text: 'O nome da empresa aparece no menu lateral. O Superadmin opera a plataforma em uma área separada; este painel cuida da sua empresa.' },
  { icon: 'i-lucide-plug', title: 'Comece pelos seus dados', text: 'Na Home, os primeiros passos orientam a conexão de anúncios, a escolha das fontes e a análise do funil. Uma etapa só é concluída quando existe confirmação real.' },
  { icon: 'i-lucide-sparkles', title: 'Uma próxima ação clara', text: 'Use a busca para encontrar páginas. “Fale com a IA” abre o painel à direita; ele indica quando a conexão do copiloto ainda não está liberada.' }
]
watch(() => [auth.user.value?.id, activeTenant.value?.id], () => {
  const user = auth.user.value
  if (user && activeTenant.value && user.tourVersion < 1 && offeredTo !== user.id) {
    offeredTo = user.id; step.value = 0; tourOpen.value = true
  }
}, { immediate: true })
watch(tourOpen, open => { if (open) { step.value = 0; error.value = ''; copilotOpen.value = false } })
async function finish() {
  if (saving.value) return
  saving.value = true; error.value = ''
  try { await auth.updateProfile({ fluxo_tour_version: 1 }); tourOpen.value = false }
  catch { error.value = 'Não conseguimos salvar sua preferência. Tente novamente; você também pode fechar o guia por agora.' }
  finally { saving.value = false }
}
</script>
<template>
  <UModal v-model:open="tourOpen" :title="steps[step]!.title" description="Conheça seu painel em três passos." :ui="{ content: 'workspace-dialog' }">
    <template #body><div class="tour-content"><span class="tour-illustration"><UIcon :name="steps[step]!.icon" aria-hidden="true" /></span><p>{{ steps[step]!.text }}</p><p class="tour-counter" role="status">Passo {{ step + 1 }} de {{ steps.length }}</p><p v-if="error" role="alert" class="form-error">{{ error }}</p></div></template>
    <template #footer><div class="dialog-actions"><button class="button button-secondary" :disabled="saving" @click="step > 0 ? step-- : finish()">{{ step > 0 ? 'Voltar' : 'Pular introdução' }}</button><button class="button button-primary" :disabled="saving" @click="step < steps.length - 1 ? step++ : finish()">{{ saving ? 'Salvando…' : step < steps.length - 1 ? 'Próximo' : 'Começar' }}</button></div></template>
  </UModal>
</template>
