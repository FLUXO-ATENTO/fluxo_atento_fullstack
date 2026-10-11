import { createHash } from 'node:crypto'
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

export function inlineHashes(html) {
  const hashes = []
  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)) {
    const attributes = match[1]
    if (/\bsrc\s*=/i.test(attributes)) continue
    const type = /\btype\s*=\s*["']([^"']+)["']/i.exec(attributes)?.[1]?.toLowerCase()
    if (type && !['module', 'importmap', 'text/javascript', 'application/javascript'].includes(type)) continue
    hashes.push("'sha256-" + createHash('sha256').update(match[2]).digest('base64') + "'")
  }
  return [...new Set(hashes)].sort()
}

export async function writeDashboardHeaders(directory) {
  const hashes = new Set()
  async function visit(folder) {
    for (const entry of await readdir(folder, { withFileTypes: true })) {
      const path = join(folder, entry.name)
      if (entry.isDirectory()) await visit(path)
      else if (entry.name.endsWith('.html')) for (const hash of inlineHashes(await readFile(path, 'utf8'))) hashes.add(hash)
    }
  }
  await visit(directory)
  if (!hashes.size) throw new Error('Nenhum script inline Nuxt identificado; revise a política CSP antes de publicar.')
  const csp = `default-src 'self'; base-uri 'self'; connect-src 'self' https://qbfmebpzxnzdpalmgtxr.supabase.co https://api.fluxoatento.com.br; font-src 'self' data:; frame-ancestors 'none'; img-src 'self' data: https:; object-src 'none'; script-src 'self' ${[...hashes].sort().join(' ')}; style-src 'self' 'unsafe-inline'`
  await writeFile(join(directory, '.nginx-headers.conf'), [
    '# Generated from this release. Keep this file with the HTML for atomic rollback.',
    'add_header X-Frame-Options "DENY" always;',
    'add_header X-Content-Type-Options "nosniff" always;',
    'add_header Referrer-Policy "strict-origin-when-cross-origin" always;',
    'add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;',
    `add_header Content-Security-Policy "${csp}" always;`,
    'add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;',
    ''
  ].join('\n'))
}
