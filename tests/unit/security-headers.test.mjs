import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { inlineHashes } from '../../scripts/dashboard-security.mjs'
test('CSP hashes exact Nuxt runtime/importmap contents and excludes remote scripts and JSON data', () => {
  const html = '<script>window.test = 1;</script><script type="importmap">{"imports":{}}</script><script type="application/json">{"user":null}</script><script src="/app.js"></script>'
  assert.deepEqual(inlineHashes(html), ['window.test = 1;', '{"imports":{}}'].map(body => "'sha256-" + createHash('sha256').update(body).digest('base64') + "'").sort())
  assert.notDeepEqual(inlineHashes('<script> a </script>'), inlineHashes('<script>a</script>'))
})
