import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, appendFileSync } from 'node:fs'
import { dirname, resolve, relative } from 'node:path'
import { documentationGaps } from './docs-policy.mjs'

const root = process.cwd()
const git = args => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 }).split('\0').filter(Boolean)
const files = [...new Set(git(['ls-files', '-z', '--cached', '--others', '--exclude-standard']))]
const markdown = files.filter(file => file.endsWith('.md') && /^(?:docs\/|README\.md|AGENTS\.md|\.agents\/|\.github\/)/.test(file))
const problems = []
for (const file of markdown) {
  if (!existsSync(file)) continue
  const content = readFileSync(file, 'utf8').replace(/```[\s\S]*?```/g, '')
  for (const match of content.matchAll(/\[[^\]]+\]\(([^\s)]+)(?:\s+"[^"]*")?\)/g)) {
    const target = match[1]
    if (/^(?:[a-z]+:|#|\/)/i.test(target)) continue
    const path = decodeURIComponent(target.split('#')[0].split('?')[0])
    if (!path) continue
    const absolute = resolve(dirname(resolve(root, file)), path)
    if (relative(root, absolute).startsWith('..') || !existsSync(absolute)) problems.push(`${file}: referência local não encontrada: ${path}`)
  }
}
const base = process.env.DOCS_BASE_SHA
if (base) {
  if (!/^[a-f0-9]{40}$/i.test(base)) throw new Error('DOCS_BASE_SHA deve ser um commit completo.')
  const changed = git(['diff', '--name-only', '-z', `${base}...HEAD`])
  for (const gap of documentationGaps(changed)) problems.push(`Mudança em ${gap.area}: revise ao menos um de ${gap.updateOneOf.join(', ')} no mesmo PR.`)
}
const summary = `## Documentação\n\n${problems.length ? problems.map(message => `- ${message}`).join('\n') : `Referências locais verificadas em ${markdown.length} documentos. ${base ? 'Mapa de impacto da documentação atendido.' : 'Mapa de impacto não avaliado sem DOCS_BASE_SHA.'}`}\n\nA checagem não comprova a correção do conteúdo nem substitui revisão humana. Não publica documentação automaticamente.\n`
console.log(summary)
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary)
process.exitCode = problems.length ? 1 : 0
