export function normalizeWebsiteUrl(value) {
  const input = value.trim()
  if (!input) return { valid: false, message: 'Digite o endereço de um site.' }

  const candidate = /^[a-z][a-z\d+.-]*:\/\//i.test(input) ? input : `https://${input}`

  try {
    const url = new URL(candidate)
    if (!['http:', 'https:'].includes(url.protocol) || !url.hostname.includes('.')) {
      return { valid: false, message: 'Use um endereço público válido, como exemplo.com.' }
    }
    if (url.username || url.password) {
      return { valid: false, message: 'Não inclua credenciais no endereço.' }
    }
    return { valid: true, url: url.toString() }
  } catch {
    return { valid: false, message: 'Confira o endereço e tente novamente.' }
  }
}

export function useUrlAnalyzer() {
  const address = ref('')
  const message = ref('')
  const isValid = ref(false)

  function validate() {
    const result = normalizeWebsiteUrl(address.value)
    isValid.value = result.valid
    message.value = result.valid
      ? 'Endereço válido. Esta versão ainda não acessa nem analisa URLs.'
      : result.message
    return result.valid
  }

  return { address, message, isValid, validate }
}
