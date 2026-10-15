import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { compileScript, compileTemplate, parse } from 'vue/compiler-sfc'
import {
  defaultProductDocSlug, normalizeProductDocSearch, productDocGroups,
  productDocHref, productDocNeighbors, productDocs, productDocsSnapshot,
  productDocStatuses, resolveProductDoc, searchProductDocs
} from '../../app/data/product-docs.ts'

const slugs = results => results.map(article => article.slug)
const textOf = article => JSON.stringify(article)

test('public articles have stable unique addresses, groups, sections and concise procedures', () => {
  assert.equal(new Set(slugs(productDocs)).size, productDocs.length)
  assert.ok(resolveProductDoc(defaultProductDocSlug))
  for (const group of productDocGroups) assert.ok(productDocs.some(article => article.group === group.id))
  for (const article of productDocs) {
    assert.match(article.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    assert.ok(productDocGroups.some(group => group.id === article.group))
    assert.ok(productDocStatuses[article.status])
    assert.ok(article.title.trim() && article.summary.trim())
    assert.ok(article.sections.length > 0)
    assert.equal(new Set(article.sections.map(section => section.id)).size, article.sections.length)
    for (const section of article.sections) {
      assert.match(section.id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      assert.ok(section.title.trim())
      assert.ok([...(section.paragraphs ?? []), ...(section.steps ?? []), ...(section.bullets ?? [])].length)
      if (section.steps) {
        assert.ok(section.steps.length >= 3 && section.steps.length <= 5)
        assert.ok(section.steps.every(step => step.trim().length > 0 && step.length <= 220))
      }
    }
  }
})

test('only an absent article parameter selects the default; malformed links stay not-found', () => {
  assert.equal(resolveProductDoc(undefined)?.slug, defaultProductDocSlug)
  for (const value of [null, '', ' ', 'inexistente', 'PRIMEIROS-PASSOS', [], ['primeiros-passos'], ['primeiros-passos', 'integracoes'], 12, {}, '__proto__', '../../docs/STATUS.md', '<script>alert(1)</script>']) {
    assert.equal(resolveProductDoc(value), null, JSON.stringify(value))
  }
  for (const article of productDocs) assert.equal(resolveProductDoc(article.slug), article)
})

test('deep links round-trip article and section without allowing query injection', () => {
  for (const article of productDocs) {
    for (const section of article.sections) {
      const link = new URL(productDocHref(article.slug, section.id), 'https://example.test')
      assert.equal(link.pathname, '/docs')
      assert.equal(resolveProductDoc(link.searchParams.get('artigo')), article)
      assert.equal(decodeURIComponent(link.hash.slice(1)), section.id)
    }
  }
  const hostileSlug = 'guia&next=https://example.test/#fim'
  const encoded = new URL(productDocHref(hostileSlug, 'seção com espaço'), 'https://example.test')
  assert.deepEqual([...encoded.searchParams.keys()], ['artigo'])
  assert.equal(encoded.searchParams.get('artigo'), hostileSlug)
  assert.equal(decodeURIComponent(encoded.hash.slice(1)), 'seção com espaço')
})

test('search ignores accents, case, punctuation and repeated whitespace', () => {
  assert.equal(normalizeProductDocSearch('  CONEXÃO, PÁGINA!  '), 'conexao pagina')
  assert.deepEqual(slugs(searchProductDocs('INTEGRAÇÕES')), slugs(searchProductDocs('integracoes')))
  assert.deepEqual(slugs(searchProductDocs('verificação página')), slugs(searchProductDocs('VERIFICACAO,   PAGINA')))
  assert.deepEqual(slugs(searchProductDocs('página'.normalize('NFD'))), slugs(searchProductDocs('pagina')))
  assert.ok(slugs(searchProductDocs('conexao')).includes('resolver-uma-dificuldade'))
  assert.ok(slugs(searchProductDocs('google github')).includes('integracoes'))
  assert.ok(slugs(searchProductDocs('http 200')).includes('entender-um-resultado'))
})

test('search covers body and numbered steps, requires every term and handles empty results', () => {
  assert.ok(slugs(searchProductDocs('recarregar painel')).includes('primeiros-passos'))
  assert.ok(slugs(searchProductDocs('horario aproximado')).includes('pedir-ajuda'))
  assert.ok(slugs(searchProductDocs('consulta fontes')).includes('evolucao-dos-guias'))
  assert.equal(searchProductDocs('google palavraquejamaisexiste').length, 0)
  assert.equal(searchProductDocs('zzzzzzzz').length, 0)
  assert.equal(searchProductDocs('?!').length, 0)
  assert.equal(searchProductDocs('🔒').length, 0)
  assert.deepEqual(slugs(searchProductDocs(' \n\t ')), slugs(productDocs))
})

test('short terms match words and direct title matches precede incidental mentions', () => {
  assert.equal(searchProductDocs('IA')[0]?.slug, 'ia-e-atendimento')
  assert.ok(!slugs(searchProductDocs('IA')).includes('exemplo-e-painel'))
  assert.equal(searchProductDocs('privacidade')[0]?.slug, 'privacidade-e-dados')
})

test('search leaves the selected title, body and catalog order unchanged', () => {
  const selected = resolveProductDoc('cadastrar-uma-pagina')
  const beforeArticle = JSON.stringify(selected)
  const beforeCatalog = JSON.stringify(productDocs)
  for (const query of ['senha', 'suporte', '', 'nao-existe', 'IA', '<script>']) searchProductDocs(query)
  searchProductDocs('').reverse()
  assert.equal(JSON.stringify(selected), beforeArticle)
  assert.equal(JSON.stringify(productDocs), beforeCatalog)
  assert.equal(resolveProductDoc('cadastrar-uma-pagina'), selected)
})

test('previous and next stay in the current group with correct endpoints', () => {
  for (const group of productDocGroups) {
    const articles = productDocs.filter(article => article.group === group.id)
    articles.forEach((article, index) => {
      const { previous, next } = productDocNeighbors(article.slug)
      assert.equal(previous, articles[index - 1] ?? null)
      assert.equal(next, articles[index + 1] ?? null)
    })
  }
  assert.deepEqual(productDocNeighbors('inexistente'), { previous: null, next: null })
})

test('related guides resolve and public action links point to existing local routes', () => {
  for (const article of productDocs) {
    for (const related of article.related) {
      assert.ok(resolveProductDoc(related), `${article.slug} -> ${related}`)
      assert.notEqual(related, article.slug)
    }
    for (const link of article.links) {
      assert.match(link.to, /^\/[a-z0-9-]+$/)
      assert.doesNotMatch(link.to, /(?:admin|dashboard|login|api|docs\/)/)
      const page = new URL(`../../app/pages${link.to}.vue`, import.meta.url)
      const index = new URL(`../../app/pages${link.to}/index.vue`, import.meta.url)
      assert.ok(existsSync(page) || existsSync(index), `${article.slug}: ${link.to}`)
    }
  }
})

test('current capability claims remain separate from unpublished UI and future services', () => {
  assert.deepEqual(slugs(productDocs.filter(article => article.status === 'available')), [
    'acessar-minha-conta', 'cadastrar-uma-pagina', 'entender-um-resultado'
  ])
  for (const slug of ['integracoes', 'ia-e-atendimento', 'planos-e-limites']) assert.equal(resolveProductDoc(slug).status, 'planned')
  assert.equal(resolveProductDoc('evolucao-dos-guias').status, 'review')
  assert.match(productDocsSnapshot.live, /senha.*verificação manual.*testados/)
  assert.match(productDocsSnapshot.review, /ainda não foram publicados/)
  assert.match(textOf(resolveProductDoc('acessar-minha-conta')), /cadastro.*recuperação.*validação completa/)
  assert.match(textOf(resolveProductDoc('cadastrar-uma-pagina')), /verificações são manuais/)
  assert.match(textOf(resolveProductDoc('entender-um-resultado')), /Não confirma que uma compra/)
  assert.match(textOf(resolveProductDoc('pedir-ajuda')), /não envia uma mensagem/)
})

test('public copy contains no internal infrastructure references, account identities or raw HTML', () => {
  const publicCopy = JSON.stringify({ productDocs, productDocsSnapshot, productDocGroups })
  assert.doesNotMatch(publicCopy, /\b(?:\d{1,3}\.){3}\d{1,3}\b/)
  assert.doesNotMatch(publicCopy, /[a-z]:[\\/]|\/(?:srv|var|etc|home|root|v1)\//i)
  assert.doesNotMatch(publicCopy, /(?:api|infra|flow|agente|docs)\.fluxoatento\.com\.br|supabase\.co|service_role|sb_secret_|sk-proj-/i)
  assert.doesNotMatch(publicCopy, /[\w.+-]+@[\w.-]+\.[a-z]{2,}/i)
  assert.doesNotMatch(publicCopy, /<\/?[a-z][^>]*>/i)
  const page = readFileSync(new URL('../../app/pages/docs.vue', import.meta.url), 'utf8')
  assert.doesNotMatch(page, /v-html|import\.meta\.glob|fetch\s*\(|localStorage|sessionStorage/)
  assert.match(page, /dashboardEntryUrl\('\/', 'docs'\)/)
})

test('the Docs component parses and compiles in memory with the existing Vue compiler', () => {
  const filename = new URL('../../app/pages/docs.vue', import.meta.url)
  const { descriptor, errors } = parse(readFileSync(filename, 'utf8'), { filename: 'docs.vue' })
  assert.deepEqual(errors, [])
  const script = compileScript(descriptor, { id: 'product-docs-test' })
  const template = compileTemplate({
    source: descriptor.template.content, filename: 'docs.vue', id: 'product-docs-test',
    compilerOptions: { bindingMetadata: script.bindings }
  })
  assert.deepEqual(template.errors, [])
})

test('Docs colors use existing shared theme tokens without a separate palette', () => {
  const css = readFileSync(new URL('../../app/assets/css/product-docs.css', import.meta.url), 'utf8')
  const shared = ['design.css', 'interface.css'].map(file => readFileSync(new URL(`../../app/assets/css/${file}`, import.meta.url), 'utf8')).join('\n')
  const defined = new Set([...shared.matchAll(/(--[a-z0-9-]+)\s*:/gi)].map(match => match[1]))
  for (const [, token] of css.matchAll(/var\((--[a-z0-9-]+)/gi)) assert.ok(defined.has(token), token)
  assert.doesNotMatch(css, /#[\da-f]{3,8}\b|\b(?:rgb|hsl|oklch|oklab)a?\s*\(/i)
})
