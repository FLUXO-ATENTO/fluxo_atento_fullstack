# Roadmap do Fluxo Atento

Prioridade do proprietário: **alinhar site e dashboard e torná-los funcionais**.
Este mapa registra intenções, não capacidades ativas. Cada entrega exige PR,
teste e aceite. n8n fica para depois.

| Ordem | Entrega | Aceite | Estado |
| --- | --- | --- | --- |
| P0.1 | Site → login → painel correto | Demo distinta, nome/tenant corretos, papel validado | Código nesta revisão |
| P0.2 | Claro/escuro, navegação e ajuda | Todas as superfícies, teclado/mobile, preferência persistida | Código nesta revisão |
| P0.3 | Segurança/continuidade | Dois tenants isolados, recuperação de conta, backup restaurado | Parcial |
| P0.4 | Login Google/GitHub | Apps, consentimento, callback, sucesso/cancelamento | Provedores desabilitados; frontend preparado |
| P1.1 | Consulta PageSpeed pública | Dados reais, cache, quotas, segurança, fonte/data, sem IA | Pendente |
| P1.2 | Handoff para app/agente | Recibo único vincula análise; sessão e contexto corretos | Pendente |
| P1.3 | Google/Meta | App global + consentimento da empresa, leitura mínima/revogação | Google em implementação para revisão; conexão real e Meta pendentes |
| P1.4 | Campanhas e funil | Fontes/período claros, sincronização e erros observáveis | Pendente |
| P1.5 | Copiloto com memória | BFF autorizado, ferramentas/quotas, histórico por tenant | Agente existe; produto não conectado |
| P1.6 | Chat humano | Central superadmin, mensagens privadas e notificações | Serviço pendente |
| P1.7 | Templates/permissões | Superadmin habilita módulos e limites no servidor | Pendente |
| P1.8 | Docs/agente | Conteúdo e HTTPS antes de DNS; docs privados realmente restritos | /docs com 12 guias, busca e links; /agente e entrada comum preparados; DNS e chat pendentes |
| P2.1 | Marca/design system | Logo/wordmark aprovados e aplicados em todos os temas | Registrado para depois desta implementação |
| P2.2 | Planos e cobrança | Webhooks assinados, quota atômica, plano versionado | Proposta |
| P2.3 | WABA/atendimento | Templates, filas, equipe, transferência e presença | Pendente |
| P3 | CRM e automações ampliadas | Valor validado, isolamento, arquivos e limites seguros | Futuro |
| Posterior | n8n | Benefício/licença/isolamento definidos antes de configurar | Adiado explicitamente |

## Marca e design system futuro

As cinco escolhas pessoais de paleta da entrega atual não substituem este
trabalho de marca. O padrão Fluxo Atento permanece preservado. Regras, skills,
especialistas locais e CI de documentação estão descritos em
[AGENT_OPERATIONS](AGENT_OPERATIONS.md) e [DOCS_PROCESS](DOCS_PROCESS.md); não
criam publicação automática nem agentes autônomos com acesso a produção.

Preservar agora a marca e framework existentes. Depois, criar design-system/
com fundamentos, símbolo e escrita Fluxo Atento, variantes clara/escura/monocromática,
margens, tamanho mínimo, favicon/PWA e exemplos. Moderno, conceitual e legível
em tamanhos pequenos. Não é redesign completo da aplicação. Aprovar o conceito
com o proprietário antes de substituir os arquivos atuais.

## Responsabilidades

- Proprietário: apps/ativos, credenciais no local seguro, consentimentos, dados
  jurídicos, custos e permissões administrativas.
- Engenharia: contratos, isolamento, UI, métricas, limites, testes e CI.
- Operação: VPS, versões, backup/restauração, deploy e rollback.
- Revisão humana: gate antes de produção.

Milhões de tenants é meta, não capacidade comprovada pela VPS atual. Antes de
escala, medir carga, custos por tenant, banco, filas e limites de provedores.
