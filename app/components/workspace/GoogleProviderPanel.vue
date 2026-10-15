<script setup lang="ts">
import type { GoogleProviderStatus } from '~/utils/google-integration'
import { enabledSocialProviders } from '~/utils/social-auth'

const api = useGoogleApi()
const config = useRuntimeConfig().public
const status = ref<GoogleProviderStatus | null>(null)
const loading = ref(false); const saving = ref(false); const error = ref(''); const notice = ref('')
const confirmOpen = ref(false)
const loginButtonEnabled = computed(() => enabledSocialProviders(config.authProviders).includes('google'))
const label = computed(() => !status.value ? 'Não consultado' : !status.value.ready ? 'Configuração incompleta' : status.value.enabled ? 'Disponível para autorizações' : 'Pronto, mas desativado')
async function load() {
  if (loading.value) return
  loading.value = true; error.value = ''
  try { status.value = await api<GoogleProviderStatus>('/v1/admin/google') }
  catch (cause) { status.value = null; error.value = cause instanceof Error ? cause.message : 'Não foi possível consultar o provedor.' }
  finally { loading.value = false }
}
async function save() {
  if (saving.value || !status.value) return
  const enabled = !status.value.enabled
  saving.value = true; error.value = ''; notice.value = ''
  try {
    await api('/v1/admin/google', { method: 'PATCH', body: JSON.stringify({ enabled }) })
    confirmOpen.value = false
    notice.value = enabled ? 'Autorização Google liberada. Cada empresa ainda precisa conectar sua própria conta.' : 'Integração Google pausada pela plataforma. Isso não altera o login com Google.'
    await load()
  } catch (cause) { error.value = cause instanceof Error ? cause.message : 'Não foi possível salvar.' }
  finally { saving.value = false }
}
onMounted(load)
</script>
<template>
  <section class="panel google-provider-panel" aria-labelledby="google-provider-title">
    <header class="section-topline"><div><p class="eyebrow">PROVEDOR GLOBAL</p><h2 id="google-provider-title">Google, com responsabilidades claras.</h2></div><span class="ui-status">{{ loading ? 'Consultando…' : label }}</span></header>
    <p>O aplicativo é da Fluxo Atento. As contas, propriedades e autorizações de dados pertencem a cada empresa.</p>
    <div class="google-purpose-grid">
      <article><span class="feature-icon"><UIcon name="i-lucide-log-in" /></span><h3>Entrar com Google</h3><p>Supabase cuida da identidade e da sessão. Não pede acesso a Analytics nem a anúncios.</p><span class="ui-status">{{ loginButtonEnabled ? 'Botão habilitado neste build' : 'Botão ainda desabilitado' }}</span><small>A presença do botão não comprova configuração ou teste do provedor no Supabase.</small></article>
      <article><span class="feature-icon"><UIcon name="i-lucide-chart-no-axes-combined" /></span><h3>Conectar dados Google</h3><p>Analytics e Search Console com escopos de leitura, autorização por empresa e credenciais privadas no servidor.</p><small>Google Ads, BigQuery, Gmail e Calendar não fazem parte desta liberação.</small></article>
    </div>
    <p v-if="error" class="form-error" role="alert">{{ error }}</p><p v-if="notice" class="live-notice" role="status">{{ notice }}</p>
    <template v-if="status">
      <h3>Conferência do ambiente privado</h3>
      <ul class="google-checklist"><li v-for="check in status.checks" :key="check.id"><UIcon :name="check.configured ? 'i-lucide-circle-check' : 'i-lucide-circle-dashed'" /><span>{{ check.label }}</span><strong>{{ check.configured ? 'Configurado' : 'Pendente' }}</strong></li></ul>
      <p class="field-help">Esta conferência valida os requisitos locais do servidor. A leitura real de dados só é confirmada ao testar uma conexão autorizada.</p>
      <details class="inline-help"><summary>Endereço de retorno e permissões solicitadas</summary><p>Cadastre este retorno exato no cliente OAuth de integração, separado do retorno do login Supabase:</p><code class="google-callback">{{ status.callback_url }}</code><ul><li v-for="scope in status.scopes" :key="scope"><code>{{ scope }}</code></li></ul><p>Nunca cole Client Secret, tokens ou chaves de criptografia nesta página. Eles pertencem ao ambiente privado da VPS.</p></details>
    </template>
    <div class="google-actions"><button class="button button-secondary" :disabled="loading || saving" @click="load"><UIcon name="i-lucide-refresh-cw" />Conferir configuração</button><button v-if="status" class="button button-primary" :disabled="loading || saving || (!status.ready && !status.enabled)" @click="confirmOpen = true">{{ status.enabled ? 'Pausar integração' : 'Revisar liberação' }}</button></div>
    <UModal v-model:open="confirmOpen" :title="status?.enabled ? 'Pausar a integração Google?' : 'Liberar autorização Google?'" description="Esta alteração vale para as empresas da plataforma, não para o login." :ui="{ content: 'workspace-dialog' }"><template #body><p>{{ status?.enabled ? 'A consulta pela integração ficará pausada. As autorizações existentes não serão revogadas no Google por esta ação.' : 'As empresas poderão autorizar a leitura de Analytics e Search Console. Nenhuma conta será conectada automaticamente, e nenhuma campanha será modificada.' }}</p><p v-if="error" class="form-error" role="alert">{{ error }}</p></template><template #footer><div class="dialog-actions"><button class="button button-secondary" :disabled="saving" @click="confirmOpen = false">Cancelar</button><button class="button button-primary" :disabled="saving" @click="save">{{ saving ? 'Salvando…' : 'Confirmar alteração' }}</button></div></template></UModal>
  </section>
</template>
