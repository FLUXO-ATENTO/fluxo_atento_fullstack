<script setup lang="ts">
import { ArrowRight, Search } from '@lucide/vue'
import { filterHelpArticles, helpArticles, helpCategories, type HelpCategory } from '~/data/help'

useSeoMeta({
  title: 'Ajuda · Fluxo Atento',
  description: 'Entenda a demonstração, os sinais do site, os módulos e os canais previstos. Pesquise orientações para explorar o Fluxo Atento.',
  robots: 'index, follow'
})

const route = useRoute()
const query = ref('')
const category = ref<HelpCategory | 'all'>('all')
const searchInput = ref<HTMLInputElement | null>(null)
const filteredArticles = computed(() => filterHelpArticles(query.value, category.value))
const hasFilters = computed(() => Boolean(query.value.trim()) || category.value !== 'all')
const resultLabel = computed(() => `${filteredArticles.value.length} ${filteredArticles.value.length === 1 ? 'artigo encontrado' : 'artigos encontrados'}`)

function categoryLabel(id: HelpCategory) {
  return helpCategories.find(item => item.id === id)?.label ?? id
}

function clearFilters() {
  query.value = ''
  category.value = 'all'
  searchInput.value?.focus()
}

async function revealLinkedArticle() {
  if (!import.meta.client || !route.hash) return
  let id: string
  try { id = decodeURIComponent(route.hash.slice(1)) } catch { return }
  const article = helpArticles.find(item => item.id === id || item.aliases.includes(id))
  if (!article) return
  query.value = ''
  category.value = 'all'
  await nextTick()
  const target = document.getElementById(article.id)
  target?.focus({ preventScroll: true })
  target?.scrollIntoView({ block: 'start' })
}

onMounted(revealLinkedArticle)
watch(() => route.hash, revealLinkedArticle)
</script>

<template>
  <div class="container">
    <header class="page-hero">
      <p class="eyebrow">AJUDA PARA EXPLORAR</p>
      <h1>Entenda cada passo.</h1>
      <p>Encontre respostas sobre a demonstração, os exemplos de site e o que ainda está em definição. Nenhum canal está conectado nesta versão.</p>
    </header>

    <section class="page-section" aria-label="Pesquisar na ajuda">
      <label for="help-search">O que você quer entender?</label>
      <div class="search-field">
        <Search :size="18" aria-hidden="true" />
        <input id="help-search" ref="searchInput" v-model="query" type="search" maxlength="200" placeholder="Ex.: formulário, WhatsApp, dados" aria-describedby="help-search-hint" aria-controls="help-results">
      </div>
      <p id="help-search-hint" class="article-count">Digite uma ou mais palavras e, se quiser, escolha uma categoria. A busca acontece neste navegador.</p>

      <div class="help-layout">
        <nav class="help-nav" aria-label="Categorias da ajuda">
          <button type="button" :aria-pressed="category === 'all'" aria-controls="help-results" @click="category = 'all'">Todos os assuntos</button>
          <button v-for="item in helpCategories" :key="item.id" type="button" :aria-pressed="category === item.id" aria-controls="help-results" @click="category = item.id">{{ item.label }}</button>
        </nav>

        <div id="help-results" class="min-w-0">
          <p class="article-count" role="status" aria-live="polite" aria-atomic="true">{{ resultLabel }}</p>
          <UButton v-if="hasFilters" type="button" variant="outline" color="neutral" class="mb-5" @click="clearFilters">Limpar busca e categoria</UButton>

          <section v-if="!filteredArticles.length" class="help-article" aria-labelledby="help-empty-title">
            <h2 id="help-empty-title">Nenhum artigo com esses filtros.</h2>
            <p>Tente outra palavra ou escolha todos os assuntos. Você também pode consultar as orientações de suporte.</p>
            <NuxtLink class="text-link" to="/suporte">Abrir suporte <ArrowRight :size="16" aria-hidden="true" /></NuxtLink>
          </section>

          <div v-else class="help-articles">
            <article v-for="article in filteredArticles" :id="article.id" :key="article.id" class="help-article" tabindex="-1" :aria-labelledby="`${article.id}-title`">
              <span v-for="alias in article.aliases" :id="alias" :key="alias" aria-hidden="true" />
              <span class="eyebrow">{{ categoryLabel(article.category) }}</span>
              <h2 :id="`${article.id}-title`">{{ article.title }}</h2>
              <p><strong>{{ article.summary }}</strong></p>
              <p v-for="paragraph in article.paragraphs" :key="paragraph">{{ paragraph }}</p>
              <h3 class="mt-5 text-base">Como continuar</h3>
              <ul><li v-for="step in article.steps" :key="step">{{ step }}</li></ul>
              <div class="flex flex-wrap gap-x-6">
                <NuxtLink class="text-link" :to="article.link.to">{{ article.link.label }} <ArrowRight :size="15" aria-hidden="true" /></NuxtLink>
                <NuxtLink class="text-link" :to="`/ajuda#${article.id}`" :aria-label="`Link para o artigo: ${article.title}`">Link deste artigo</NuxtLink>
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
