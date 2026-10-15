type Plan = {
  id: 'free' | 'essential' | 'complete'
  name: string
  audience: string
  price: string
  period: string
  description: string
  featured: boolean
  features: string[]
  limits: { label: string; value: string }[]
  cta: string
  availability: string
}

export const offerNotice: string =
  'O painel autenticado possui monitoramento HTTP básico. A demonstração pública usa dados ilustrativos. Os recursos e limites dos planos abaixo são propostas, não um pacote já ativado. Os preços pagos são sugestões pendentes de validação econômica, não preços vigentes. Custos de provedores de WhatsApp e email poderão existir inclusive no Gratuito; qualquer cobrança dependerá de informação e aceite prévios.'

export const plans: Plan[] = [
  {
    id: 'free',
    name: 'Gratuito',
    audience: 'Para quem tem uma loja ou negócio e quer explorar como cuidar do site e dos clientes pelo WhatsApp.',
    price: '0',
    period: '/mês',
    description: 'Conheça a proposta e experimente uma rotina inicial com exemplos de site, atendimento e contatos.',
    featured: false,
    features: [
      'Previsto: acompanhar mudanças e possíveis falhas nas páginas do seu site.',
      'Previsto: 1 número de WhatsApp para receber e enviar mensagens de atendimento e campanhas aprovadas.',
      'Previsto: IA para apoiar o atendimento, com limite mensal de respostas.',
      'Previsto: LeadRadar para organizar interessados e AtendeScore para acompanhar o atendimento.',
      'Previsto: email marketing para contatos que autorizaram o recebimento, com campanhas aprovadas pelo responsável.',
      'Recomendação pela necessidade do negócio, sem precisar escolher um módulo para começar.'
    ],
    limits: [
      { label: 'Sites', value: '1' },
      { label: 'URLs no total', value: '2' },
      { label: 'Verificação por URL', value: '1 a cada 24 horas' },
      { label: 'Pessoas com acesso', value: '1' },
      { label: 'Histórico de atividade', value: '7 dias' },
      { label: 'Módulos previstos', value: '2: LeadRadar e AtendeScore' },
      { label: 'Números de WhatsApp', value: '1' },
      { label: 'Contatos no WhatsApp', value: '100' },
      { label: 'Mensagens de atendimento enviadas por pessoas', value: '200/mês' },
      { label: 'Respostas da IA no atendimento', value: '50/mês' },
      { label: 'Campanhas no WhatsApp', value: '1/mês' },
      { label: 'Envios de campanhas no WhatsApp', value: '50/mês' },
      { label: 'Contatos de email marketing', value: '50' },
      { label: 'Campanhas de email marketing', value: '1/mês' },
      { label: 'Envios de email marketing', value: '100/mês' }
    ],
    cta: 'Acessar o painel',
    availability: 'O acesso ao painel não ativa os canais nem as cotas propostas. Recursos e limites do plano ainda dependem de implementação. Eventuais custos de provedores serão informados antes de qualquer ativação.'
  },
  {
    id: 'essential',
    name: 'Essencial',
    audience: 'Para o dono de um pequeno negócio que recebe clientes pelo site e WhatsApp e divide o atendimento com poucas pessoas.',
    price: '149',
    period: '/mês',
    description: 'Proposta para acompanhar o site, organizar o atendimento e retomar conversas com clientes que autorizaram o contato.',
    featured: true,
    features: [
      'Previsto: acompanhar mudanças e possíveis falhas no site, com verificações a cada 12 horas.',
      'Previsto: 1 número de WhatsApp para receber e enviar mensagens de atendimento e campanhas aprovadas.',
      'Previsto: IA para apoiar o atendimento e acesso compartilhado por até 3 pessoas.',
      'Previsto: LeadRadar, AtendeScore e RecuperaIA para organizar interessados, acompanhar atendimentos e preparar retomadas de contato.',
      'Previsto: email marketing para contatos que autorizaram o recebimento, com campanhas aprovadas pelo responsável.',
      'Recomendação pela necessidade do negócio, sem precisar escolher um módulo para começar.'
    ],
    limits: [
      { label: 'Sites', value: '2' },
      { label: 'URLs no total', value: '10' },
      { label: 'Verificação por URL', value: '1 a cada 12 horas' },
      { label: 'Pessoas com acesso', value: '3' },
      { label: 'Histórico de atividade', value: '30 dias' },
      { label: 'Módulos previstos', value: '3: LeadRadar, AtendeScore e RecuperaIA' },
      { label: 'Números de WhatsApp', value: '1' },
      { label: 'Contatos no WhatsApp', value: '1.000' },
      { label: 'Mensagens de atendimento enviadas por pessoas', value: '2.000/mês' },
      { label: 'Respostas da IA no atendimento', value: '500/mês' },
      { label: 'Campanhas no WhatsApp', value: '4/mês' },
      { label: 'Envios de campanhas no WhatsApp', value: '1.000/mês' },
      { label: 'Contatos de email marketing', value: '500' },
      { label: 'Campanhas de email marketing', value: '4/mês' },
      { label: 'Envios de email marketing', value: '1.000/mês' }
    ],
    cta: 'Conhecer proposta',
    availability: 'Plano ainda não disponível para contratação. R$ 149/mês é sugestão comercial pendente de validação econômica, não preço vigente. Conhecer a proposta não ativa serviços.'
  },
  {
    id: 'complete',
    name: 'Completo',
    audience: 'Para uma equipe que cuida do site, atende clientes pelo WhatsApp e precisa organizar também anúncios, contratos, compras e campanhas.',
    price: '399',
    period: '/mês',
    description: 'Proposta para reunir a rotina da equipe, com os seis módulos, mais capacidade de atendimento e email marketing.',
    featured: false,
    features: [
      'Previsto: acompanhar mudanças e possíveis falhas no site, com verificações a cada 4 horas.',
      'Previsto: 1 número de WhatsApp para receber e enviar mensagens de atendimento e campanhas aprovadas.',
      'Previsto: IA para apoiar o atendimento e acesso compartilhado por até 10 pessoas.',
      'Previsto: os 6 módulos — RecuperaIA, AdsGuard, AtendeScore, ContratoVivo, CompraCerta e LeadRadar.',
      'Previsto: email marketing para contatos que autorizaram o recebimento, com campanhas aprovadas pela equipe.',
      'Recomendação pela necessidade do negócio, sem precisar escolher um módulo para começar.'
    ],
    limits: [
      { label: 'Sites', value: '5' },
      { label: 'URLs no total', value: '30' },
      { label: 'Verificação por URL', value: '1 a cada 4 horas' },
      { label: 'Pessoas com acesso', value: '10' },
      { label: 'Histórico de atividade', value: '90 dias' },
      { label: 'Módulos previstos', value: '6: RecuperaIA, AdsGuard, AtendeScore, ContratoVivo, CompraCerta e LeadRadar' },
      { label: 'Números de WhatsApp', value: '1' },
      { label: 'Contatos no WhatsApp', value: '5.000' },
      { label: 'Mensagens de atendimento enviadas por pessoas', value: '10.000/mês' },
      { label: 'Respostas da IA no atendimento', value: '2.000/mês' },
      { label: 'Campanhas no WhatsApp', value: '10/mês' },
      { label: 'Envios de campanhas no WhatsApp', value: '5.000/mês' },
      { label: 'Contatos de email marketing', value: '2.000' },
      { label: 'Campanhas de email marketing', value: '10/mês' },
      { label: 'Envios de email marketing', value: '10.000/mês' }
    ],
    cta: 'Conhecer proposta',
    availability: 'Plano ainda não disponível para contratação. R$ 399/mês é sugestão comercial pendente de validação econômica, não preço vigente. Conhecer a proposta não ativa serviços.'
  }
]
