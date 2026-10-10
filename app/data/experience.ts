export type ScenarioId = 'tracking' | 'errors' | 'changes'
export const scenarios = [
  { id: 'tracking' as const, label: 'Tracking', eyebrow: 'UM PIXEL PAROU DE RESPONDER', problem: 'O anúncio roda. A conversão fica invisível.', signal: 'Evento de compra não observado', source: 'loja.exemplo.com/checkout', evidence: 'O script está presente, mas a chamada esperada não apareceu nesta observação.', insight: 'Estar instalado não significa estar funcionando.', action: 'Revisar o evento de compra', detail: 'Confira o consentimento, a configuração da tag e o disparo no checkout antes de concluir que há uma falha.', metric: 'Evento esperado', before: 'Observado', after: 'Não observado' },
  { id: 'errors' as const, label: 'Erros', eyebrow: 'UMA FALHA PASSOU DESPERCEBIDA', problem: 'O botão aparece. O pedido não chega.', signal: 'Falha na requisição de envio', source: 'loja.exemplo.com/contato', evidence: 'A requisição do formulário retornou HTTP 500 no cenário ilustrativo.', insight: 'Uma página visível também pode estar quebrada.', action: 'Investigar o envio do formulário', detail: 'Verifique os logs da integração, reproduza o erro em um ambiente seguro e teste novamente após a correção.', metric: 'Resposta da integração', before: '200 OK', after: '500 Error' },
  { id: 'changes' as const, label: 'Mudanças', eyebrow: 'UM DETALHE IMPORTANTE MUDOU', problem: 'O deploy foi feito. O detalhe ficou para trás.', signal: 'Título principal foi alterado', source: 'loja.exemplo.com/oferta', evidence: 'O título da oferta difere da observação anterior neste exemplo.', insight: 'Nem toda mudança precisa virar surpresa.', action: 'Revisar a alteração da oferta', detail: 'Compare a versão anterior com o conteúdo atual e confirme com a equipe se a mudança era esperada.', metric: 'Título da página', before: 'Oferta de outubro', after: 'Nova coleção' }
]
export const observationSteps = [
  { label: 'Observe', description: 'Sinais que o navegador recebe.' },
  { label: 'Entenda', description: 'Evidência traduzida em contexto.' },
  { label: 'Decida', description: 'Uma próxima ação, sem adivinhar.' }
]
