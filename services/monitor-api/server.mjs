import { createServer } from 'node:http'
import { createHandler } from './app.mjs'
import { createStore } from './store.mjs'
import { createGoogleService } from './google-service.mjs'
import { googleConfigFromEnv } from './google-crypto.mjs'

const required = ['SUPABASE_URL', 'SUPABASE_PUBLISHABLE_KEY', 'SUPABASE_SECRET_KEY', 'SUPABASE_AUTH_REDIRECT_URL', 'ALLOWED_ORIGINS']
for (const name of required) if (!process.env[name]) throw new Error(`Configure ${name} no ambiente privado da VPS.`)
if (!process.env.SUPABASE_URL.startsWith('https://')) throw new Error('SUPABASE_URL precisa usar HTTPS.')
const allowedOrigins = process.env.ALLOWED_ORIGINS.split(',').map(value => value.trim()).filter(Boolean)
if (allowedOrigins.some(value => value === '*' || new URL(value).origin !== value)) throw new Error('ALLOWED_ORIGINS exige origens exatas, sem curingas.')
if (new URL(process.env.SUPABASE_AUTH_REDIRECT_URL).origin !== 'https://app.fluxoatento.com.br') throw new Error('SUPABASE_AUTH_REDIRECT_URL deve usar o dashboard HTTPS de produção.')
const store = createStore({ supabaseUrl: process.env.SUPABASE_URL, publicKey: process.env.SUPABASE_PUBLISHABLE_KEY, secretKey: process.env.SUPABASE_SECRET_KEY, authRedirectUrl: process.env.SUPABASE_AUTH_REDIRECT_URL })
const google = createGoogleService({ store: store.google, config: googleConfigFromEnv(process.env) })
const server = createServer({ maxHeaderSize: 16384, requestTimeout: 20000, headersTimeout: 10000 }, createHandler({ store, allowedOrigins, google }))
server.maxConnections = 100
server.listen(Number(process.env.PORT || 8100), process.env.HOST || '127.0.0.1', () => console.log('Fluxo Atento Monitor API pronta. Credenciais não são registradas.'))
for (const event of ['SIGINT', 'SIGTERM']) process.on(event, () => { server.close(); setTimeout(() => process.exit(0), 15000).unref() })
