<script setup lang="ts">
import { platformNavigation, tenantNavigation } from '~/data/workspace-navigation'
import { roleLabel } from '~/utils/workspace-ui'
import { normalizePalette, paletteVariables } from '~/utils/interface-palette'
const route = useRoute()
const auth = useAuth()
const { effectiveTheme } = useInterfacePreferences()
const palette = computed(() => normalizePalette(auth.user.value?.palette))
useHead(() => ({ htmlAttrs: {
  'data-workspace-palette': palette.value.id,
  style: Object.entries(paletteVariables(palette.value, effectiveTheme.value)).map(([name, value]) => `${name}:${value}`).join(';')
} }))
const config = useRuntimeConfig().public
const { isDashboardApp, marketingUrl, dashboardPath } = useDeployment()
const workspace = useWorkspace()
const { activeTenant, platformAdmin, loading, error: workspaceError } = workspace
const { copilotOpen, tourOpen, visit } = useDashboardChrome()
const platformArea = computed(() => route.path === dashboardPath('/dashboard/admin'))
const groups = computed(() => platformArea.value && platformAdmin.value ? platformNavigation : tenantNavigation)
const allLinks = computed(() => groups.value.flatMap(g => g.items))
const activePath = computed(() => route.path + (route.query.secao ? '?secao=' + route.query.secao : route.query.grupo ? '?grupo=' + route.query.grupo : ''))
const current = computed(() => allLinks.value.find(item => dashboardPath(item.path) === activePath.value)?.label || 'Meu espaço')
const role = computed(() => roleLabel(platformAdmin.value, platformArea.value, activeTenant.value?.role))
const mobileOpen = ref(false); const searchOpen = ref(false); const search = ref('')
const accountOpen = ref(false); const logoutOpen = ref(false); const notificationsOpen = ref(false)
const supportOpen = ref(false)
const exitBusy = ref(false); const exitError = ref('')
const health = ref<'checking' | 'online' | 'offline'>('checking')
const healthLabel = computed(() => ({ checking: 'Verificando API', online: 'API disponível', offline: 'API sem resposta' })[health.value])
const searchResults = computed(() => allLinks.value.filter(item => item.label.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(search.value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase())))
let healthController: AbortController | null = null
let healthTimer: ReturnType<typeof setInterval> | undefined
async function checkHealth() {
  if (document.visibilityState !== 'visible' || healthController) return
  healthController = new AbortController()
  try {
    const response = await fetch(String(config.apiBase).replace(/\/$/, '') + '/v1/health', { cache: 'no-store', signal: AbortSignal.any([healthController.signal, AbortSignal.timeout(8000)]) })
    const body = await response.json()
    health.value = response.ok && body.status === 'ok' ? 'online' : 'offline'
  } catch { health.value = 'offline' }
  finally { healthController = null }
}
async function exit() {
  if (exitBusy.value) return
  exitBusy.value = true; exitError.value = ''
  try { await auth.signOut() }
  catch { exitError.value = 'Não foi possível encerrar a sessão. Tente novamente.' }
  finally { exitBusy.value = false }
}
function shortcut(event: KeyboardEvent) {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k' && !event.isComposing) {
    event.preventDefault(); searchOpen.value = !searchOpen.value
  }
}
watch(searchOpen, value => { if (value) search.value = '' })
watch(() => auth.user.value?.id, value => {
  if (auth.ready.value && !value) void navigateTo('/login')
  else if (value) void workspace.ensure()
})
watch(() => route.fullPath, () => { mobileOpen.value = false; searchOpen.value = false })
watch([activePath, () => auth.user.value?.id, activeTenant], () => {
  if (auth.user.value && activeTenant.value && !platformArea.value && allLinks.value.some(item => dashboardPath(item.path) === activePath.value)) visit(route.path, current.value)
}, { immediate: true })
onMounted(() => { void workspace.ensure(); void checkHealth(); healthTimer = setInterval(() => void checkHealth(), 60000); window.addEventListener('keydown', shortcut) })
onBeforeUnmount(() => { clearInterval(healthTimer); healthController?.abort(); window.removeEventListener('keydown', shortcut) })
</script>
<template>
  <div class="workspace workspace-modern">
    <a class="skip-link" href="#conteudo">Pular para o conteúdo</a>
    <aside class="app-sidebar">
      <a :href="isDashboardApp ? marketingUrl : '/'" aria-label="Fluxo Atento — início"><BrandLogo /></a>
      <div class="workspace-context"><span class="context-icon"><UIcon :name="platformArea ? 'i-lucide-shield-check' : 'i-lucide-building-2'" /></span><div><strong>{{ platformArea ? 'Fluxo Atento' : activeTenant?.name || 'Preparando espaço…' }}</strong><small>{{ role }}</small></div></div>
      <WorkspaceNavigation :groups="groups" :active-path="activePath" />
      <div class="sidebar-bottom">
        <div class="dedicated-help"><strong>Precisa de uma direção?</strong><p>Ajuda prática para o seu próximo passo.</p><NuxtLink :to="dashboardPath('/dashboard/ajuda')">Abrir central de ajuda <UIcon name="i-lucide-arrow-up-right" /></NuxtLink><button @click="supportOpen = true">Suporte da plataforma <UIcon name="i-lucide-life-buoy" /></button></div>
        <NuxtLink v-if="platformArea && platformAdmin" class="context-switch" :to="dashboardPath('/dashboard')"><UIcon name="i-lucide-building-2" />Ir ao painel da empresa</NuxtLink>
        <button class="sidebar-guide" @click="tourOpen = true"><UIcon name="i-lucide-circle-help" />Rever guia inicial</button>
        <div class="sidebar-identity"><span class="user-avatar">{{ (auth.user.value?.displayName || 'F').slice(0, 1).toUpperCase() }}</span><span><strong>{{ auth.user.value?.displayName || 'Minha conta' }}</strong><small>{{ role }}</small></span></div>
      </div>
    </aside>
    <div class="workspace-body">
      <header class="app-topbar">
        <button class="icon-button mobile-sidebar-trigger" aria-label="Abrir navegação" @click="mobileOpen = true"><UIcon name="i-lucide-menu" /></button>
        <div class="breadcrumb"><span>{{ platformArea ? 'Plataforma' : 'Minha empresa' }}</span><UIcon name="i-lucide-chevron-right" /><strong>{{ current }}</strong></div>
        <div class="topbar-actions">
          <button class="workspace-search" aria-label="Buscar páginas, Control K" @click="searchOpen = true"><UIcon name="i-lucide-search" /><span>Buscar</span><kbd>Ctrl K</kbd></button>
          <span class="health-indicator" :class="'health-' + health" :title="healthLabel + '. Este indicador verifica a API, não os provedores externos.'" role="status"><span /><span class="sr-only">{{ healthLabel }}</span></span>
          <button class="button button-primary copilot-trigger" @click="copilotOpen = true"><UIcon name="i-lucide-sparkles" /><span>Fale com a IA</span></button>
          <button class="icon-button" aria-label="Abrir notificações" @click="notificationsOpen = true"><UIcon name="i-lucide-bell" /></button>
          <button class="icon-button" aria-label="Abrir suporte da plataforma" @click="supportOpen = true"><UIcon name="i-lucide-life-buoy" /></button>
          <ThemeMenu />
          <button class="account-trigger" :aria-label="'Abrir menu da conta, ' + role" @click="accountOpen = true"><span class="user-avatar">{{ (auth.user.value?.displayName || 'F').slice(0, 1).toUpperCase() }}</span><UIcon name="i-lucide-chevron-down" /></button>
        </div>
      </header>
      <main id="conteudo" class="workspace-content" tabindex="-1">
        <div v-if="!auth.ready.value || !auth.user.value || loading && !activeTenant" class="empty-state" role="status">Conferindo seu acesso…</div>
        <div v-else-if="workspaceError || !activeTenant" class="empty-state"><h1>Não conseguimos abrir seu espaço.</h1><p role="alert">{{ workspaceError || 'Sua empresa ainda não foi carregada.' }}</p><button class="button button-secondary" @click="workspace.load()">Tentar novamente</button></div>
        <div v-else-if="platformArea && !platformAdmin" class="empty-state"><h1>Acesso reservado à administração da plataforma.</h1><p>Você pode continuar no painel da sua empresa.</p><NuxtLink class="button button-primary" :to="dashboardPath('/dashboard')">Voltar ao meu painel</NuxtLink></div>
        <slot v-else />
      </main>
    </div>
    <USlideover v-model:open="mobileOpen" side="left" title="Seu painel" description="Encontre a próxima ação." :ui="{ content: 'workspace-drawer' }"><template #body><WorkspaceNavigation :groups="groups" :active-path="activePath" @navigate="mobileOpen = false" /><NuxtLink v-if="platformArea && platformAdmin" class="context-switch" :to="dashboardPath('/dashboard')">Ir ao painel da empresa</NuxtLink></template></USlideover>
    <UModal v-model:open="searchOpen" title="Para onde vamos?" description="Busque uma página disponível para sua conta." :ui="{ content: 'workspace-dialog' }"><template #body><div class="field"><label for="workspace-search-input">Buscar páginas</label><input id="workspace-search-input" v-model="search" type="search" placeholder="Ex.: integrações, perfil…" autocomplete="off"></div><div class="search-results"><NuxtLink v-for="item in searchResults" :key="item.path" :to="dashboardPath(item.path)" @click="searchOpen = false"><UIcon :name="item.icon" /><span>{{ item.label }}</span><small v-if="item.planned">Em preparação</small><UIcon name="i-lucide-arrow-up-right" /></NuxtLink><p v-if="!searchResults.length" role="status">Nenhuma página encontrada. Tente outro termo.</p></div></template></UModal>
    <UModal v-model:open="accountOpen" title="Sua conta" :description="auth.user.value?.email || 'Sessão autenticada'" :ui="{ content: 'workspace-dialog' }"><template #body><div class="account-summary"><strong>{{ auth.user.value?.displayName || 'Minha conta' }}</strong><span class="ui-status">{{ role }}</span></div><InterfaceTheme /><div class="settings-line"><span>Idioma da interface</span><span>Português (Brasil)</span></div><p class="field-help">Inglês, espanhol e italiano estão no planejamento. Sua escolha de aparência fica salva neste navegador.</p><div class="note-box"><strong>Presença e licenciamento</strong><p>A distribuição de atendimentos e o serviço de licenças ainda não estão conectados. Não há status online nem licença ativa presumidos.</p></div><div class="account-links"><NuxtLink :to="dashboardPath('/dashboard/configuracoes')" @click="accountOpen = false">Meu perfil e preferências <UIcon name="i-lucide-arrow-right" /></NuxtLink><NuxtLink :to="dashboardPath('/dashboard/recursos?grupo=administracao')" @click="accountOpen = false">Histórico e auditoria · em preparação <UIcon name="i-lucide-arrow-right" /></NuxtLink><button @click="accountOpen = false; logoutOpen = true">Sair desta sessão <UIcon name="i-lucide-log-out" /></button></div></template></UModal>
    <UModal v-model:open="logoutOpen" title="Sair desta sessão?" description="Seu trabalho salvo será mantido." :ui="{ content: 'workspace-dialog' }"><template #body><p>Você precisará entrar novamente neste navegador. A presença de atendimento será uma configuração separada; sair nunca mantém uma sessão aberta.</p><p v-if="exitError" role="alert" class="form-error">{{ exitError }}</p></template><template #footer><div class="dialog-actions"><button class="button button-secondary" :disabled="exitBusy" @click="logoutOpen = false">Continuar no painel</button><button class="button button-danger" :disabled="exitBusy" @click="exit">{{ exitBusy ? 'Saindo…' : 'Sair da conta' }}</button></div></template></UModal>
    <UModal v-model:open="notificationsOpen" title="Notificações" description="Atualizações do seu espaço." :ui="{ content: 'workspace-dialog' }"><template #body><div class="note-box"><span class="ui-status ui-status-pending">Em preparação</span><h2>Uma central para resumos e mensagens.</h2><p>O serviço de notificações ainda não está conectado. Quando estiver disponível, cada aviso terá origem, data e estado de leitura.</p></div></template></UModal>
    <WorkspaceTour v-if="auth.user.value && activeTenant" /><CopilotDrawer /><SupportDrawer v-model:open="supportOpen" />
  </div>
</template>
