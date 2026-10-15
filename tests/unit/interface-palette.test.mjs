import test from 'node:test'
import assert from 'node:assert/strict'
import { interfacePalettes, normalizePalette, paletteVariables, contrastRatio } from '../../app/utils/interface-palette.ts'
import { displayProfile } from '../../app/utils/workspace-ui.ts'

test('brand default is preserved and only four presets plus custom are allowed', () => {
  assert.equal(interfacePalettes.length, 4)
  for (const value of [null, [], 'violet', { id: 'other' }, { id: 'custom', primary: 'red', accent: '#000000' }, { id: 'custom', primary: '#ffffff;display:none', accent: '#000000' }]) assert.deepEqual(normalizePalette(value), { id: 'brand' })
  assert.deepEqual(normalizePalette({ id: 'ocean', role: 'superadmin', primary: 'url(secret)' }), { id: 'ocean' })
  assert.deepEqual(paletteVariables({ id: 'brand' }, 'light'), {})
  assert.deepEqual(paletteVariables({ id: 'brand' }, 'dark'), {})
})
test('preset and custom accents/buttons remain readable in both appearances', () => {
  const choices = [...interfacePalettes, ...['#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff', '#777777', '#ffff00'].map(primary => ({ id: 'custom', primary, accent: primary }))]
  for (const choice of choices.filter(p => p.id !== 'brand')) for (const theme of ['light', 'dark']) {
    const colors = paletteVariables(choice, theme)
    const surface = theme === 'light' ? '#f0f2f5' : '#202123'
    assert.ok(contrastRatio(colors['--brand'], surface) >= 5.5)
    assert.ok(contrastRatio(colors['--workspace-accent'], surface) >= 5.5)
    assert.ok(contrastRatio(colors['--brand'], colors['--button-on-primary']) >= 4.5)
    assert.ok(contrastRatio(colors['--button-primary-hover'], colors['--button-on-primary']) >= 4.5)
  }
})
test('palette is a sanitized per-user preference and cannot introduce authorization data', () => {
  const first = displayProfile({ id: 'first', user_metadata: { fluxo_palette: { id: 'custom', primary: '#ABCDEF', accent: '#123456', role: 'superadmin' } } })
  const second = displayProfile({ id: 'second', user_metadata: {} })
  assert.deepEqual(first.palette, { id: 'custom', primary: '#abcdef', accent: '#123456' })
  assert.deepEqual(second.palette, { id: 'brand' })
  assert.equal(first.role, undefined)
})
