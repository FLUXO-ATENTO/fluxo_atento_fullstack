/** Public product copy only. Editorial evidence and workflow live in docs/DOCS_PROCESS.md. */
export const productDocGroups = [
  { id: 'comecar', title: 'Primeiros passos', description: 'Conheça o produto e encontre seu acesso.' },
  { id: 'monitorar', title: 'Monitorar uma página', description: 'Cadastre, confira e entenda os resultados.' },
  { id: 'recursos', title: 'Recursos e próximos passos', description: 'Saiba o que ainda está em preparação.' },
  { id: 'ajuda', title: 'Ajuda e seus dados', description: 'Encontre orientação e cuide das suas informações.' }
] as const

export type ProductDocGroupId = typeof productDocGroups[number]['id']
export type ProductDocStatus = 'available' | 'review' | 'planned' | 'guidance'

export const productDocStatuses: Record<ProductDocStatus, string> = {
  available: 'Disponível no produto', review: 'Em revisão', planned: 'Planejado', guidance: 'Orientação'
}

export const productDocsSnapshot = {
  date: '2026-10-15', label: '15 de outubro de 2026',
  live: 'O acesso por e-mail e senha e a verificação manual de páginas já foram testados no produto em uso.',
  review: 'A nova interface do painel e este portal de Docs estão em revisão e ainda não foram publicados.',
  planned: 'Login com Google ou GitHub, integrações de negócio, IA no painel e chat de suporte ainda não estão disponíveis.'
} as const

export interface ProductDocSection {
  readonly id: string
  readonly title: string
  readonly paragraphs?: readonly string[]
  readonly steps?: readonly string[]
  readonly bullets?: readonly string[]
}

export interface ProductDocArticle {
  readonly slug: string
  readonly group: ProductDocGroupId
  readonly title: string
  readonly summary: string
  readonly status: ProductDocStatus
  readonly keywords: readonly string[]
  readonly sections: readonly ProductDocSection[]
  readonly note: { readonly title: string; readonly text: string }
  readonly related: readonly string[]
  readonly links: readonly { readonly label: string; readonly to: string }[]
}

