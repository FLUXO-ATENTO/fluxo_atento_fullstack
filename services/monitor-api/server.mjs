import { createServer } from 'node:http'
import { createHandler } from './app.mjs'
import { createStore } from './store.mjs'

const required = ['SUPABASE_URL', 'SUPABASE_PUBLISHABLE_KEY', 'SUPABASE_SECRET_KEY', 'ALLOWED_ORIGINS']
for (const name of required) if (!process.env[name]) throw new Error(`Configure ${name} no ambiente privado da VPS.`)
if (!process.env.SUPABASE_URL.startsWith('https://')) throw new Error('SUPABASE_URL precisa usar HTTPS.')
const allowedOrigins = process.env.ALLOWED_ORIGINS.split(',').map(value => value.trim()).filter(Boolean)
if (allowedOrigins.some(value => value === '*' || new URL(value).origin !== value)) throw new Error('ALLOWED_ORIGINS exige origens exatas, sem curingas.')
const store = createStore({ supabaseUrl: process.env.SUPABASE_URL, publicKey: process.env.SUPABASE_PUBLISHABLE_KEY, secretKey: process.env.SUPABASE_SECRET_KEY })
const server = createServer({ maxHeaderSize: 16384, requestTimeout: 20000, headersTimeout: 10000 }, createHandler({ store, allowedOrigins }))
server.maxConnections = 100
server.listen(Number(process.env.PORT || 8100), process.env.HOST || '127.0.0.1', () => console.log('Fluxo Atento Monitor API pronta. Credenciais não são registradas.'))
for (const event of ['SIGINT', 'SIGTERM']) process.on(event, () => { server.close(); setTimeout(() => process.exit(0), 15000).unref() })
