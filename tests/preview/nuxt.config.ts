import { fileURLToPath } from 'node:url'

// Isolated UI test layer. This config is never extended by the production app.
export default defineNuxtConfig({
  extends: ['../..'],
  srcDir: '../../app',
  components: [{ path: fileURLToPath(new URL('../../app/components', import.meta.url)).replaceAll('\\', '/'), pathPrefix: false }],
  buildDir: './.nuxt',
  runtimeConfig: { public: { appMode: 'dashboard', apiBase: '', supabaseUrl: 'https://preview.example.test', supabasePublishableKey: 'sb_publishable_fixture_only' } },
  hooks: {
    'app:resolve'(app) {
      app.plugins = app.plugins.filter(plugin => !plugin.src.replaceAll('\\', '/').endsWith('/app/plugins/supabase.client.ts'))
      app.plugins.push({ src: fileURLToPath(new URL('./fixture.client.ts', import.meta.url)).replaceAll('\\', '/'), mode: 'client' })
    }
  },
  nitro: {
    handlers: [{ route: '/v1/**', handler: fileURLToPath(new URL('./fixture-api.ts', import.meta.url)).replaceAll('\\', '/') }]
  }
})
