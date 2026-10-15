import test from 'node:test'
import assert from 'node:assert/strict'
import { validateTestDatabaseUrl } from '../database/harness.mjs'

test('database harness accepts only an explicitly authorized disposable loopback DB', () => {
  assert.equal(validateTestDatabaseUrl('postgresql://postgres@127.0.0.1:5432/fluxo_test', '1').pathname, '/fluxo_test')
  for (const value of [
    'postgresql://postgres@db.example.test/fluxo_test',
    'postgresql://postgres@localhost/fluxo_test',
    'postgresql://postgres@127.0.0.1/postgres',
    'postgresql://postgres@127.0.0.1/fluxo_test?host=db.example.test',
    'postgresql://postgres@127.0.0.1/fluxo_test#fragment',
    'postgresql://operator@127.0.0.1/fluxo_test',
    'https://postgres@127.0.0.1/fluxo_test', '',
  ]) assert.throws(() => validateTestDatabaseUrl(value, '1'), /database tests|disposable loopback/)
  assert.throws(() => validateTestDatabaseUrl('postgresql://postgres@127.0.0.1/fluxo_test', undefined), /ALLOW_CREATE/)
})
