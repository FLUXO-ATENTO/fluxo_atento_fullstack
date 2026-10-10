const entries = Object.entries(process.env).filter(([name]) => name.startsWith('NUXT_PUBLIC_'))
for (const [name, value] of entries) {
  let forbidden = /SECRET|SERVICE_ROLE|PASSWORD|PRIVATE_KEY/.test(name) || /sb_secret_|-----BEGIN .*PRIVATE KEY-----/.test(value || '')
  if (value?.startsWith('eyJ')) {
    try { forbidden ||= JSON.parse(Buffer.from(value.split('.')[1], 'base64url').toString()).role === 'service_role' } catch { /* Other public values are not JWTs. */ }
  }
  if (forbidden) { console.error('Configuração insegura em ' + name + '. Mova a credencial para o servidor. O valor não foi exibido.'); process.exit(1) }
}
console.log('Variáveis públicas: nenhuma credencial administrativa reconhecida.')
