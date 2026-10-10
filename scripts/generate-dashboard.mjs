import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const nuxtCli = fileURLToPath(new URL('../node_modules/nuxt/bin/nuxt.mjs', import.meta.url))
const result = spawnSync(process.execPath, [nuxtCli, 'generate'], {
  env: { ...process.env, NUXT_PUBLIC_APP_MODE: 'dashboard' },
  stdio: 'inherit'
})

if (result.error) throw result.error
process.exit(result.status ?? 1)
