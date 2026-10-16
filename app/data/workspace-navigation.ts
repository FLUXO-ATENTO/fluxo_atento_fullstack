export interface WorkspaceLink { label: string; path: string; icon: string; planned?: boolean }
export interface WorkspaceGroup { label: string; items: WorkspaceLink[] }

export const tenantNavigation: WorkspaceGroup[] = [
  { label: 'Principal', items: [
    { label: 'Início', path: '/dashboard', icon: 'i-lucide-house' },
    { label: 'Páginas monitoradas', path: '/dashboard/monitores', icon: 'i-lucide-radar' }
  ] },
  { label: 'Crescimento', items: [
    { label: 'Integrações', path: '/dashboard/canais', icon: 'i-lucide-plug' },
    { label: 'Campanhas e funil', path: '/dashboard/recursos?grupo=crescimento', icon: 'i-lucide-chart-no-axes-combined', planned: true }
  ] },
  { label: 'Operação', items: [
    { label: 'Atendimento', path: '/dashboard/recursos?grupo=atendimento', icon: 'i-lucide-messages-square', planned: true },
    { label: 'Automação e IA', path: '/dashboard/recursos?grupo=automacao', icon: 'i-lucide-workflow', planned: true }
  ] },
  { label: 'Administração', items: [
    { label: 'Equipe e acessos', path: '/dashboard/recursos?grupo=administracao', icon: 'i-lucide-users', planned: true },
    { label: 'Meu perfil e preferências', path: '/dashboard/configuracoes', icon: 'i-lucide-settings-2' },
    { label: 'Planos e limites', path: '/dashboard/planos', icon: 'i-lucide-credit-card' },
    { label: 'Mapa de recursos', path: '/dashboard/recursos', icon: 'i-lucide-grid-2x2' }
    ,{ label: 'Central de ajuda', path: '/dashboard/ajuda', icon: 'i-lucide-circle-help' }
  ] }
]

export const platformNavigation: WorkspaceGroup[] = [
  { label: 'Plataforma', items: [{ label: 'Visão geral', path: '/dashboard/admin', icon: 'i-lucide-layout-dashboard' }] },
  { label: 'Tenants e licenciamento', items: [
    { label: 'Tenants', path: '/dashboard/admin?secao=clientes', icon: 'i-lucide-building-2' },
    { label: 'Planos', path: '/dashboard/admin?secao=planos', icon: 'i-lucide-list-checks' },
    { label: 'Pagamentos', path: '/dashboard/admin?secao=financeiro', icon: 'i-lucide-credit-card', planned: true }
  ] },
  { label: 'Configurações', items: [
    { label: 'Personalização', path: '/dashboard/admin?secao=personalizacao', icon: 'i-lucide-palette', planned: true },
    { label: 'E-mail e notificações', path: '/dashboard/admin?secao=comunicacao', icon: 'i-lucide-mail', planned: true }
  ] },
  { label: 'Canais e integrações', items: [{ label: 'Provedores globais', path: '/dashboard/admin?secao=provedores', icon: 'i-lucide-plug' }] },
  { label: 'Sistema', items: [{ label: 'Segurança e operação', path: '/dashboard/admin?secao=sistema', icon: 'i-lucide-shield-check', planned: true }] }
]

/** A roadmap, not a permission matrix or a claim that modules exist. */
export const roadmap = [
  { id: 'crescimento', title: 'Campanhas e análises', priority: 'MVP prioritário', description: 'Da origem do tráfego até a conversão, com dados verificáveis.', items: ['Leitura Meta Ads e Google Ads', 'Propriedades GA4 e sincronização', 'Métricas por período e origem', 'Análise do funil com IA', 'Relatórios detalhados'] },
  { id: 'atendimento', title: 'Atendimento', priority: 'Jornada complementar', description: 'Operação da empresa separada do suporte da plataforma.', items: ['Caixa de entrada WABA e e-mail', 'Contatos e chat privado', 'Filas, equipes e atribuição', 'Presença online, pausado e offline', 'Protocolos e avaliações', 'Suporte à plataforma com anexos e áudio'] },
  { id: 'comunicacao', title: 'Comunicação e marketing', priority: 'Expansão', description: 'Envios exigem canal validado, consentimento e regras do provedor.', items: ['Campanhas e envio em massa', 'E-mail marketing', 'Galeria e mensagens rápidas', 'Grupos e Google Calendar', 'Instagram, TikTok e YouTube'] },
  { id: 'gestao', title: 'Gestão do negócio', priority: 'MVP: funil', description: 'Começar pelo funil; ampliar a operação após validar as integrações.', items: ['Funil e conversões', 'Kanban e tarefas', 'Agenda e agendamento público', 'Catálogo, etiquetas e notas', 'Cobranças e fechamento', 'Horários de atendimento e motivos de pausa'] },
  { id: 'automacao', title: 'Automação e IA', priority: 'MVP: copiloto', description: 'Rascunho, teste e publicação separados; ações sensíveis exigem aprovação.', items: ['Copiloto contextual', 'Modelos e orçamento por tarefa', 'Chat Flow visual com nós e condições', 'Testes, versões, duplicação e importação de fluxos', 'Respostas Instagram: comentários, stories e lives', 'Agendamentos e aniversários'] },
  { id: 'administracao', title: 'Administração e registros', priority: 'Base obrigatória', description: 'Acesso verificado no servidor, sempre limitado à empresa atual.', items: ['Equipes e usuários', 'Permissões por perfil e horários', 'API e integrações Meta', 'Log de auditoria e histórico de ações', 'Painel de atendimentos e relatórios', 'Telefonia e log de ligações'] }
] as const
