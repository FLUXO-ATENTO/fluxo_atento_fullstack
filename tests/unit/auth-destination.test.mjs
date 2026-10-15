import test from 'node:test'
import assert from 'node:assert/strict'
import { authDestination } from '../../app/utils/auth-destination.ts'

test('the verified platform role chooses the first page after login', () => {
  assert.equal(authDestination(undefined, true, true), '/admin')
  assert.equal(authDestination('/', true, true), '/admin')
  assert.equal(authDestination(undefined, true, false), '/')
  assert.equal(authDestination('/admin', true, false), '/')
  assert.equal(authDestination('/monitores', true, false), '/monitores')
  assert.equal(authDestination(undefined, false, true), '/dashboard/admin')
})
test('post-login navigation rejects external destinations and token-bearing URLs', () => {
  for (const path of ['https://evil.test', '//evil.test', '/admin?token=no', '/\\evil.test']) assert.equal(authDestination(path, true, false), '/')
})
