# Fluxo Atento — orientação para agentes

Trabalhe no objetivo e nos arquivos autorizados pela tarefa atual. Este checkout
pode ser compartilhado: inspecione o diff, preserve mudanças alheias e combine um
responsável por arquivo antes de editar. Decisões atuais do usuário prevalecem
sobre propostas antigas; registre divergências sem ampliar o escopo.

## Fontes canônicas

Leia [GOVERNANCE](docs/GOVERNANCE.md) e [STATUS](docs/STATUS.md) antes de alterar ou
revisar comportamento. Depois, consulte apenas as fontes pertinentes:

| Assunto | Fonte |
| --- | --- |
| Autenticação, papéis e onboarding | [AUTH_ONBOARDING](docs/AUTH_ONBOARDING.md) |
| Ativos, ambientes e responsáveis | [ASSETS](docs/ASSETS.md) |
| Prioridades e trabalho adiado | [ROADMAP](docs/ROADMAP.md) |
| Requisitos e arquitetura do produto | [REQUIREMENTS](docs/REQUIREMENTS.md), [SAAS_BLUEPRINT](docs/SAAS_BLUEPRINT.md) |
| UX e linguagem | [UX](docs/UX.md), [CONTENT](docs/CONTENT.md); considerar a data e o caráter proposto desses textos |
| Segredos e isolamento | [SECURITY_CREDENTIALS](docs/SECURITY_CREDENTIALS.md) |
| Aceite para lançamento | [LAUNCH_CHECKLIST](docs/LAUNCH_CHECKLIST.md) |
| Delegação, validação e entrega | [AGENT_OPERATIONS](docs/AGENT_OPERATIONS.md) |

Código implementado, teste local, preview e produção são evidências diferentes.
Não apresentar roadmap, menu, mock ou relatório antigo como capacidade ativa.
Comandos vêm de [package.json](package.json); a execução de CI é definida em
[ci.yml](.github/workflows/ci.yml), não por estas instruções.

## Limites do produto e da operação

- Preserve a marca original como padrão. Paletas são preferências pessoais;
  redesign de marca e n8n permanecem adiados conforme o roadmap.
- Mantenha um único acesso pertencente ao app. A convergência para `/acessar`
  está na entrega em curso; confirme código e aceite antes de descrevê-la como
  publicada. O painel da empresa não oferece troca para a plataforma.
- Valide identidade, associação ao tenant e papel no servidor; preferências,
  menus e `user_metadata` não concedem autorização.
- Os Docs públicos terão fonte em `app/data/product-docs.ts`; confirme sua
  presença na revisão. Documentos operacionais em `docs/` são separados e não
  devem ser publicados automaticamente como conteúdo do produto.
- Produção exige PR, CI e revisão humana, além da autorização operacional
  aplicável. Skills e agentes não concedem acesso a contas, deploy ou segredos.

## Reuso e delegação

Use [fluxo-delivery](.agents/skills/fluxo-delivery/SKILL.md) para implementação
autorizada e [fluxo-review](.agents/skills/fluxo-review/SKILL.md) para revisão
somente leitura. Os quatro papéis locais e o contrato de delegação estão em
[AGENT_OPERATIONS](docs/AGENT_OPERATIONS.md). Delegue apenas partes delimitadas
da tarefa; a existência dos arquivos não inicia agentes nem tarefas recorrentes.

O agente [FLUXO ATENTO](.github/agents/FLUXO%20ATENTO.agent.md)
existente continua sendo a orientação geral da integração GitHub/editor.
Os TOMLs em `.codex/agents/` são especialistas do Codex e reutilizam estas
fontes; não substituem esse agente nem configuram execução de IA no CI.
