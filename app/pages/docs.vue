<script setup lang="ts">
import { ArrowLeft, ArrowRight, BookOpen, ChevronDown, ChevronRight, FileText, Info, Link2, List, Search, X } from '@lucide/vue'
import {
  defaultProductDocSlug, productDocGroups, productDocHref, productDocNeighbors,
  productDocs, productDocsSnapshot, productDocStatuses, resolveProductDoc, searchProductDocs
} from '~/data/product-docs'
import '~/assets/css/product-docs.css'

const route = useRoute()
const { dashboardEntryUrl } = useDeployment()
const searchQuery = ref('')
const searchInput = ref<HTMLInputElement | null>(null)
const navigationTrigger = ref<HTMLButtonElement | null>(null)
const articleHeading = ref<HTMLElement | null>(null)
const mobileNavigationOpen = ref(false)
const hasSearch = computed(() => Boolean(searchQuery.value.trim()))
const searchResults = computed(() => searchProductDocs(searchQuery.value))
const article = computed(() => resolveProductDoc(route.query.artigo))
const articleGroup = computed(() => productDocGroups.find(group => group.id === article.value?.group))
const neighbors = computed(() => productDocNeighbors(article.value?.slug ?? ''))
const relatedArticles = computed(() => productDocs.filter(item => article.value?.related.includes(item.slug)))
const navigationGroups = productDocGroups.map(group => ({ ...group, articles: productDocs.filter(item => item.group === group.id) }))

useSeoMeta({
  title: () => `${article.value?.title ?? 'Artigo não encontrado'} · Docs · Fluxo Atento`,
  description: () => article.value?.summary ?? 'Escolha um guia público sobre acesso, monitoramento e próximos passos no Fluxo Atento.',
  robots: () => article.value ? 'index, follow' : 'noindex, follow'
})

async function focusArticle() {
  await nextTick()
  articleHeading.value?.focus({ preventScroll: true })
  articleHeading.value?.scrollIntoView({ block: 'start', behavior: 'instant' })
}

watch(() => route.query.artigo, async () => {
  searchQuery.value = ''
  mobileNavigationOpen.value = false
  await focusArticle()
}, { flush: 'post' })

// Same-article links also dismiss discovery, while modified clicks keep native new-tab behavior.
function selectArticle(event: MouseEvent, slug: string) {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  if (article.value?.slug === slug) {
    searchQuery.value = ''
    mobileNavigationOpen.value = false
    void focusArticle()
  }
}

function clearSearch() {
  searchQuery.value = ''
  searchInput.value?.focus()
}

function closeNavigation() {
  if (!mobileNavigationOpen.value) return
  mobileNavigationOpen.value = false
  if (navigationTrigger.value?.getClientRects().length) navigationTrigger.value.focus()
}
</script>

