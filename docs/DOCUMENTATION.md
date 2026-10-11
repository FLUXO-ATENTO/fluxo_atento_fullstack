# Registro de governança documental

Revisão em 10/10/2026, branch fix/superadmin-session-crm. Escopo: todos os
documentos Markdown versionados deste repositório, perfis em .github/agents,
exemplos de ambiente e referências de rotas/infraestrutura. Não é revisão
jurídica, auditoria externa nem confirmação de todos os serviços remotos.

## Fonte canônica e gatilho de atualização

| Documento | Governa | Atualizar quando |
| --- | --- | --- |
| [README](../README.md) | Entrada, stack, links e uso | Mudarem stack, comandos ou índice |
| [AGENTS](../AGENTS.md) | Regras obrigatórias do trabalho | Mudar responsabilidade/limite/processo |
| [GOVERNANCE](GOVERNANCE.md) | Mudanças, privacidade e aceite | Mudar procedimento ou controle |
| [STATUS](STATUS.md) | Fatos por ambiente e migrações aplicadas | Houver execução/verificação real |
| [FULLSTACK](FULLSTACK.md) | Contratos e isolamento | Mudar API, dados, papel ou sessão |
| [SITE_MAP](SITE_MAP.md) | URLs por origem/build e indexação | Adicionar/remover/renomear rota |
| [INFRASTRUCTURE](INFRASTRUCTURE.md) | Destinos, ativos e localização | Mudar serviço, caminho, host ou evidência |
| [VPS_AGENT](VPS_AGENT.md) | Funções, limite e método operacional | Mudar atribuição/runbook |
| [IMPLEMENTATION_PLAN](IMPLEMENTATION_PLAN.md) | Ordem e portões de aceite | Mudar dependência/escopo de lançamento |
| [BACKLOG](BACKLOG.md) | Tarefas futuras e aceite | Iniciar/concluir tarefa ou criar issue |
| [UX](UX.md) | Jornadas e critérios de experiência | Mudar comportamento/controle |
| [CONTENT](CONTENT.md) | Copy e condições de exibição | Mudar mensagem/estado funcional |
| [OFFER](OFFER.md) | Hipótese comercial | Houver decisão comercial explícita |
| [VALIDATION](../VALIDATION.md) | Resultados e limitações dos testes | Executar novo teste relevante |
| [Runbook VPS](../ops/dashboard-vps/README.md) | Publicação/rollback | Mudar script/configuração de deploy |
| [WEBHOOKS](../ops/WEBHOOKS.md) | Contrato assíncrono futuro | Implementar/mudar fila ou conector |
| [Desenvolvimento](../.github/agents/fluxo-development.agent.md) | Perfil de engenharia | Mudar roteamento/responsabilidade |
| [Especialista VPS](../.github/agents/fluxo-vps.agent.md) | Perfil de operação | Mudar roteamento/responsabilidade |

## Inconsistências corrigidas nesta revisão

- Documentos que declaravam ausência total de Auth/backend foram reconciliados
  com STATUS, sem afirmar funcionamento de canais não homologados.
- Demo pública passou a ser referenciada como /exemplo; painel real tem mapa
  próprio no app. Rotas de compatibilidade não são o destino canônico.
- Arquivo de agente com “Fluxo de Clientes” no nome foi renomeado para FLUXO,
  corrigindo build, stack, catálogo e atribuições. Histórico permanece no Git.
- Exemplo da API deixou de apontar ao projeto Supabase excluído do escopo.
- Pooling 6543 deixou de ser descrito como conexão Node existente: uso atual é
  HTTPS/REST. Contrato de webhook exige persistência durável antes do ACK.
- Oferta foi mantida como hipótese comercial; UX/CONTENT não criam uma segunda
  tabela de preços/cotas nem uma definição concorrente sobre e-mail.
- A distinção entre SQL aplicado, código preparado e release publicada aparece
  em STATUS/VALIDATION; a nova revisão de frontend/API não foi instalada.
- Ativos VPS além do dashboard foram registrados com origem da evidência e
  lacunas explícitas, sem inferir aplicações pela porta.

## Pendências preservadas, não escondidas

Criação de issues externas recebeu 403; BACKLOG contém 11 tarefas prontas, não
issues já abertas. Auditoria de infraestrutura completa, sitemap XML/SEO,
copy pública residual, acessibilidade, oferta e conformidade jurídica possuem
etapas de validação. Não marcar essas atividades como feitas só por documentá-las.

Os resultados anteriores em VALIDATION estão sob seção histórica. Quantidades
antigas de testes e limitações de um ambiente antigo não são o status corrente.

## Procedimento para o próximo PR

1. Identificar documentos afetados nesta tabela.
2. Verificar arquivo/rota/serviço de origem antes de escrever um fato.
3. Atualizar fonte canônica e referenciar, evitando cópias divergentes.
4. Registrar data, ambiente, SHA e teste; ocultar segredos/dados pessoais.
5. Conferir links internos, URLs/nomes e diff; indicar lacunas e decisões pendentes.
6. Revisão humana e atualização de STATUS somente após execução comprovada.
