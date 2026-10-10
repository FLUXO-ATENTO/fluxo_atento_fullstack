export default defineNuxtConfig({
  compatibilityDate: '2025-09-26',
  devtools: { enabled: false },
  modules: ['@nuxt/ui'],
  ui: { fonts: false, colorMode: false },
  css: ['~/assets/css/design.css'],
  app: {
    head: {
      htmlAttrs: { lang: 'pt-BR', class: 'dark' },
      title: 'Fluxo Atento — Inteligência e monitoramento de sites',
      meta: [
        {
          name: 'description',
          content: 'Observe sinais técnicos de uma página, transforme mudanças em informação compreensível e saiba quando algo importante acontecer.'
        },
        { name: 'theme-color', content: '#0a0a0b' },
        { name: 'color-scheme', content: 'dark' },
        { property: 'og:type', content: 'website' },
        { property: 'og:title', content: 'Fluxo Atento — Seu site muda. O Fluxo Atento percebe.' },
        {
          property: 'og:description',
          content: 'Inteligência e monitoramento de sites pelo olhar do navegador.'
        },
        { property: 'og:image', content: '/icon.svg' },
        { name: 'twitter:card', content: 'summary' },
        { name: 'twitter:title', content: 'Fluxo Atento' },
        { name: 'twitter:description', content: 'Observação inteligente de sites.' }
      ],
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/icon.svg' }]
    }
  },
  runtimeConfig: {
    public: {
      siteUrl: '',
      supabaseUrl: '',
      supabaseKey: '',
      supabasePublishableKey: ''
    }
  },
  nitro: {
    prerender: {
      routes: ['/', '/privacy', '/terms', '/login', '/demo']
    }
  }
})