export const productDocs: readonly ProductDocArticle[] = [
  {
    slug: 'primeiros-passos', group: 'comecar', title: 'Comece pelo que você precisa',
    summary: 'Escolha entre conhecer o exemplo e acompanhar uma página real do seu site.',
    status: 'guidance', keywords: ['começar', 'guia', 'tutorial', 'início', 'disponível'],
    sections: [
      { id: 'escolha-seu-caminho', title: 'Escolha seu caminho', steps: [
        'Para conhecer a proposta sem entrar em uma conta, abra o painel de exemplo.',
        'Se você já tem uma conta e quer consultar dados reais, use “Acessar meu painel” e entre com e-mail e senha.',
        'No painel, abra a área de monitoramento para cadastrar uma página e solicitar uma verificação.'
      ] },
      { id: 'o-que-funciona', title: 'O que já funciona', paragraphs: [
        'O acesso por senha com uma conta existente e a criação e consulta de um monitor foram verificados no produto em uso. O resultado da verificação permanece salvo ao recarregar o painel.',
        'O monitoramento básico permite até duas páginas de um mesmo site. Cada consulta é solicitada por você; não há agendamento automático nesta etapa.'
      ] },
      { id: 'o-que-esta-mudando', title: 'O que ainda está em preparação', paragraphs: [
        'A nova interface do painel e este portal de Docs ainda estão em revisão, sem publicação. A organização dos menus e a aparência podem ser diferentes no painel que você acessa hoje.',
        'Login com Google ou GitHub, integrações de anúncios, IA no painel e chat de suporte ainda não estão disponíveis. Páginas e propostas sobre esses recursos explicam a evolução prevista.'
      ] }
    ],
    note: { title: 'Leia o estado de cada recurso', text: '“Disponível no produto” se refere à função já verificada. “Em revisão” indica uma nova interface ainda não publicada. “Planejado” indica uma função que você ainda não pode usar.' },
    related: ['acessar-minha-conta', 'cadastrar-uma-pagina'],
    links: [{ label: 'Explorar o painel de exemplo', to: '/exemplo' }, { label: 'Entender a proposta', to: '/como-funciona' }]
  },
  {
    slug: 'acessar-minha-conta', group: 'comecar', title: 'Entrar na minha conta',
    summary: 'Use seu e-mail e sua senha para acessar o painel com dados reais.',
    status: 'available', keywords: ['acesso', 'login', 'senha', 'conta', 'e-mail', 'email', 'sessão', 'cadastro', 'recuperação'],
    sections: [
      { id: 'entrar-com-senha', title: 'Entre com e-mail e senha', steps: [
        'Escolha “Acessar meu painel” nesta página.',
        'Informe o e-mail e a senha da sua conta existente e confirme a entrada.',
        'Aguarde o painel abrir. Confira o contexto da sua conta antes de trabalhar com seus dados.'
      ] },
      { id: 'se-nao-conseguir-entrar', title: 'Se não conseguir entrar', paragraphs: [
        'Confira o e-mail informado e a mensagem da tela. Se a sessão tiver terminado, entre novamente com a mesma conta.',
        'O cadastro de novas contas e a recuperação por e-mail ainda precisam de validação completa no produto em uso. A existência dessas opções na tela não garante a conclusão do processo ou a entrega de e-mails.',
        'Se a dificuldade continuar, consulte as orientações de suporte e prepare um relato sem incluir sua senha ou códigos de acesso.'
      ] },
      { id: 'outras-formas-de-entrar', title: 'E o acesso com Google ou GitHub?', paragraphs: [
        'O login com Google ou GitHub está preparado para uma etapa futura, mas os provedores continuam desabilitados. Use e-mail e senha enquanto essa opção não for liberada e validada.',
        'Entrar na conta não conecta automaticamente contas de anúncios, WhatsApp ou outros serviços da sua empresa.'
      ] }
    ],
    note: { title: 'Sua senha é pessoal', text: 'Não compartilhe sua senha ou códigos de confirmação. Uma demonstração pública não dá acesso aos dados da sua empresa.' },
    related: ['exemplo-e-painel', 'resolver-uma-dificuldade'],
    links: [{ label: 'Consultar orientações de suporte', to: '/suporte' }]
  },
  {
    slug: 'exemplo-e-painel', group: 'comecar', title: 'Entender o exemplo e o painel real',
    summary: 'Saiba quando você está explorando uma situação ilustrativa ou consultando uma página real.',
    status: 'guidance', keywords: ['demo', 'demonstração', 'exemplo', 'dados reais', 'painel', 'teste'],
    sections: [
      { id: 'painel-de-exemplo', title: 'No painel de exemplo', paragraphs: [
        'As situações e os resultados são ilustrativos. Você pode conhecer a proposta sem entrar em uma conta.',
        'Adicionar um endereço ao exemplo não acessa o site nem inicia monitoramento real. Os exemplos de formulário, compra e mudança de conteúdo não comprovam que essas verificações estejam disponíveis no produto.'
      ] },
      { id: 'painel-da-sua-conta', title: 'No painel da sua conta', paragraphs: [
        'Depois de entrar, a área de monitoramento permite cadastrar uma página pública e solicitar uma consulta real da resposta dessa página.',
        'O resultado tem o horário da consulta e é salvo no painel. Ele não representa uma compra de teste, uma mensagem enviada ou uma correção automática no seu site.'
      ] },
      { id: 'antes-de-concluir', title: 'Antes de tirar uma conclusão', steps: [
        'Confira se a tela está identificada como exemplo ou demonstração.',
        'Para consultar seu site, entre na sua conta e abra o monitoramento.',
        'Confira o endereço e o horário do resultado antes de decidir o próximo passo.'
      ] }
    ],
    note: { title: 'Um exemplo ajuda a entender', text: 'Um erro ilustrativo no exemplo não significa que seu site esteja com problema. O site não foi consultado naquela demonstração.' },
    related: ['cadastrar-uma-pagina', 'entender-um-resultado'],
    links: [{ label: 'Abrir a demonstração', to: '/exemplo' }, { label: 'Ler a explicação dos exemplos', to: '/como-funciona' }]
  },
  {
    slug: 'cadastrar-uma-pagina', group: 'monitorar', title: 'Cadastrar e verificar uma página',
    summary: 'Escolha uma página pública do seu site e faça a primeira consulta manual.',
    status: 'available', keywords: ['monitor', 'monitoramento', 'site', 'url', 'endereço', 'cadastrar', 'verificar', 'https', 'histórico'],
    sections: [
      { id: 'antes-de-comecar', title: 'Antes de começar', paragraphs: [
        'Use uma página pública de um site que você administra. O monitoramento básico aceita até duas páginas de um mesmo site.',
        'Prefira o endereço HTTPS da página, sem senha, parâmetros ou fragmentos. Não use links de acesso privado, recuperação de conta ou endereços que contenham informações de clientes.'
      ] },
      { id: 'primeira-verificacao', title: 'Faça a primeira verificação', steps: [
        'Entre no painel com sua conta e abra a área de monitoramento de páginas.',
        'Informe o endereço público e escolha “Cadastrar página”.',
        'Na página cadastrada, escolha “Verificar agora” e aguarde o resultado.',
        'Leia a resposta e o horário da consulta. Use “Ver histórico” para consultar verificações anteriores, quando houver.'
      ] },
      { id: 'depois-do-cadastro', title: 'Depois do cadastro', paragraphs: [
        'Cadastrar uma página não cria um resultado antes da primeira consulta. Para obter uma nova observação, solicite outra verificação.',
        'As verificações são manuais. Não há agendamento automático nem alertas por WhatsApp ou e-mail conectados nesta etapa.'
      ] }
    ],
    note: { title: 'A função existe; a interface está mudando', text: 'O monitor real já foi verificado em uso. A nova interface ainda não foi publicada, por isso o nome ou a posição de um botão pode variar.' },
    related: ['entender-um-resultado', 'resolver-uma-dificuldade'],
    links: [{ label: 'Consultar a central de ajuda', to: '/ajuda' }]
  },
  {
    slug: 'entender-um-resultado', group: 'monitorar', title: 'Entender o resultado da verificação',
    summary: 'Leia a resposta e o horário da consulta sem confundir um sinal com uma auditoria completa.',
    status: 'available', keywords: ['resultado', 'http', 'resposta', 'erro', 'histórico', '200', 'falha', 'tempo'],
    sections: [
      { id: 'leia-a-observacao', title: 'Leia a observação', steps: [
        'Confira se o endereço é o da página que você queria verificar.',
        'Leia a descrição do resultado e o horário em que a consulta foi feita.',
        'Se precisar comparar, consulte o histórico disponível ou solicite uma nova verificação.'
      ] },
      { id: 'o-que-os-estados-significam', title: 'O que os estados significam', bullets: [
        'Ainda não verificado: não existe uma consulta salva para essa página.',
        'Respondeu: a consulta recebeu uma resposta considerada bem-sucedida.',
        'Confira a resposta: houve uma resposta que pede atenção; leia os detalhes antes de concluir a causa.',
        'Verificação incompleta: a consulta não terminou como esperado. Isso, sozinho, não prova que o site esteja fora do ar.'
      ] },
      { id: 'limites-da-consulta', title: 'O que o resultado não comprova', paragraphs: [
        'Uma resposta HTTP 200 indica que a página respondeu à consulta. Não confirma que uma compra, um formulário ou uma conversa funcionou.',
        'O tempo exibido se refere àquela consulta, não a uma medição completa da experiência de todos os visitantes. A consulta pública de desempenho com PageSpeed ainda está planejada.',
        'A observação vale para o horário registrado. Ela não garante que a página permaneça disponível depois desse momento nem corrige problemas automaticamente.'
      ] }
    ],
    note: { title: 'Confira antes de agir', text: 'Use o resultado como ponto de partida. Abra a página no seu navegador e investigue o comportamento que motivou a dúvida.' },
    related: ['resolver-uma-dificuldade', 'exemplo-e-painel'],
    links: [{ label: 'Ver mais orientações de ajuda', to: '/ajuda' }]
  },
  {
    slug: 'resolver-uma-dificuldade', group: 'monitorar', title: 'O que fazer quando algo não carregar',
    summary: 'Confira sua conexão, seu acesso e a mensagem exibida antes de preparar um relato.',
    status: 'guidance', keywords: ['problema', 'falha', 'erro', 'conexão', 'internet', 'sessão', 'carregar', 'indisponível'],
    sections: [
      { id: 'tente-estes-passos', title: 'Tente estes passos', steps: [
        'Confira sua conexão com a internet e leia a mensagem apresentada no painel.',
        'Se a sessão terminou, entre novamente com a mesma conta.',
        'Use a opção de tentar novamente ou atualizar os dados, quando aparecer.',
        'Se a dificuldade continuar, anote a página, o horário, a ação que tentou fazer e a mensagem recebida.'
      ] },
      { id: 'endereco-nao-aceito', title: 'Se o endereço não for aceito', paragraphs: [
        'Confira se é uma página pública de um site que você administra. Use o endereço sem senha, parâmetros ou fragmentos.',
        'Confira também o limite do monitoramento básico: até duas páginas de um mesmo site. A proposta de planos não aumenta automaticamente esse limite.'
      ] },
      { id: 'prepare-o-relato', title: 'Prepare um relato seguro', paragraphs: [
        'Descreva o que esperava e o que aconteceu. Se incluir uma imagem, oculte dados pessoais e informações de clientes.',
        'Não envie senhas, códigos de confirmação ou links de acesso privado. Preparar um texto na página de contato não envia a mensagem e não abre um chamado.'
      ] }
    ],
    note: { title: 'Uma falha merece contexto', text: 'Uma consulta incompleta pode ter diferentes causas. A mensagem isolada não confirma que o site está indisponível nem que dados foram perdidos.' },
    related: ['pedir-ajuda', 'acessar-minha-conta'],
    links: [{ label: 'Preparar um pedido de ajuda', to: '/contato' }, { label: 'Consultar suporte', to: '/suporte' }]
  },
  {
    slug: 'integracoes', group: 'recursos', title: 'Google, Meta e WhatsApp: o que esperar',
    summary: 'Entenda a diferença entre entrar na conta e autorizar uma integração da sua empresa.',
    status: 'planned', keywords: ['integração', 'integrações', 'google', 'github', 'meta', 'facebook', 'whatsapp', 'anúncios', 'conectar', 'oauth'],
    sections: [
      { id: 'acesso-e-integracao', title: 'Acesso e integração são permissões diferentes', paragraphs: [
        'O login serve para entrar no Fluxo Atento. Uma integração serve para consultar ou usar dados de outro serviço, com autorização própria.',
        'Mesmo quando o login com Google ou GitHub for liberado, ele não deverá ser confundido com a autorização para acessar anúncios, campanhas ou outros dados da empresa. Facebook está previsto como integração, não como opção de login.'
      ] },
      { id: 'estado-atual', title: 'O que está disponível agora', paragraphs: [
        'As conexões de negócio com Google, Meta e WhatsApp ainda não foram validadas do início ao fim e não estão liberadas como recursos prontos.',
        'Uma tela de configuração ou um canal listado não comprova conexão, sincronização de dados ou envio de mensagens. Não há automação de campanhas ou atendimento por WhatsApp disponível nesta etapa.'
      ] },
      { id: 'quando-for-liberado', title: 'Quando uma conexão for liberada', steps: [
        'Leia o guia específico da integração e confira se o recurso está disponível.',
        'Confira a conta da empresa e as permissões solicitadas antes de autorizar.',
        'Aguarde uma confirmação real da conexão antes de esperar dados ou mensagens.'
      ] }
    ],
    note: { title: 'Ainda sem data de liberação', text: 'Esses passos orientam uma etapa futura. Não há conexão de negócio pronta nem prazo de liberação confirmado por este guia.' },
    related: ['ia-e-atendimento', 'planos-e-limites'],
    links: [{ label: 'Conhecer as integrações previstas', to: '/integracoes' }]
  },
  {
    slug: 'ia-e-atendimento', group: 'recursos', title: 'IA e atendimento: o que está planejado',
    summary: 'Saiba o que ainda precisa estar pronto antes de conversar com a IA ou abrir um chat de suporte.',
    status: 'planned', keywords: ['ia', 'inteligência artificial', 'agente', 'copiloto', 'memória', 'chat', 'suporte', 'atendimento', 'notificações', 'áudio'],
    sections: [
      { id: 'ia-no-painel', title: 'A IA no painel', paragraphs: [
        'O chat de IA do produto ainda não está conectado do início ao fim. Não há análise por IA, memória de conversas ou execução de ações disponível no painel nesta etapa.',
        'A proposta de um copiloto não comprova uma análise do seu negócio. Os resultados atuais do monitoramento são consultas da resposta de páginas.'
      ] },
      { id: 'atendimento-humano', title: 'O atendimento humano', paragraphs: [
        'Há orientações de ajuda na interface, mas o chat persistente de suporte ainda não está conectado. Anexos, áudio e notificações também continuam pendentes.',
        'A página de contato permite preparar um relato e encontrar o contato público. Preparar ou copiar o texto não abre um atendimento nem garante prazo de resposta.'
      ] },
      { id: 'o-que-fazer-hoje', title: 'O que você pode fazer hoje', steps: [
        'Consulte os guias de acesso e monitoramento para sua dúvida atual.',
        'Se precisar, prepare um relato na página de contato.',
        'Revise o texto e envie pelo canal indicado nessa página, sem incluir senhas ou informações de clientes.'
      ] }
    ],
    note: { title: 'Cada recurso precisa de confirmação', text: 'Uma tela de conversa não significa que uma mensagem foi enviada, recebida ou analisada. Aguarde a liberação e a confirmação do serviço correspondente.' },
    related: ['pedir-ajuda', 'evolucao-dos-guias'],
    links: [{ label: 'Ver as orientações de suporte', to: '/suporte' }, { label: 'Preparar um relato', to: '/contato' }]
  },
  {
    slug: 'planos-e-limites', group: 'recursos', title: 'Entender planos e limites',
    summary: 'Compare a proposta dos planos e reconheça o limite do monitoramento atual.',
    status: 'planned', keywords: ['plano', 'planos', 'gratuito', 'essencial', 'completo', 'preço', 'assinatura', 'cobrança', 'limite', 'cota', 'módulos'],
    sections: [
      { id: 'limite-atual', title: 'O limite do monitoramento atual', paragraphs: [
        'O monitoramento básico atual permite até duas páginas de um mesmo site. Esse limite deve ser considerado ao escolher quais páginas cadastrar.'
      ] },
      { id: 'proposta-dos-planos', title: 'O que a comparação de planos mostra', paragraphs: [
        'Gratuito, Essencial e Completo são propostas de capacidades. A cobrança e as cotas comerciais completas ainda não estão ativas.',
        'Números de páginas, respostas de IA ou envios previstos em um plano não comprovam que a função esteja liberada. Uma proposta de plano também não conecta uma conta de anúncios ou WhatsApp automaticamente.'
      ] },
      { id: 'como-comparar', title: 'Como comparar com clareza', steps: [
        'Abra a página de planos e leia a identificação de proposta.',
        'Confira o estado de cada recurso nos guias antes de contar com ele no seu trabalho.',
        'Se uma capacidade for essencial para você, prepare uma dúvida na página de contato.'
      ] }
    ],
    note: { title: 'Consultar não ativa uma assinatura', text: 'Ler a proposta não gera cobrança nem amplia o limite do monitoramento. Não há contratação concluída por este portal de documentação.' },
    related: ['cadastrar-uma-pagina', 'integracoes'],
    links: [{ label: 'Comparar as propostas de planos', to: '/planos' }]
  },
  {
    slug: 'pedir-ajuda', group: 'ajuda', title: 'Preparar um pedido de ajuda',
    summary: 'Organize sua dúvida com o contexto necessário e sem compartilhar informações sensíveis.',
    status: 'guidance', keywords: ['ajuda', 'suporte', 'contato', 'pedido', 'mensagem', 'e-mail', 'email', 'chamado', 'atendimento'],
    sections: [
      { id: 'monte-seu-relato', title: 'Monte seu relato', steps: [
        'Anote em qual página estava e se era o exemplo ou o painel da sua conta.',
        'Descreva a ação que tentou, o resultado esperado e a mensagem que apareceu.',
        'Inclua o horário aproximado e remova dados pessoais, senhas e informações de clientes.',
        'Abra a página de contato, prepare o texto e revise antes de copiar ou enviar pelo seu aplicativo de e-mail.'
      ] },
      { id: 'o-que-acontece-com-o-pedido', title: 'O que acontece com o pedido', paragraphs: [
        'O formulário de contato prepara um texto no seu dispositivo. Preparar e copiar não envia uma mensagem, não avisa a equipe e não abre um chamado.',
        'O link de e-mail da página de contato abre seu aplicativo de e-mail. Você revisa e envia por lá; abrir o link não comprova envio ou recebimento.',
        'O chat interno ainda não está conectado. Não há prazo de resposta confirmado neste guia.'
      ] },
      { id: 'se-nao-conseguir-copiar', title: 'Se não conseguir copiar', paragraphs: [
        'Use a opção de selecionar o texto preparado e o comando Copiar do seu dispositivo. Salve o que precisar antes de sair ou atualizar a página.'
      ] }
    ],
    note: { title: 'Compartilhe apenas o necessário', text: 'Nunca inclua senhas, códigos de confirmação, chaves ou links privados no relato. Se usar uma imagem, oculte também os dados de clientes.' },
    related: ['resolver-uma-dificuldade', 'privacidade-e-dados'],
    links: [{ label: 'Preparar meu pedido', to: '/contato' }, { label: 'Consultar a central de ajuda', to: '/ajuda' }]
  },
  {
    slug: 'privacidade-e-dados', group: 'ajuda', title: 'Cuidar dos seus dados ao usar os guias',
    summary: 'Reconheça o conteúdo público e encontre as páginas sobre privacidade e exclusão de dados.',
    status: 'guidance', keywords: ['privacidade', 'dados', 'segurança', 'público', 'privado', 'exclusão', 'termos', 'permissão'],
    sections: [
      { id: 'documentacao-publica', title: 'Esta documentação é pública', paragraphs: [
        'Os guias explicam o produto de forma geral. Não exibem dados da sua conta, documentos privados, conversas ou instruções específicas da sua empresa.',
        'A busca consulta apenas estes guias públicos. Ela não pesquisa seus monitores, seus clientes ou seu histórico de atendimento.'
      ] },
      { id: 'cuidados-no-uso', title: 'Cuidados no dia a dia', steps: [
        'Use apenas endereços públicos de páginas que você administra ao cadastrar um monitor.',
        'Não coloque senhas, códigos de acesso ou informações de clientes na busca ou em um pedido de ajuda.',
        'Antes de compartilhar uma imagem, confira se há dados pessoais ou informações privadas visíveis.'
      ] },
      { id: 'onde-consultar', title: 'Onde consultar mais informações', paragraphs: [
        'Consulte as páginas de privacidade, termos de uso e orientações para exclusão de dados pelos links abaixo.',
        'Este guia não confirma a exclusão de uma conta nem substitui uma solicitação pelo canal indicado na página correspondente.'
      ] }
    ],
    note: { title: 'Documentação privada exige proteção própria', text: 'Uma futura área de documentos da empresa precisará de acesso autenticado e autorização. Esses documentos não fazem parte deste portal público.' },
    related: ['pedir-ajuda', 'evolucao-dos-guias'],
    links: [{ label: 'Política de privacidade', to: '/privacy' }, { label: 'Termos de uso', to: '/terms' }, { label: 'Orientações para exclusão de dados', to: '/exclusao-de-dados' }]
  },
  {
    slug: 'evolucao-dos-guias', group: 'ajuda', title: 'Como esta documentação vai evoluir',
    summary: 'Entenda como os guias acompanham o produto e como sugerir uma correção.',
    status: 'review', keywords: ['documentação', 'docs', 'guias', 'atualização', 'evolução', 'novidade', 'roteiro', 'roadmap', 'revisão'],
    sections: [
      { id: 'esta-primeira-versao', title: 'Esta primeira versão', paragraphs: [
        'Este portal reúne guias públicos de acesso, monitoramento, recursos previstos e ajuda. A organização por assunto, a busca e os links de cada artigo fazem parte da nova interface em revisão, ainda não publicada.',
        'O conteúdo considera o estado do produto registrado em 15 de outubro de 2026. A data da consulta às fontes não significa que todos os recursos foram publicados nessa data.'
      ] },
      { id: 'novos-guias', title: 'Quando novos guias entram', paragraphs: [
        'Os guias devem acompanhar mudanças verificadas no produto e passar por revisão humana. Um recurso planejado só pode ser descrito como disponível depois de sua liberação e validação.',
        'Integrações, IA, atendimento e futuros documentos restritos terão orientações próprias quando estiverem prontos. Não há datas de lançamento confirmadas por este portal.'
      ] },
      { id: 'sugerir-uma-correcao', title: 'Sugira uma correção', steps: [
        'Anote o título do guia e copie seu link direto.',
        'Descreva qual passo ficou confuso ou qual informação precisa de correção.',
        'Prepare o relato na página de contato, sem incluir informações privadas.'
      ] }
    ],
    note: { title: 'Uma novidade precisa de confirmação', text: 'Um anúncio, uma tela ou uma mudança no texto não são suficientes para afirmar que um recurso já funciona. Os guias devem refletir o que foi verificado.' },
    related: ['primeiros-passos', 'pedir-ajuda'],
    links: [{ label: 'Preparar uma sugestão', to: '/contato' }]
  }
]

