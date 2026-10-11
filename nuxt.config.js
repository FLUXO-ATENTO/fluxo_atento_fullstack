const dashboardApp = process.env.NUXT_PUBLIC_APP_MODE === 'dashboard'
const dashboardAccessPages = new Set([
  '/login',
  '/auth/callback',
  '/recuperar-acesso',
  '/privacy',
  '/terms'
])

export default defineNuxtConfig({
  compatibilityDate: '2025-09-26',
  devtools: { enabled: false },
  modules: ['@nuxt/ui'],
  components: [{ path: '~/components', pathPrefix: false }],
  ui: { fonts: false, colorMode: false },
  css: ['~/assets/css/design.css', '~/assets/css/workspace.css'],
  app: {
    head: {
      htmlAttrs: { lang: 'pt-BR', class: 'dark' },
      title: 'Fluxo Atento — Seu cliente chegou. O próximo passo funcionou?',
      meta: [
        {
          name: 'description',
          content: 'Entenda os sinais, encontre o contexto e descubra o que vale conferir em seguida.'
        },
        { name: 'theme-color', content: '#0a0a0b' },
        { name: 'color-scheme', content: 'dark' },
        { property: 'og:type', content: 'website' },
        { property: 'og:title', content: 'Fluxo Atento — Seu cliente chegou. O próximo passo funcionou?' },
        {
          property: 'og:description',
          content: 'Conheça a demonstração: entenda os sinais e explore o próximo passo.'
        },
        { property: 'og:image', content: '/icon.svg' },
        { name: 'twitter:card', content: 'summary' },
        { name: 'twitter:title', content: 'Fluxo Atento' },
        { name: 'twitter:description', content: 'Uma nova rotina para cuidar do site e dos clientes. Explore a demonstração.' }
      ],
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/icon.svg' }]
    }
  },
  runtimeConfig: {
    public: {
      appMode: dashboardApp ? 'dashboard' : 'marketing',
      marketingUrl: process.env.NUXT_PUBLIC_MARKETING_URL || 'https://fluxoatento.com.br',
      dashboardUrl: process.env.NUXT_PUBLIC_DASHBOARD_URL || 'https://app.fluxoatento.com.br',
      siteUrl: '',
      supabaseUrl: '',
      supabaseKey: '',
      supabasePublishableKey: '',
      apiBase: 'https://api.fluxoatento.com.br'
    }
  },
  nitro: {
    output: { publicDir: dashboardApp ? 'dist-dashboard' : 'dist' },
    prerender: {
      crawlLinks: true,
      failOnError: true,
      routes: dashboardApp
        ? ['/', '/admin', '/contatos', '/monitores', '/modulos', '/canais', '/configuracoes', '/planos', '/login', '/auth/callback', '/recuperar-acesso', '/privacy', '/terms']
        : ['/', '/privacy', '/terms', '/login', '/auth/callback', '/recuperar-acesso', '/demo', '/exemplo', '/dashboard', '/dashboard/monitores', '/planos']
    }
  },
  hooks: {
    'pages:extend'(pages) {
      if (!dashboardApp) return
      const dashboardPages = pages.filter(page => page.file.replace(/\\/g, '/').includes('/pages/dashboard/'))
      const accessPages = pages.filter(page => dashboardAccessPages.has(page.path))
      for (const page of dashboardPages) page.path = page.path.replace(/^\/dashboard(?=\/|$)/, '') || '/'
      pages.splice(0, pages.length, ...dashboardPages, ...accessPages)
    }
  }
})
