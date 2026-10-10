export const helpCategories = [
  { id: 'inicio', label: 'Primeiros passos' },
  { id: 'site', label: 'Site e sinais' },
  { id: 'produto', label: 'Módulos e planos' },
  { id: 'canais', label: 'WhatsApp e e-mail' },
  { id: 'conta', label: 'Acesso e dados' },
  { id: 'suporte', label: 'Ajuda no uso' }
] as const

export type HelpCategory = typeof helpCategories[number]['id']
export interface HelpArticle {
  id: string
  aliases: string[]
  category: HelpCategory
  title: string
  summary: string
  paragraphs: string[]
  steps: string[]
  keywords: string[]
  link: { label: string; to: string }
}

export const helpArticles: HelpArticle[] = [
  {
    id: 'demonstracao', aliases: ['primeiros-passos'], category: 'inicio',
    title: 'O que dá para explorar hoje?',
    summary: 'Conheça a demonstração e entenda de onde vêm os exemplos.',
    paragraphs: [
      'Hoje, o Fluxo Atento é uma demonstração com dados ilustrativos. Você pode explorar situações de um site fictício, ver o contexto e continuar no painel. Não é preciso criar uma conta para conhecer essa experiência.',
      'Nenhum resultado vem de uma análise do seu site. Os endereços, comparações e horários dos exemplos não representam verificações reais. A demonstração não envia mensagens, não faz cobranças e não corrige páginas.',
      'Comece por uma situação próxima da sua rotina: um registro de compra que não aparece, um formulário com falha no envio ou uma oferta que mudou. Os detalhes ajudam a entender o que conferir, sem afirmar que isso aconteceu no seu negócio.'
    ],
    steps: ['Abra Como funciona e escolha um exemplo.', 'Leia o sinal, o contexto e a sugestão de próxima ação.', 'Use o link do exemplo para continuar no painel.'],
    keywords: ['demo', 'começar', 'comece', 'ilustrativo', 'funciona', 'exemplo'],
    link: { label: 'Conhecer o fluxo', to: '/como-funciona' }
  },
  {
    id: 'sinais', aliases: ['exemplos', 'sinal-contexto-acao', 'termos-usados'], category: 'site',
    title: 'Como ler um sinal sem tirar uma conclusão antes da hora',
    summary: 'O que mostram os exemplos de registro de compra, erro e mudança.',
    paragraphs: [
      'Sinal é a informação que aparece na observação. Contexto é a explicação do que essa informação mostra e do que ainda não sabemos. A próxima ação é uma sugestão do que conferir; ela não executa uma correção.',
      'No exemplo de registro de compras, o registro esperado não aparece, embora o recurso de acompanhamento esteja presente. Isso não prova que não houve compra ou que um anúncio falhou. Permissões e configuração precisam ser conferidas.',
      'No exemplo de formulário, a tentativa de envio recebe uma resposta de erro. A página abrir não comprova que o envio funciona. A resposta também não identifica sozinha a causa nem informa o que aconteceu no WhatsApp.',
      'No exemplo de mudança, o título passa de “Oferta de outubro” para “Nova coleção”. A diferença pode ser uma atualização prevista. Compare os textos e confirme com quem cuida da página antes de tratar isso como um problema.'
    ],
    steps: ['Identifique qual página aparece no exemplo.', 'Compare a informação anterior com a seguinte.', 'Leia a sugestão e o limite da observação antes de decidir o que investigar.'],
    keywords: ['tracking', 'pixel', 'evento', 'conversão', 'erro', 'formulário', 'mudança', 'sinal', 'contexto'],
    link: { label: 'Explorar os exemplos', to: '/como-funciona#exemplo' }
  },
  {
    id: 'monitores', aliases: ['painel'], category: 'site',
    title: 'Páginas e revisões no painel de demonstração',
    summary: 'O que muda quando você adiciona, pausa ou revisa um item do exemplo.',
    paragraphs: [
      'Um monitor representa uma página que você gostaria de acompanhar. Na demonstração, a lista serve para explorar essa organização. Adicionar um endereço não abre o site, não inicia visitas recorrentes e não cria um serviço ativo.',
      'Ao adicionar uma página, use um endereço público de exemplo, sem senhas ou informações pessoais. Se o endereço não for aceito, confira o formato. Se ele já estiver na lista, use o item existente.',
      'Pausar ou retomar uma página muda apenas seu estado no exemplo. Marcar um sinal como revisado registra uma revisão local; não significa que a página foi corrigida ou que o problema deixou de existir.',
      'As alterações não são salvas em uma conta e podem se perder ao atualizar a página. Restaurar a demonstração, quando essa opção estiver disponível, volta aos dados iniciais. Não use esse espaço como histórico do seu negócio.'
    ],
    steps: ['No painel, abra a lista de páginas da demonstração.', 'Explore os controles locais e leia a confirmação de cada ação.', 'Antes de atualizar ou restaurar, considere que suas alterações locais podem se perder.'],
    keywords: ['monitor', 'monitores', 'url', 'endereço', 'pausa', 'pausar', 'revisado', 'adicionar', 'histórico'],
    link: { label: 'Explorar o painel', to: '/exemplo' }
  },
  {
    id: 'modulos', aliases: [], category: 'produto',
    title: 'Onde entram os seis módulos?',
    summary: 'Conheça os nomes sem confundir a proposta com recursos já disponíveis.',
    paragraphs: [
      'A proposta do Fluxo Atento reúne acompanhamento de sites e seis módulos: RecuperaIA, AdsGuard, AtendeScore, ContratoVivo, CompraCerta e LeadRadar. Você não precisa escolher um módulo para entender ou explorar os exemplos.',
      'Os nomes não confirmam funções em funcionamento. Os escopos e as condições de uso ainda precisam de definição e validação. Apresentações de oferta descrevem uma proposta, não uma conta com serviços ativados.',
      'Comece pela situação que você quer entender. Depois, consulte a apresentação dos módulos e seu estado. Nenhum dos exemplos de site comprova, por si só, a execução de um desses módulos.'
    ],
    steps: ['Entenda primeiro um exemplo de acompanhamento de site.', 'Consulte os nomes e os avisos de disponibilidade dos módulos.', 'Não informe dados de clientes esperando uma operação real nesta demo.'],
    keywords: ['módulos', 'recuperaia', 'adsguard', 'atendescore', 'contratovivo', 'compracerta', 'leadradar'],
    link: { label: 'Conhecer os módulos', to: '/modulos' }
  },
  {
    id: 'planos', aliases: [], category: 'produto',
    title: 'Gratuito, Essencial e Completo: proposta e disponibilidade',
    summary: 'Como entender os planos enquanto a experiência ainda é demonstrativa.',
    paragraphs: [
      'Os três planos previstos são Gratuito, Essencial e Completo. Todos contemplam WhatsApp na proposta, com limites para inteligência artificial e campanhas. O Completo também contempla os seis módulos e e-mail.',
      'Preços, quantidades e condições apresentados na área de planos são propostas, não uma assinatura em funcionamento. Consulte essa área para ver a definição comercial atual, sem usar este artigo como tabela de valores ou cotas.',
      'Explorar a demonstração não contrata um plano, não conecta um número e não autoriza cobrança. O eventual custo de provedores e as condições de ativação precisam ser informados antes de qualquer contratação real.'
    ],
    steps: ['Leia o aviso de disponibilidade junto da oferta.', 'Confira limites e condições na área de planos.', 'Continue na demonstração sem precisar escolher ou contratar um plano.'],
    keywords: ['gratuito', 'essencial', 'completo', 'preço', 'valor', 'cota', 'limite', 'cobrança', 'assinatura'],
    link: { label: 'Consultar a proposta dos planos', to: '/planos' }
  },
  {
    id: 'whatsapp-ia', aliases: ['integracoes'], category: 'canais',
    title: 'WhatsApp, contato autorizado e apoio de IA',
    summary: 'O papel previsto do canal e os limites da demonstração.',
    paragraphs: [
      'O WhatsApp está previsto nos três planos, mas nenhum número está conectado nesta demonstração. Não há recebimento ou envio de mensagens, importação de contatos, campanha ativa ou resposta automática.',
      'A proposta prevê comunicação com pessoas que autorizaram o contato e uma forma de deixar de receber campanhas. Uma conexão futura também precisa de um número autorizado e da definição das regras e dos limites do serviço. Nada disso deve ser interpretado como já configurado.',
      'IA significa inteligência artificial. Seu papel previsto é apoiar o atendimento, com uso limitado e revisão da equipe. Ela pode produzir respostas inadequadas; não há promessa de acerto, atendimento contínuo ou resultado comercial.',
      'Não cole conversas, listas de clientes, códigos de acesso ou credenciais na demonstração. A página de integrações explica o estado do canal sem pedir que você conecte uma conta.'
    ],
    steps: ['Consulte o estado do WhatsApp em Integrações.', 'Trate IA e campanhas como recursos planejados.', 'Para conhecer o produto hoje, use apenas os exemplos de site.'],
    keywords: ['whatsapp', 'ia', 'consentimento', 'autorização', 'mensagem', 'campanha', 'inteligência artificial'],
    link: { label: 'Ver o estado das integrações', to: '/integracoes' }
  },
  {
    id: 'email', aliases: [], category: 'canais',
    title: 'E-mail na proposta do Completo',
    summary: 'Campanhas por e-mail ainda não estão conectadas.',
    paragraphs: [
      'O e-mail faz parte da proposta do plano Completo. A demonstração não envia nem recebe e-mails, não importa listas e não confirma entregas. Uma página de apresentação não equivale a um serviço de mensagens ativo.',
      'Antes de uma operação real, será necessário definir o provedor, validar o domínio de envio e estabelecer os limites. A proposta considera contatos que autorizaram o recebimento e uma forma de sair das campanhas. Essas etapas ainda não estão disponíveis aqui.',
      'O formulário de Contato apenas prepara um texto local para você copiar. Preencher um e-mail nesse formulário não envia um pedido e não cadastra você em campanhas.'
    ],
    steps: ['Veja o estado do e-mail em Integrações.', 'Consulte a proposta do Completo na área de planos.', 'Use dados de exemplo ao explorar; não carregue listas de contatos.'],
    keywords: ['email', 'e-mail', 'marketing', 'completo', 'domínio', 'envio', 'newsletter'],
    link: { label: 'Entender as integrações', to: '/integracoes' }
  },
  {
    id: 'acesso', aliases: [], category: 'conta',
    title: 'Preciso entrar ou criar uma conta?',
    summary: 'A demonstração é aberta; o acesso a uma conta real ainda não está disponível.',
    paragraphs: [
      'Você pode abrir os exemplos e o painel sem cadastro. O painel usa dados de demonstração, não informações de uma conta sua. A página de acesso não representa autenticação funcional.',
      'Não existe recuperação de senha, convite de equipe ou perfil real disponível nesta etapa. Se você chegou procurando essas funções, volte à demonstração ou consulte o estado do produto na ajuda.',
      'Nunca informe senha de e-mail, WhatsApp ou outro serviço para explorar a demo. Em uma operação futura, as condições de acesso e de conta precisam estar implementadas e explicadas antes do uso.'
    ],
    steps: ['Abra o painel diretamente.', 'Leia o aviso de dados ilustrativos.', 'Use a ajuda para entender qualquer área em modo inicial.'],
    keywords: ['login', 'entrar', 'acesso', 'senha', 'cadastro', 'conta', 'equipe'],
    link: { label: 'Abrir a demonstração', to: '/exemplo' }
  },
  {
    id: 'dados-privacidade', aliases: ['dados-locais'], category: 'conta',
    title: 'O que acontece com os dados que eu digito?',
    summary: 'Entenda o uso local do painel, da busca e do pedido de contato.',
    paragraphs: [
      'A busca desta ajuda filtra os artigos no seu navegador. O formulário de contato prepara um texto local e não o envia a um destinatário. Ele não grava nome, e-mail ou mensagem no armazenamento local do navegador nem em uma conta.',
      'Ao escolher copiar, o texto é colocado na área de transferência do seu dispositivo. Você decide onde colar. Copiar não é enviar e não cria um atendimento. Ao sair da página, o rascunho pode se perder.',
      'As mudanças no painel de demonstração também não representam um histórico permanente. Endereços adicionados servem para explorar a interface, sem consulta ao site. Use exemplos sem dados pessoais, tokens ou senhas.',
      'Essas explicações descrevem os recursos locais desta versão, não todo o tratamento de dados de uma operação futura. A página de privacidade é um ponto de partida e ainda depende de revisão para o produto em funcionamento.'
    ],
    steps: ['Prefira dados fictícios para conhecer a interface.', 'Revise o texto antes de copiar ou colar em outro lugar.', 'Não inclua dados de clientes, senhas ou documentos no pedido de contato.'],
    keywords: ['dados', 'privacidade', 'salvo', 'armazenamento', 'localstorage', 'clipboard', 'copiar', 'lgpd'],
    link: { label: 'Ler a página de privacidade', to: '/privacy' }
  },
  {
    id: 'suporte', aliases: ['problemas', 'acessibilidade'], category: 'suporte',
    title: 'Como continuar se algo não funcionar',
    summary: 'Encontre orientação e prepare uma descrição da dificuldade sem simular um envio.',
    paragraphs: [
      'Se uma página não abrir, tente novamente ou volte a Como funciona. Antes de atualizar o navegador, lembre que mudanças locais da demonstração podem se perder. Um erro mostrado dentro do exemplo de formulário faz parte da história e não significa que a própria aplicação falhou.',
      'Você pode ler a explicação das etapas em texto, sem depender da animação. Use Tab para percorrer links e controles, Enter para abrir links e Enter ou Espaço para acionar botões. A preferência de movimento reduzido do dispositivo deve ser respeitada pela experiência.',
      'Na página de Contato, descreva o que tentou fazer, o que esperava e o que apareceu. Prepare e copie o pedido para guardar. Se o navegador impedir a cópia, o texto permanece disponível em um campo para selecionar e copiar manualmente.',
      'Não há atendimento conectado, chamado aberto ou prazo de resposta nesta demonstração. Preparar ou copiar um pedido não avisa uma equipe. Nenhum destinatário é escolhido automaticamente.'
    ],
    steps: ['Confira se a dúvida aparece em um dos artigos da ajuda.', 'Tente repetir a ação e anote o que aconteceu, sem incluir informações sensíveis.', 'Se precisar organizar o relato, use Preparar pedido na página de Contato.'],
    keywords: ['suporte', 'ajuda', 'problema', 'contato', 'teclado', 'acessibilidade', 'movimento', 'erro', 'cópia'],
    link: { label: 'Preparar um pedido', to: '/contato' }
  }
]

export function normalizeHelpText(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR')
}

export function filterHelpArticles(query: string, category: HelpCategory | 'all' = 'all'): HelpArticle[] {
  const terms = normalizeHelpText(query).trim().split(/\s+/).filter(Boolean)
  return helpArticles.filter((article) => {
    if (category !== 'all' && article.category !== category) return false
    const categoryName = helpCategories.find(item => item.id === article.category)?.label ?? ''
    const text = normalizeHelpText([article.title, article.summary, categoryName, ...article.paragraphs, ...article.steps, ...article.keywords].join(' '))
    return terms.every(term => text.includes(term))
  })
}
