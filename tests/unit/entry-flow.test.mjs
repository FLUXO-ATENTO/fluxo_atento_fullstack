import test from 'node:test'
import assert from 'node:assert/strict'
import { entryDestination, entrySource, dashboardEntryRoute } from '../../app/utils/entry-flow.ts'
test('the shared entry accepts only local app paths without redirect loops or credentials', () => {
  assert.equal(entryDestination('/assistente'), '/assistente')
  assert.equal(entryDestination('/monitores'), '/monitores')
  for (const value of ['//evil.test', 'https://evil.test', '/login', '/acessar', '/auth/callback', '/recuperar-acesso', '/?token=private', '/a/../b', ['/assistente'], null]) assert.equal(entryDestination(value), '/')
  assert.equal(entryDestination('/dashboard/monitores', false), '/dashboard/monitores')
})
test('entry origin is a fixed label, never an external return URL', () => {
  assert.equal(entrySource('docs'), 'docs'); assert.equal(entrySource('agente'), 'agente')
  assert.equal(entrySource('https://evil.test'), 'site'); assert.equal(entrySource(null), 'site')
})
test('public entry stays compatible with the live login before the guided release', () => {
  for (const path of ['/', '/assistente', '/canais', '/admin', 'https://evil.test']) {
    for (const source of ['site', 'docs', 'agente']) {
      assert.equal(dashboardEntryRoute(path, source, false), `/login/?next=%2F&origem=${source}`)
    }
  }
})
test('accepted guided entry preserves a safe destination and never copies secrets', () => {
  assert.equal(dashboardEntryRoute('/assistente', 'agente', true), '/acessar?next=%2Fassistente&origem=agente')
  assert.equal(dashboardEntryRoute('/canais', 'docs', true), '/acessar?next=%2Fcanais&origem=docs')
  for (const guided of [false, true]) {
    for (const path of ['//evil.test', '/login', '/acessar', '/?token=private', null]) {
      assert.equal(dashboardEntryRoute(path, 'https://evil.test', guided), `${guided ? '/acessar' : '/login/'}?next=%2F&origem=site`)
    }
  }
})