<template>
  <div class="product-docs container">
    <header class="product-docs-hero">
      <div>
        <p class="eyebrow"><BookOpen :size="17" aria-hidden="true" /> GUIAS DO PRODUTO</p>
        <h1>Um guia para cada próximo passo.</h1>
        <p class="product-docs-intro">Entre na sua conta, acompanhe uma página e entenda o que o Fluxo Atento já faz. Tudo em uma linguagem simples, no seu ritmo.</p>
      </div>
      <a :href="dashboardEntryUrl('/', 'docs')" class="button button-secondary">Acessar meu painel <ArrowRight :size="16" aria-hidden="true" /></a>
    </header>

    <form class="product-docs-search" role="search" aria-label="Buscar na documentação pública" @submit.prevent>
      <label for="product-docs-search">O que você quer fazer?</label>
      <div class="product-docs-search-field">
        <Search :size="21" aria-hidden="true" />
        <input id="product-docs-search" ref="searchInput" v-model="searchQuery" type="search" maxlength="160" autocomplete="off" placeholder="Busque por acesso, página, resultado…" aria-describedby="product-docs-search-hint" aria-controls="product-docs-search-results" @keydown.esc.prevent="clearSearch">
        <button v-if="searchQuery" type="button" aria-label="Limpar busca" @click="clearSearch"><X :size="18" aria-hidden="true" /></button>
      </div>
      <p id="product-docs-search-hint">Busque nos {{ productDocs.length }} guias, com ou sem acentos. A busca não consulta dados da sua conta.</p>
    </form>

    <div class="product-docs-search-announcement" role="status" aria-live="polite" aria-atomic="true">
      <span v-if="hasSearch">{{ searchResults.length === 1 ? '1 guia encontrado.' : `${searchResults.length} guias encontrados.` }} O artigo aberto continua abaixo.</span>
    </div>
    <section v-show="hasSearch" id="product-docs-search-results" class="product-docs-results" aria-labelledby="product-docs-results-title">
      <div class="product-docs-results-heading">
        <h2 id="product-docs-results-title">{{ searchResults.length ? 'Guias encontrados' : 'Nenhum guia encontrado' }}</h2>
        <button type="button" class="product-docs-text-button" @click="clearSearch">Limpar busca</button>
      </div>
      <p v-if="!searchResults.length" class="product-docs-empty">Tente uma palavra como “senha”, “página” ou “suporte”. Você também pode explorar os assuntos abaixo.</p>
      <ul v-else class="product-docs-result-list">
        <li v-for="result in searchResults" :key="result.slug">
          <NuxtLink :to="productDocHref(result.slug)" @click="selectArticle($event, result.slug)">
            <span class="product-docs-result-topic">{{ productDocGroups.find(group => group.id === result.group)?.title }} · {{ productDocStatuses[result.status] }}</span>
            <strong>{{ result.title }} <ArrowRight :size="16" aria-hidden="true" /></strong>
            <span>{{ result.summary }}</span>
          </NuxtLink>
        </li>
      </ul>
    </section>

    <aside class="product-docs-release" aria-labelledby="product-docs-release-title">
      <Info :size="20" aria-hidden="true" />
      <div>
        <h2 id="product-docs-release-title">O que você pode usar hoje</h2>
        <p>{{ productDocsSnapshot.live }} {{ productDocsSnapshot.review }}</p>
        <p>{{ productDocsSnapshot.planned }}</p>
        <small>Base consultada em <time :datetime="productDocsSnapshot.date">{{ productDocsSnapshot.label }}</time>.</small>
      </div>
    </aside>

    <div class="product-docs-layout">
      <aside class="product-docs-sidebar">
        <a class="product-docs-skip" href="#product-docs-article-title">Pular para o artigo <ArrowRight :size="15" aria-hidden="true" /></a>
        <button ref="navigationTrigger" type="button" class="product-docs-mobile-toggle" :aria-expanded="mobileNavigationOpen" aria-controls="product-docs-navigation" @click="mobileNavigationOpen = !mobileNavigationOpen" @keydown.esc.stop.prevent="closeNavigation">
          <List :size="19" aria-hidden="true" /><span>Explorar assuntos</span><ChevronDown :size="18" aria-hidden="true" :class="{ 'is-open': mobileNavigationOpen }" />
        </button>
        <nav id="product-docs-navigation" class="product-docs-navigation" :class="{ 'is-open': mobileNavigationOpen }" aria-label="Guias por assunto" @keydown.esc.stop.prevent="closeNavigation">
          <section v-for="group in navigationGroups" :key="group.id" :aria-labelledby="`product-docs-group-${group.id}`">
            <h2 :id="`product-docs-group-${group.id}`">{{ group.title }}</h2>
            <ul>
              <li v-for="item in group.articles" :key="item.slug">
                <NuxtLink :to="productDocHref(item.slug)" :aria-current="article?.slug === item.slug ? 'page' : undefined" @click="selectArticle($event, item.slug)">{{ item.title }}<ChevronRight v-if="article?.slug === item.slug" :size="15" aria-hidden="true" /></NuxtLink>
              </li>
            </ul>
          </section>
          <div class="product-docs-sidebar-help">
            <BookOpen :size="19" aria-hidden="true" /><p>Ficou alguma dúvida?</p>
            <NuxtLink to="/contato">Prepare um pedido de ajuda <ArrowRight :size="15" aria-hidden="true" /></NuxtLink>
          </div>
        </nav>
      </aside>

      <div class="product-docs-reading">
        <article v-if="article" class="product-docs-article" aria-labelledby="product-docs-article-title">
          <header class="product-docs-article-header">
            <div class="product-docs-article-meta"><span>{{ articleGroup?.title }}</span><span class="product-docs-status" :data-status="article.status">{{ productDocStatuses[article.status] }}</span></div>
            <h2 id="product-docs-article-title" ref="articleHeading" tabindex="-1">{{ article.title }}</h2>
            <p class="product-docs-summary">{{ article.summary }}</p>
            <NuxtLink class="product-docs-permalink" :to="productDocHref(article.slug)" :aria-label="`Link direto para ${article.title}`"><Link2 :size="15" aria-hidden="true" /> Link direto deste guia</NuxtLink>
          </header>

          <nav class="product-docs-outline" aria-label="Neste guia">
            <p>Neste guia</p>
            <ul><li v-for="section in article.sections" :key="section.id"><NuxtLink :to="productDocHref(article.slug, section.id)">{{ section.title }}</NuxtLink></li></ul>
          </nav>

          <section v-for="section in article.sections" :key="`${article.slug}-${section.id}`" class="product-docs-section" :aria-labelledby="section.id">
            <h3 :id="section.id">{{ section.title }}<NuxtLink :to="productDocHref(article.slug, section.id)" :aria-label="`Link para ${section.title}`"><Link2 :size="16" aria-hidden="true" /></NuxtLink></h3>
            <p v-for="paragraph in section.paragraphs" :key="paragraph">{{ paragraph }}</p>
            <ol v-if="section.steps" class="product-docs-steps"><li v-for="step in section.steps" :key="step">{{ step }}</li></ol>
            <ul v-if="section.bullets" class="product-docs-bullets"><li v-for="bullet in section.bullets" :key="bullet">{{ bullet }}</li></ul>
          </section>

          <aside class="product-docs-note" :aria-label="article.note.title"><Info :size="19" aria-hidden="true" /><div><h3>{{ article.note.title }}</h3><p>{{ article.note.text }}</p></div></aside>

          <nav v-if="article.links.length" class="product-docs-links" aria-label="Continuar no site"><NuxtLink v-for="link in article.links" :key="link.to" :to="link.to">{{ link.label }}<ArrowRight :size="16" aria-hidden="true" /></NuxtLink></nav>
        </article>

        <section v-else class="product-docs-article product-docs-not-found" aria-labelledby="product-docs-article-title">
          <FileText :size="32" aria-hidden="true" />
          <h2 id="product-docs-article-title" ref="articleHeading" tabindex="-1">Não encontramos este guia.</h2>
          <p>O endereço não corresponde a um artigo desta documentação. Escolha um assunto no menu, use a busca ou volte ao primeiro guia.</p>
          <NuxtLink class="button button-secondary" :to="productDocHref(defaultProductDocSlug)">Começar pelos primeiros passos <ArrowRight :size="16" aria-hidden="true" /></NuxtLink>
        </section>

        <nav v-if="article && (neighbors.previous || neighbors.next)" class="product-docs-pagination" aria-label="Continuar neste assunto">
          <NuxtLink v-if="neighbors.previous" :to="productDocHref(neighbors.previous.slug)"><ArrowLeft :size="19" aria-hidden="true" /><span><small>Anterior · {{ articleGroup?.title }}</small><strong>{{ neighbors.previous.title }}</strong></span></NuxtLink>
          <NuxtLink v-if="neighbors.next" class="product-docs-next" :to="productDocHref(neighbors.next.slug)"><span><small>Próximo · {{ articleGroup?.title }}</small><strong>{{ neighbors.next.title }}</strong></span><ArrowRight :size="19" aria-hidden="true" /></NuxtLink>
        </nav>

        <section v-if="relatedArticles.length" class="product-docs-related" aria-labelledby="product-docs-related-title">
          <h2 id="product-docs-related-title">Também pode ajudar</h2>
          <ul><li v-for="related in relatedArticles" :key="related.slug"><NuxtLink :to="productDocHref(related.slug)"><FileText :size="18" aria-hidden="true" /><span>{{ related.title }}</span><ArrowRight :size="16" aria-hidden="true" /></NuxtLink></li></ul>
        </section>
      </div>
    </div>
  </div>
</template>
