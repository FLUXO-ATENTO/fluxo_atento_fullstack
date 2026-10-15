export const workspaceHelp = [
  {
    id: 'monitorar', title: 'Como monitorar uma página do meu site?',
    summary: 'Cadastre uma página e confira uma resposta real, com data e horário.',
    steps: ['Abra “Páginas monitoradas” no menu.', 'Informe o endereço público de uma página que você administra e escolha “Cadastrar página”.', 'Escolha “Verificar agora”. O resultado será salvo com o horário da consulta.', 'Use “Ver histórico” para comparar as consultas anteriores.'],
    note: 'A consulta atual verifica a resposta da página. Não testa compras, formulários nem conversas. As verificações são manuais.',
    action: 'Abrir monitoramento', path: '/dashboard/monitores', terms: 'site páginas URL HTTP monitor histórico verificar'
  },
  {
    id: 'integracoes', title: 'Onde conecto Google, Meta ou WhatsApp?',
    summary: 'Veja o que cada conexão permite e o que já está disponível.',
    steps: ['Abra “Integrações” no menu.', 'Leia a finalidade da conexão e os requisitos da ferramenta.', 'Quando a autorização estiver disponível, escolha a conta correta e confira as permissões antes de continuar.', 'Aguarde a confirmação da conexão e a sincronização dos dados.'],
    note: 'A autorização de Google e Meta Ads ainda está em desenvolvimento. Registrar WABA ou e-mail não conecta anúncios. Nunca envie senha ou chave em um chat.',
    action: 'Ver integrações', path: '/dashboard/canais', terms: 'google meta analytics anúncios whatsapp email chave conectar'
  },
  {
    id: 'perfil', title: 'Como alterar meu nome ou o tema do painel?',
    summary: 'Ajuste seus dados de exibição e escolha claro, escuro ou sistema.',
    steps: ['Abra o menu da sua conta ou “Meu perfil e preferências”.', 'Edite o nome e, se desejar, o telefone de contato. Escolha “Salvar perfil”.', 'Selecione uma aparência. A mudança de tema é imediata e fica neste navegador.', 'Para rever a introdução, escolha “Rever guia inicial”.'],
    note: 'O perfil não altera sua função nem as permissões da empresa. Para recuperar a senha, use a opção de recuperação na tela de entrada.',
    action: 'Abrir meu perfil', path: '/dashboard/configuracoes', terms: 'nome telefone senha perfil cor claro escuro tema aparência'
  },
  {
    id: 'planos', title: 'O que está incluído em cada plano?',
    summary: 'Compare a proposta de capacidade sem ativar uma assinatura.',
    steps: ['Abra “Planos e limites”.', 'Compare sites, páginas, respostas de IA e envios de e-mail.', 'Confira também os requisitos da ferramenta: um plano não conecta uma conta automaticamente.'],
    note: 'Contratação, cotas comerciais e medição de uso ainda não estão ativas. Conhecer uma proposta não gera cobrança.',
    action: 'Comparar propostas', path: '/dashboard/planos', terms: 'plano assinatura gratuito essencial completo módulos cotas limite cobrança'
  },
  {
    id: 'contexto', title: 'Como sei em qual empresa estou trabalhando?',
    summary: 'O contexto da empresa e a administração da plataforma são diferentes.',
    steps: ['Confira o nome da empresa no menu lateral.', 'No menu da conta, confira sua função.', 'Somente usuários autorizados veem “Abrir Superadmin”. Esse botão muda para a operação global da plataforma.'],
    note: 'O chat de suporte não concede acesso ao Superadmin nem aos dados de outras empresas.',
    action: 'Voltar ao início', path: '/dashboard', terms: 'tenant empresa administrador superadmin segurança permissão suporte'
  },
  {
    id: 'problema', title: 'O que fazer se algo não carregar?',
    summary: 'Recupere a operação sem compartilhar informações sensíveis.',
    steps: ['Confira a conexão com a internet. O indicador do topo informa se a API respondeu.', 'Use “Tentar novamente” ou “Atualizar dados” na página que apresentou erro.', 'Se a sessão terminou, entre novamente. Não crie outra conta para tentar recuperar seus dados.', 'Anote a página, o horário e a mensagem de erro, sem senhas, tokens ou dados de clientes.'],
    note: 'A central de mensagens de suporte ainda está em preparação. Não existe envio de chamado por esta página.',
    action: 'Abrir meu espaço', path: '/dashboard', terms: 'erro conexão falha indisponível suporte entrar sessão'
  }
] as const

export function searchWorkspaceHelp(query: string) {
  const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR')
  const terms = normalize(query).trim().split(/\s+/).filter(Boolean)
  return workspaceHelp.filter(article => terms.every(term => normalize(article.title + ' ' + article.summary + ' ' + article.terms).includes(term)))
}
