export const documentationRules = [
  { id: 'authentication', source: /^(app\/(?:composables\/useAuth|plugins\/supabase|middleware\/auth|utils\/(?:auth|social-auth|entry-flow)|pages\/(?:login|auth|acessar))|supabase\/)/, docs: ['docs/AUTH_ONBOARDING.md', 'docs/FULLSTACK.md', 'app/data/product-docs.ts'] },
  { id: 'interface', source: /^app\/(?:layouts|components|assets|pages\/dashboard)\//, docs: ['docs/UX.md', 'docs/SAAS_BLUEPRINT.md', 'app/data/product-docs.ts'] },
  { id: 'backend', source: /^services\//, docs: ['docs/FULLSTACK.md', 'docs/SECURITY_CREDENTIALS.md', 'docs/GOOGLE_SETUP.md'] },
  { id: 'hosting', source: /^(?:netlify.*\.toml|nuxt\.config\.js|scripts\/generate-dashboard\.mjs)$/, docs: ['docs/ASSETS.md', 'docs/FULLSTACK.md', 'docs/AUTH_ONBOARDING.md'] },
  { id: 'agents', source: /^(?:AGENTS\.md|\.agents\/|\.codex\/agents\/|\.github\/agents\/)/, docs: ['docs/AGENT_OPERATIONS.md'] },
  { id: 'automation', source: /^\.github\/workflows\//, docs: ['docs/GOVERNANCE.md', 'docs/DOCS_PROCESS.md', 'docs/AGENT_OPERATIONS.md'] }
]
export function documentationGaps(files) {
  const changed = new Set(files)
  return documentationRules.filter(rule => files.some(file => rule.source.test(file)) && !rule.docs.some(file => changed.has(file)))
    .map(rule => ({ area: rule.id, updateOneOf: rule.docs }))
}
