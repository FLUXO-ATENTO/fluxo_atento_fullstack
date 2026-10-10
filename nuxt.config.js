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
      siteUrl: '',
      supabaseUrl: '',
      supabaseKey: '',
      supabasePublishableKey: '',
      apiBase: 'https://api.fluxoatento.com.br'
    }
  },
  nitro: {
    output: { publicDir: 'dist' },
    prerender: {
      crawlLinks: true,
      failOnError: true,
      routes: ['/', '/privacy', '/terms', '/login', '/auth/callback', '/recuperar-acesso', '/demo', '/exemplo', '/dashboard', '/dashboard/monitores', '/planos']
    }
  }
})