export const defaultProductDocSlug = 'primeiros-passos'

/** Missing query opens the introduction; malformed, repeated or unknown queries stay not-found. */
export function resolveProductDoc(value: unknown): ProductDocArticle | null {
  const slug = value === undefined ? defaultProductDocSlug : value
  if (typeof slug !== 'string') return null
  return productDocs.find(article => article.slug === slug) ?? null
}

export function productDocHref(slug: string, section?: string): string {
  return `/docs?artigo=${encodeURIComponent(slug)}${section ? `#${encodeURIComponent(section)}` : ''}`
}

export function normalizeProductDocSearch(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').replace(/[^a-z0-9]+/g, ' ').trim()
}

const productDocSearchIndex = productDocs.map(article => {
  const text = normalizeProductDocSearch([
    article.title, article.summary, article.keywords.join(' '),
    productDocGroups.find(group => group.id === article.group)?.title,
    productDocStatuses[article.status], article.note.title, article.note.text,
    ...article.sections.flatMap(section => [section.title, ...(section.paragraphs ?? []), ...(section.steps ?? []), ...(section.bullets ?? [])])
  ].join(' '))
  return {
    article, text, words: new Set(text.split(' ')),
    title: normalizeProductDocSearch(article.title),
    keywords: normalizeProductDocSearch(article.keywords.join(' '))
  }
})

/** Search is local and never changes the selected article or its source copy. */
export function searchProductDocs(query: string): readonly ProductDocArticle[] {
  const terms = normalizeProductDocSearch(query).split(' ').filter(Boolean)
  if (!terms.length) return query.trim() ? [] : [...productDocs]
  return productDocSearchIndex
    .filter(entry => terms.every(term => term.length <= 2 ? entry.words.has(term) : entry.text.includes(term)))
    .map(entry => ({
      article: entry.article,
      score: terms.reduce((score, term) => score + (entry.title.split(' ').includes(term) ? 4 : 0) + (entry.keywords.split(' ').includes(term) ? 2 : 0), 0)
    }))
    .sort((a, b) => b.score - a.score)
    .map(entry => entry.article)
}

/** Previous/next stay within the current topic; related guides provide cross-topic discovery. */
export function productDocNeighbors(slug: string): { previous: ProductDocArticle | null; next: ProductDocArticle | null } {
  const article = resolveProductDoc(slug)
  if (!article) return { previous: null, next: null }
  const siblings = productDocs.filter(item => item.group === article.group)
  const index = siblings.findIndex(item => item.slug === slug)
  return { previous: siblings[index - 1] ?? null, next: siblings[index + 1] ?? null }
}
