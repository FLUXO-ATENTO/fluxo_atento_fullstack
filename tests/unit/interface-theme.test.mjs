import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { Script, createContext } from 'node:vm'
import ts from 'typescript'
import { computed, ref } from 'vue'
import { resolveTheme } from '../../app/utils/workspace-ui.ts'

const designCss = readFileSync(new URL('../../app/assets/css/design.css', import.meta.url), 'utf8')
const nuxtConfig = readFileSync(new URL('../../nuxt.config.js', import.meta.url), 'utf8')

function defaultDesignToken(name) {
  const root = designCss.match(/:root\s*\{([^}]+)\}/)?.[1] || ''
  return root.match(new RegExp(`${name}:\\s*([^;]+)`))?.[1]?.trim()
}

test('site, authentication and dashboard share the approved dark product default', () => {
  assert.equal(defaultDesignToken('--bg'), '#090a0b')
  assert.equal(defaultDesignToken('--brand'), '#eaa176')
  assert.equal(defaultDesignToken('--ui-primary'), 'var(--brand)')
  assert.equal((nuxtConfig.match(/~\/assets\/css\/design\.css/g) || []).length, 1)
  assert.match(nuxtConfig, /theme-color', content: '#090a0b'/)
})

// Exercise the actual composable with Nuxt state and browser preference adapters.
// No real browser, account, storage, network or production API is involved.
const source = readFileSync(new URL('../../app/composables/useInterfacePreferences.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
const key = 'fluxo-interface-theme'
function fixture({ saved = null, systemDark = false, blocked = false } = {}) {
  const states = new Map(), storageEvents = new Set(), mediaEvents = new Set(), writes = []
  const media = {
    matches: systemDark,
    addEventListener: (type, listener) => { assert.equal(type, 'change'); mediaEvents.add(listener) },
    removeEventListener: (type, listener) => { assert.equal(type, 'change'); mediaEvents.delete(listener) }
  }
  const context = createContext({
    exports: {}, computed,
    require: id => { assert.equal(id, '~/utils/workspace-ui'); return { resolveTheme } },
    useState: (name, initial) => { if (!states.has(name)) states.set(name, ref(initial())); return states.get(name) },
    localStorage: {
      getItem: name => { assert.equal(name, key); if (blocked) throw new Error('Storage blocked'); return saved },
      setItem: (name, value) => { assert.equal(name, key); if (blocked) throw new Error('Storage blocked'); saved = value; writes.push(value) }
    },
    window: {
      matchMedia: query => { assert.equal(query, '(prefers-color-scheme: dark)'); return media },
      addEventListener: (type, listener) => { assert.equal(type, 'storage'); storageEvents.add(listener) },
      removeEventListener: (type, listener) => { assert.equal(type, 'storage'); storageEvents.delete(listener) }
    }
  })
  new Script(compiled).runInContext(context)
  return {
    use: context.exports.useInterfacePreferences, writes,
    device: dark => { media.matches = dark; for (const listener of mediaEvents) listener() },
    storage: (newValue, name = key) => { for (const listener of storageEvents) listener({ key: name, newValue }) },
    listeners: () => mediaEvents.size + storageEvents.size
  }
}

test('a fresh visit remains dark before and after initialization on a light device', () => {
  const env = fixture(), theme = env.use()
  assert.equal(theme.theme.value, 'dark')
  assert.equal(theme.effectiveTheme.value, 'dark')
  const cleanup = theme.initialize()
  assert.equal(theme.effectiveTheme.value, 'dark')
  env.device(true); env.device(false)
  assert.equal(theme.effectiveTheme.value, 'dark')
  assert.deepEqual(env.writes, []) // Reading a default must not save an invented choice.
  cleanup()
  assert.equal(env.listeners(), 0)
})

test('saved explicit light, dark and system choices are preserved', () => {
  for (const saved of ['light', 'dark', 'system']) {
    const env = fixture({ saved }), theme = env.use()
    const cleanup = theme.initialize()
    assert.equal(theme.theme.value, saved)
    assert.equal(theme.effectiveTheme.value, saved === 'system' ? 'light' : saved)
    env.device(true)
    assert.equal(theme.effectiveTheme.value, saved === 'system' ? 'dark' : saved)
    assert.deepEqual(env.writes, [])
    cleanup()
  }
})

test('controls and route consumers share an explicit choice without resetting it', () => {
  const env = fixture(), first = env.use()
  const cleanup = first.initialize()
  first.setTheme('light')
  const nextRoute = env.use()
  assert.equal(nextRoute.theme.value, 'light')
  assert.equal(nextRoute.effectiveTheme.value, 'light')
  nextRoute.setTheme('system')
  env.device(true)
  assert.equal(first.effectiveTheme.value, 'dark')
  env.device(false)
  assert.equal(first.effectiveTheme.value, 'light')
  nextRoute.setTheme('dark')
  assert.equal(first.effectiveTheme.value, 'dark')
  assert.deepEqual(env.writes, ['light', 'system', 'dark'])
  cleanup()
})

test('missing or invalid storage falls back to dark, including another tab removing the value', () => {
  const env = fixture({ saved: 'invalid' }), theme = env.use()
  const cleanup = theme.initialize()
  assert.equal(theme.effectiveTheme.value, 'dark')
  env.storage('light')
  assert.equal(theme.effectiveTheme.value, 'light')
  env.storage(null)
  assert.equal(theme.theme.value, 'dark')
  env.storage('light', 'unrelated-preference')
  assert.equal(theme.effectiveTheme.value, 'dark')
  cleanup()
})

test('blocked storage keeps the dark default and allows a session-only manual choice', () => {
  const env = fixture({ blocked: true }), theme = env.use()
  const cleanup = theme.initialize()
  assert.equal(theme.effectiveTheme.value, 'dark')
  theme.setTheme('light')
  assert.equal(theme.effectiveTheme.value, 'light')
  theme.setTheme('dark')
  env.device(false)
  assert.equal(theme.effectiveTheme.value, 'dark')
  assert.deepEqual(env.writes, [])
  cleanup()
})
