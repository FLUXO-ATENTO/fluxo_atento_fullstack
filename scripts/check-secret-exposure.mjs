import { readdir, readFile, lstat } from 'node:fs/promises'
import { resolve, relative, extname, basename } from 'node:path'
import { execFileSync } from 'node:child_process'
import { sensitiveTextFindings } from './security-policy.mjs'

const args = process.argv.slice(2)
const source = args.includes('--source')
const root = resolve(source ? '.' : args[0] || 'dist')
const extensions = new Set(['.html', '.js', '.mjs', '.cjs', '.ts', '.vue', '.css', '.json', '.map', '.md', '.txt', '.toml', '.yaml', '.yml', '.sql', '.sh', '.conf', '.example', '.svg'])
let files = []
let failures = 0
let scanned = 0

async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name)
    if (entry.isSymbolicLink()) throw new Error('Symlink in scan target')
    if (entry.isDirectory()) await walk(path)
    else files.push(path)
  }
}

try {
  if (source) {
    files = [...new Set(execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 }).split('\0').filter(Boolean))].map(file => resolve(file))
  } else await walk(root)
  for (const file of files) {
    const label = relative(root, file).replaceAll('\\', '/')
    if (/(^|\/)\.env(?:\.|$)/.test(label) && !label.endsWith('.example') || /\.(?:pem|p12|pfx|key)$/i.test(file)) {
      console.error(JSON.stringify({ file: label, type: 'credential-file' }))
      failures++
    }
    if (!extensions.has(extname(file)) && !['_headers', '_redirects', '.env'].includes(basename(file))) continue
    const stat = await lstat(file)
    if (stat.isSymbolicLink() || stat.size > 20 * 1024 * 1024) throw new Error('Unsupported scan target')
    const text = await readFile(file, 'utf8')
    scanned++
    for (const finding of sensitiveTextFindings(text)) {
      console.error(JSON.stringify({ file: label, ...finding }))
      failures++
    }
  }
  console.log(JSON.stringify({ scope: source ? 'source-working-tree' : 'public-build', scanned, findings: failures, valuesPrinted: false }))
  process.exitCode = failures ? 1 : 0
} catch {
  console.error('Inspeção incompleta. Publicação bloqueada; nenhum conteúdo de arquivo foi exibido.')
  process.exitCode = 1
}
