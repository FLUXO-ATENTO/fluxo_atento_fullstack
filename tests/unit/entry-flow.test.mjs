import test from 'node:test'
import assert from 'node:assert/strict'
import { entryDestination, entrySource } from '../../app/utils/entry-flow.ts'
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
