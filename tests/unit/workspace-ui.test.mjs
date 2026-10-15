import test from 'node:test'
import assert from 'node:assert/strict'
import { displayProfile, roleLabel, resolveTheme, addRecentPage, growthSteps } from '../../app/utils/workspace-ui.ts'
import { tenantNavigation, platformNavigation } from '../../app/data/workspace-navigation.ts'
import { searchWorkspaceHelp } from '../../app/data/workspace-help.ts'

test('editable metadata is used only for bounded profile presentation, never roles', () => {
  const profile = displayProfile({ id: 'u', email: 'qa@example.test', user_metadata: { full_name: '  Marina  ', contact_phone: ' 123 ', role: 'superadmin', platform_admin: true, fluxo_tour_version: '1' } })
  assert.deepEqual(profile, { id: 'u', email: 'qa@example.test', displayName: 'Marina', contactPhone: '123', tourVersion: 0, palette: { id: 'brand' } })
  assert.equal(displayProfile(null), null)
  assert.equal(displayProfile({ id: 'u', user_metadata: { full_name: 'a'.repeat(200) } }).displayName.length, 120)
})
test('platform role is not confused with the role in the company panel', () => {
  assert.equal(roleLabel(true, true, 'owner'), 'Superadmin')
  assert.equal(roleLabel(true, false, 'admin'), 'Admin da empresa')
  assert.equal(roleLabel(false, true, 'member'), 'Membro da empresa')
})
test('recent navigation stays bounded and never stores query strings or external URLs', () => {
  let pages = []
  for (let i = 0; i < 8; i++) pages = addRecentPage(pages, { path: '/page-' + i, label: 'Página ' + i })
  assert.equal(pages.length, 5)
  assert.equal(addRecentPage(pages, { path: '/page-6', label: 'Revisitada' })[0].label, 'Revisitada')
  assert.deepEqual(addRecentPage(pages, { path: '/page?secret=no', label: 'Não salvar' }), pages)
  assert.deepEqual(addRecentPage(pages, { path: 'https://example.test', label: 'Externo' }), pages)
})
test('only supported theme values persist and onboarding does not invent completion', () => {
  assert.equal(resolveTheme('light'), 'light')
  assert.equal(resolveTheme('dark'), 'dark')
  assert.equal(resolveTheme('system'), 'system')
  for (const value of [null, undefined, '', 'anything', 'LIGHT', false, {}, ['light']]) assert.equal(resolveTheme(value), 'dark')
  assert.equal(growthSteps.length, 4)
  assert.equal(growthSteps[0].id, 'connect')
})
test('navigation separates platform administration and company operations', () => {
  const tenant = tenantNavigation.flatMap(g => g.items)
  const platform = platformNavigation.flatMap(g => g.items)
  assert.ok(tenant.some(x => x.path === '/dashboard/planos'))
  assert.ok(tenant.some(x => x.path === '/dashboard/ajuda'))
  assert.ok(tenant.some(x => x.path === '/dashboard/monitores'))
  assert.ok(!tenant.some(x => x.path.startsWith('/dashboard/admin')))
  assert.ok(platform.every(x => x.path.startsWith('/dashboard/admin')))
})
test('contextual help supports accents and never treats a search as a sent support ticket', () => {
  assert.ok(searchWorkspaceHelp('conexao').some(x => x.id === 'problema'))
  assert.ok(searchWorkspaceHelp('google').some(x => x.id === 'integracoes'))
  assert.equal(searchWorkspaceHelp('zzzzzzzz').length, 0)
  assert.match(searchWorkspaceHelp('suporte').map(x => x.note).join(' '), /Não existe envio de chamado/)
})
