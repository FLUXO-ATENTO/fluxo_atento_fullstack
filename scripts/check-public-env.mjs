import { publicEnvironmentFindings } from './security-policy.mjs'
import { existsSync } from 'node:fs'

// Nuxt also reads .env; inspect it before Nuxt can inline public values.
if (existsSync('.env')) process.loadEnvFile('.env')

const findings = publicEnvironmentFindings(process.env)
for (const finding of findings) {
  console.error('Configuração pública bloqueada: ' + finding.name + ' (' + finding.type + '). Valor omitido.')
}
if (findings.length) process.exit(1)
console.log('Configuração pública aprovada pela política de nomes e tipos. Isso não substitui RLS nem a inspeção do artefato.')
