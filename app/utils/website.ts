export type WebsiteResult = { valid: true; url: string } | { valid: false; message: string }
/** Client-side validation for a demo only. Not an SSRF boundary or permission to fetch. */
export function normalizeWebsiteUrl(value: string): WebsiteResult {
  const input = value.trim()
  if (!input) return { valid: false, message: 'Digite o endereço do seu site.' }
  if (input.length > 2048) return { valid: false, message: 'O endereço é longo demais. Use a URL principal.' }
  try {
    const candidate = /^[a-z][a-z\d+.-]*:/i.test(input) ? input : `https://${input}`
    const url = new URL(candidate)
    const host = url.hostname.toLowerCase()
    if (!['http:', 'https:'].includes(url.protocol) || !host.includes('.') || /^(\d{1,3}\.){3}\d{1,3}$/.test(host) || host.includes(':') || host.endsWith('.local') || host.endsWith('.localhost') || /\s/.test(input)) {
      return { valid: false, message: 'Use um endereço público, como sualoja.com.br.' }
    }
    if (url.username || url.password || url.search || url.hash) return { valid: false, message: 'Use o endereço sem senhas, parâmetros ou fragmentos.' }
    return { valid: true, url: url.toString() }
  } catch { return { valid: false, message: 'Confira o endereço e tente novamente.' } }
}
