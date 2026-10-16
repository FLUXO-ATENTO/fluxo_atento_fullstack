<script setup lang="ts">
const props = defineProps<{ request: (path: string, init?: RequestInit) => Promise<any> }>()
const gateway = ref<'none' | 'stripe' | 'mercado_pago'>('none')
const loading = ref(true)
const busy = ref(false)
const error = ref('')
const notice = ref('')
onMounted(async () => {
  try { gateway.value = (await props.request('/v1/admin/billing')).billing.gateway }
  catch { error.value = 'Não foi possível consultar a preferência de gateway.' }
  finally { loading.value = false }
})
async function save() {
  if (busy.value) return
  busy.value = true; error.value = ''; notice.value = ''
  try {
    const payload = await props.request('/v1/admin/billing', { method: 'PATCH', body: JSON.stringify({ gateway: gateway.value }) })
    gateway.value = payload.billing.gateway
    notice.value = 'Preferência salva. Nenhuma cobrança foi ativada.'
  } catch { error.value = 'Não foi possível salvar a preferência.' }
  finally { busy.value = false }
}
</script>
<template>
  <div class="billing-sections">
    <section class="panel admin-form"><span class="ui-status ui-status-pending">Cobrança não conectada</span><h2>Pagamentos de todos os tenants</h2><p>Esta visão reunirá transações somente depois que um gateway, seus webhooks assinados e a conciliação estiverem integrados. Hoje não há extrato confiável para mostrar; ausência de linhas não significa ausência de pagamentos externos.</p><div class="note-box"><strong>Próxima ligação necessária</strong><p>Vincular clientes, assinaturas e eventos ao tenant, validar a origem dos webhooks e testar pagamento, falha, reembolso e cancelamento antes de conceder ou retirar acesso.</p></div></section>
    <form class="panel admin-form" @submit.prevent="save"><h2>Gateway preferido</h2><p>Escolha a integração a preparar. Credenciais privadas não entram no navegador nem nesta configuração.</p><p v-if="loading" role="status">Consultando preferência…</p><fieldset v-else class="gateway-options"><legend>Preferência</legend><label><input v-model="gateway" type="radio" value="none" /> Nenhum</label><label><input v-model="gateway" type="radio" value="stripe" /> Stripe</label><label><input v-model="gateway" type="radio" value="mercado_pago" /> Mercado Pago</label></fieldset><button class="button button-primary" :disabled="busy || loading">{{ busy ? 'Salvando…' : 'Salvar preferência' }}</button><p v-if="error" class="form-error" role="alert">{{ error }}</p><p v-if="notice" class="live-notice" role="status">{{ notice }}</p></form>
  </div>
</template>
<style scoped>
.billing-sections { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:20px; }
.gateway-options { display:grid; gap:12px; border:1px solid var(--border); border-radius:var(--radius-md); padding:18px; margin:18px 0; }
.gateway-options legend { color:var(--text); padding-inline:8px; }
.gateway-options label { display:flex; align-items:center; gap:9px; color:var(--text-secondary); }
@media(max-width:850px) { .billing-sections { grid-template-columns:1fr; } }
</style>
