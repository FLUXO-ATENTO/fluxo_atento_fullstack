// Test-only local static server, with the same generated CSP as the VPS.
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { resolve, extname, sep } from 'node:path'
const directory = resolve(process.argv[2] || 'dist')
const port = Number(process.argv[3] || 4173)
const headers = await readFile(resolve(directory, '.nginx-headers.conf'), 'utf8').catch(() => '')
const csp = /add_header Content-Security-Policy "([^"]+)"/.exec(headers)?.[1]
const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png' }
createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname)
    if (pathname.split('/').some(part => part.startsWith('.'))) throw new Error()
    let file = resolve(directory, '.' + pathname)
    if (file !== directory && !file.startsWith(directory + sep)) throw new Error()
    if ((await stat(file).catch(() => null))?.isDirectory()) file = resolve(file, 'index.html')
    const body = await readFile(file)
    response.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store', ...(csp ? { 'Content-Security-Policy': csp } : {}) })
    response.end(body)
  } catch { response.writeHead(404); response.end('Not found') }
}).listen(port, '127.0.0.1')
