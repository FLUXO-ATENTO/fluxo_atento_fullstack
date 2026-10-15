// This policy reports locations and categories, never the credential value.
export const publicEnvironmentNames = new Set([
  'NUXT_PUBLIC_APP_MODE',
  'NUXT_PUBLIC_AUTH_PROVIDERS',
  'NUXT_PUBLIC_TURNSTILE_ENABLED',
  'NUXT_PUBLIC_TURNSTILE_SITE_KEY',
  'NUXT_PUBLIC_SITE_URL',
  'NUXT_PUBLIC_MARKETING_URL',
  'NUXT_PUBLIC_DASHBOARD_URL',
  'NUXT_PUBLIC_DASHBOARD_ENTRY_MODE',
  'NUXT_PUBLIC_API_BASE',
  'NUXT_PUBLIC_SUPABASE_URL',
  'NUXT_PUBLIC_SUPABASE_KEY',
  'NUXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'
])

function jwtRole(value) {
  try { return JSON.parse(Buffer.from(value.split('.')[1], 'base64url').toString('utf8')).role } catch { return undefined }
}

export function sensitiveTextFindings(text) {
  const findings = []
  const patterns = [
    ['supabase-secret', /\bsb_secret_[A-Za-z0-9_-]{16,}/g],
    ['provider-secret', /\bsk-(?:proj-|svcacct-|live_|test_)?[A-Za-z0-9_-]{20,}/g],
    ['github-token', /\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{30,})/g],
    ['google-api-key', /\bAIza[A-Za-z0-9_-]{30,}/g],
    ['oauth-client-secret', /\bGOCSPX-[A-Za-z0-9_-]{16,}/g],
    ['turnstile-secret', /\b0x4[A-Za-z0-9_-]{30,}\b/g],
    ['private-key', /-----BEGIN (?:RSA |EC |OPENSSH |DSA |ENCRYPTED )?PRIVATE KEY-----/g],
    ['credential-in-url', /\b(?:https?|postgres(?:ql)?|rediss?):\/\/[^/\s"'<>]+:[^/@\s"'<>]+@/g]
  ]
  for (const [type, pattern] of patterns) {
    for (const match of text.matchAll(pattern)) {
      findings.push({ type, line: text.slice(0, match.index).split('\n').length })
    }
  }
  for (const match of text.matchAll(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g)) {
    if (jwtRole(match[0]) !== 'anon') {
      findings.push({ type: 'non-public-jwt', line: text.slice(0, match.index).split('\n').length })
    }
  }
  return findings
}

export function publicEnvironmentFindings(environment) {
  const findings = []
  for (const [name, value] of Object.entries(environment)) {
    if (!name.startsWith('NUXT_PUBLIC_')) continue
    if (!publicEnvironmentNames.has(name)) {
      findings.push({ name, type: 'public-variable-not-approved' })
      continue
    }
    if (!value) continue
    if (sensitiveTextFindings(value).length) {
      findings.push({ name, type: 'private-value-in-public-variable' })
      continue
    }
    if (name.endsWith('SUPABASE_KEY') || name.endsWith('SUPABASE_PUBLISHABLE_KEY')) {
      const publishable = /^sb_publishable_[\w-]+$/.test(value)
      const legacyAnon = /^eyJ[\w-]+\.[\w-]+\.[\w-]+$/.test(value) && jwtRole(value) === 'anon'
      if (!publishable && !legacyAnon) findings.push({ name, type: 'not-a-public-supabase-key' })
    } else if (name === 'NUXT_PUBLIC_AUTH_PROVIDERS') {
      if (value.split(',').some(provider => !['google', 'github'].includes(provider.trim()))) findings.push({ name, type: 'invalid-auth-provider' })
    } else if (name === 'NUXT_PUBLIC_APP_MODE') {
      if (!['dashboard', 'marketing'].includes(value)) findings.push({ name, type: 'invalid-app-mode' })
    } else if (name === 'NUXT_PUBLIC_DASHBOARD_ENTRY_MODE') {
      if (!['login', 'guided'].includes(value)) findings.push({ name, type: 'invalid-dashboard-entry-mode' })
    } else if (name === 'NUXT_PUBLIC_TURNSTILE_ENABLED') {
      if (!['true', 'false'].includes(value)) findings.push({ name, type: 'invalid-turnstile-flag' })
    } else if (name === 'NUXT_PUBLIC_TURNSTILE_SITE_KEY') {
      if (!/^(?:0x[A-Za-z0-9_-]{22}|[1-3]x[A-Za-z0-9_-]{20})$/.test(value)) findings.push({ name, type: 'invalid-turnstile-site-key' })
      if (/^[1-3]x/.test(value) && (environment.NODE_ENV === 'production' || environment.CONTEXT === 'production')) {
        findings.push({ name, type: 'test-turnstile-key-in-production' })
      }
    } else {
      try {
        const url = new URL(value)
        if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) throw new Error()
      } catch { findings.push({ name, type: 'invalid-public-url' }) }
    }
  }
  if (environment.NUXT_PUBLIC_TURNSTILE_ENABLED === 'true' && !environment.NUXT_PUBLIC_TURNSTILE_SITE_KEY) {
    findings.push({ name: 'NUXT_PUBLIC_TURNSTILE_SITE_KEY', type: 'missing-turnstile-site-key' })
  }
  return findings
}
