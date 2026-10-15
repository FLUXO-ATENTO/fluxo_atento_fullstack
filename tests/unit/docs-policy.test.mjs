import test from 'node:test'
import assert from 'node:assert/strict'
import { documentationGaps } from '../../scripts/docs-policy.mjs'
test('relevant code changes require a matching documentation update, not any random doc', () => {
  assert.equal(documentationGaps(['app/composables/useAuth.ts', 'README.md'])[0].area, 'authentication')
  assert.deepEqual(documentationGaps(['app/composables/useAuth.ts', 'docs/AUTH_ONBOARDING.md']), [])
  assert.deepEqual(documentationGaps(['app/components/workspace/InterfacePalette.vue', 'app/data/product-docs.ts']), [])
  assert.equal(documentationGaps(['.codex/agents/fluxo-ui.toml'])[0].area, 'agents')
  assert.deepEqual(documentationGaps(['tests/unit/client.test.mjs']), [])
})
