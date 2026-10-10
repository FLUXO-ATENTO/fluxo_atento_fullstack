const messages: Record<string, string> = {
  DUPLICATE: 'Esse endereço já está cadastrado.',
  PLAN_LIMIT: 'Nesta etapa, sua conta permite duas páginas de um mesmo site.',
  BLOCKED_TARGET: 'Esse endereço não pode ser verificado. Use uma página pública externa.',
  INVALID_URL: 'Use uma página pública, sem IP, porta, senha ou parâmetros no endereço.',
  CHECK_COOLDOWN: 'Aguarde um minuto entre verificações deste endereço.',
  RATE_LIMIT: 'Muitas solicitações. Aguarde um minuto e tente novamente.',
  PAUSED: 'Reative o monitor antes de verificar.'
}
export function publicErrorMessage(status: number, payload: unknown) {
  const code = (payload as { error?: { code?: string } } | null)?.error?.code
  if (code && messages[code]) return messages[code]
  if (status === 404) return 'O serviço de monitoramento ainda não está disponível neste ambiente. Seus dados não foram substituídos por exemplos.'
  if (status === 403) return 'Este ambiente ainda não foi autorizado a acessar o serviço.'
  if (status === 429) return 'Aguarde um minuto e tente novamente.'
  return 'Não foi possível concluir a solicitação. Tente novamente em instantes.'
}
