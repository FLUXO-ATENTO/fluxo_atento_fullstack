import { lookup } from 'node:dns/promises'
import { BlockList, isIP } from 'node:net'
import http from 'node:http'
import https from 'node:https'
import { ApiError } from './errors.mjs'

const denied = new BlockList()
for (const [address, prefix] of [
  ['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8],
  ['169.254.0.0', 16], ['172.16.0.0', 12], ['192.0.0.0', 24], ['192.0.2.0', 24],
  ['192.88.99.0', 24], ['192.168.0.0', 16], ['198.18.0.0', 15], ['198.51.100.0', 24],
  ['203.0.113.0', 24], ['224.0.0.0', 4], ['240.0.0.0', 4]
]) denied.addSubnet(address, prefix, 'ipv4')
const globalV6 = new BlockList()
globalV6.addSubnet('2000::', 3, 'ipv6')
for (const [address, prefix] of [['2001::', 23], ['2001:db8::', 32], ['2002::', 16], ['3fff::', 20]]) {
  denied.addSubnet(address, prefix, 'ipv6')
}

export function publicAddress(address, extraDenied = []) {
  const family = isIP(address)
  if (!family || extraDenied.includes(address)) return false
  if (family === 6 && !globalV6.check(address, 'ipv6')) return false
  return !denied.check(address, family === 4 ? 'ipv4' : 'ipv6')
}

export function normalizeTarget(value) {
  if (typeof value !== 'string' || !value.trim() || value.length > 2048 || /\s/.test(value.trim())) {
    throw new ApiError(400, 'INVALID_URL', 'Informe o endereço público de uma página do seu site.')
  }
  let url
  try { url = new URL(/^[a-z][a-z\d+.-]*:/i.test(value.trim()) ? value.trim() : `https://${value.trim()}`) }
  catch { throw new ApiError(400, 'INVALID_URL', 'Confira o endereço do site.') }
  const host = url.hostname.toLowerCase()
  if (!['https:', 'http:'].includes(url.protocol) || url.port || url.username || url.password || url.search || url.hash ||
      isIP(host) || host.includes(':') || !host.includes('.') || host.endsWith('.') ||
      /\.(local|localhost|internal|lan|home|test|invalid|example)$/.test(host) ||
      !host.split('.').every(part => /^[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?$/i.test(part))) {
    throw new ApiError(400, 'INVALID_URL', 'Use uma página pública, sem IP, porta, senha ou parâmetros no endereço.')
  }
  return url
}

export async function resolveTarget(value, { resolver = lookup, deniedAddresses = ['2.25.230.180'], signal } = {}) {
  const url = normalizeTarget(value)
  const records = await Promise.race([
    resolver(url.hostname, { all: true, verbatim: true }),
    new Promise((_, reject) => {
      if (signal?.aborted) reject(signal.reason)
      else signal?.addEventListener('abort', () => reject(signal.reason), { once: true })
    })
  ])
  if (!records.length || records.some(record => !publicAddress(record.address, deniedAddresses))) {
    throw new ApiError(400, 'BLOCKED_TARGET', 'Esse endereço não pode ser verificado. Use uma página pública externa.')
  }
  return { url, address: records[0].address, family: records[0].family }
}

// Pin the already-validated DNS answer into the actual socket. No second DNS lookup,
// proxy environment, cookies, authorization forwarding, body download or JS execution.
export function requestHead(target, signal) {
  return new Promise((resolve, reject) => {
    const transport = target.url.protocol === 'https:' ? https : http
    const request = transport.request(target.url, {
      method: 'HEAD', agent: false, autoSelectFamily: false, signal,
      maxHeaderSize: 16384,
      headers: { 'User-Agent': 'FluxoAtento-Monitor/1.0', Accept: 'text/html' },
      lookup: (_hostname, options, callback) => options.all
        ? callback(null, [{ address: target.address, family: target.family }])
        : callback(null, target.address, target.family)
    }, response => {
      resolve({ status: response.statusCode, location: response.headers.location })
      response.destroy()
    })
    request.setTimeout(4000, () => request.destroy(new Error('REQUEST_TIMEOUT')))
    request.on('error', reject)
    request.end()
  })
}

export async function checkWebsite(value, options = {}) {
  const started = Date.now()
  const signal = AbortSignal.timeout(10000)
  let current = value
  try {
    for (let redirects = 0; redirects <= 3; redirects++) {
      const target = await resolveTarget(current, { ...options, signal })
      const response = await (options.request || requestHead)(target, signal)
      if ([301, 302, 303, 307, 308].includes(response.status) && response.location) {
        if (redirects === 3) throw new Error('REDIRECT_LIMIT')
        current = new URL(response.location, target.url).toString()
        continue
      }
      const ok = response.status >= 200 && response.status < 400
      return {
        status: ok ? 'ok' : 'attention', http_status: response.status,
        duration_ms: Date.now() - started,
        detail: ok ? 'A página respondeu à verificação HTTP. Isso não testa formulários, compras ou scripts.'
          : response.status === 405 ? 'O site não aceita esta verificação HEAD. Isso não comprova indisponibilidade.'
            : `A página respondeu com o código HTTP ${response.status}. Confira o endereço e o acesso à página.`
      }
    }
  } catch (error) {
    return {
      status: 'failed', http_status: null, duration_ms: Date.now() - started,
      detail: error instanceof ApiError ? error.message : 'Não foi possível concluir a conexão segura no tempo disponível. Confira o site e tente mais tarde.'
    }
  }
}
