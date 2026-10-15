<script setup lang="ts">
import { searchWorkspaceHelp } from '~/data/workspace-help'
definePageMeta({ layout: 'dashboard' })
useSeoMeta({ title: 'Central de ajuda · Fluxo Atento', robots: 'noindex, nofollow' })
const query = ref('')
const articles = computed(() => searchWorkspaceHelp(query.value))
const { dashboardPath, marketingUrl } = useDeployment()
const { tourOpen } = useDashboardChrome()
</script>
<template>
  <div><header class="page-heading"><div><p class="eyebrow">CENTRAL DE AJUDA DO FLUXO ATENTO</p><h1>Uma direção para cada próximo passo.</h1><p>Orientações práticas para usar o painel, sem precisar entender de tecnologia.</p></div><button class="button button-secondary" @click="tourOpen = true"><UIcon name="i-lucide-compass" />Rever guia inicial</button></header>
    <section class="panel help-search"><div class="field"><label for="help-search">Com o que você precisa de ajuda?</label><input id="help-search" v-model="query" type="search" placeholder="Ex.: conectar Google, verificar página, mudar tema…" autocomplete="off"></div><p class="field-help" role="status">{{ articles.length }} orientação(ões) encontrada(s).</p></section>
    <div class="help-articles"><details v-for="article in articles" :key="article.id" class="panel help-article"><summary><span><strong>{{ article.title }}</strong><small>{{ article.summary }}</small></span><UIcon name="i-lucide-chevron-down" /></summary><div class="help-article-body"><ol><li v-for="step in article.steps" :key="step">{{ step }}</li></ol><p class="note-box">{{ article.note }}</p><NuxtLink :to="dashboardPath(article.path)" class="button button-secondary">{{ article.action }}<UIcon name="i-lucide-arrow-right" /></NuxtLink></div></details><p v-if="!articles.length" class="empty-state">Não encontramos uma orientação com esses termos. Tente uma palavra como “site”, “perfil” ou “conexão”.</p></div>
    <section class="note-box"><h2>Orientação oficial dos provedores</h2><p>Antes de autorizar uma conexão Google, confira os dados solicitados. Não compartilhe a senha da conta com outro aplicativo.</p><a href="https://support.google.com/accounts/answer/14012355?hl=pt-BR" target="_blank" rel="noopener noreferrer" class="text-link">Google: entender e revisar permissões <UIcon name="i-lucide-external-link" /><span class="sr-only">Abre em nova aba</span></a><p class="field-help">Referência consultada em 15/10/2026. As instruções deste painel acompanham a versão do produto; recursos em preparação são identificados como tal.</p></section>
    <section class="note-box"><h2>Manual público e contato</h2><p>Consulte os primeiros passos fora do painel ou encaminhe uma dúvida sem enviar senhas e dados de clientes.</p><a :href="marketingUrl + '/docs'" class="text-link">Abrir documentação</a><p><a href="mailto:contato@fluxoatento.com.br" class="text-link">contato@fluxoatento.com.br</a> · Abre seu aplicativo de e-mail; nenhuma mensagem é enviada automaticamente.</p></section>
  </div>
</template>
