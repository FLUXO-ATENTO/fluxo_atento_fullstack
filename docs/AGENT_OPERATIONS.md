# Operação dos agentes do Fluxo Atento

Este guia define trabalho local e delegado no repositório. As regras de mudança,
PR, aceite e produção permanecem em [GOVERNANCE](GOVERNANCE.md); o estado factual
fica em [STATUS](STATUS.md). Use [AGENTS.md](../AGENTS.md) como entrada para as
fontes do produto, sem reproduzir suas especificações nas skills.

## Reuso e papéis

| Recurso | Responsabilidade | Escrita |
| --- | --- | --- |
| [FLUXO ATENTO](../.github/agents/FLUXO%20DE%20CLIENTES%20AGENTE.agent.md) | Agente geral existente da integração GitHub/editor; mantém orientação de arquitetura, reuso e qualidade | Conforme a tarefa e as permissões da sessão que o utiliza |
| [fluxo-delivery](../.agents/skills/fluxo-delivery/SKILL.md) | Método reutilizável para implementar e verificar uma mudança delimitada | Somente arquivos autorizados |
| [fluxo-review](../.agents/skills/fluxo-review/SKILL.md) | Método reutilizável de revisão e diagnóstico com evidências | Somente leitura |
| [fluxo-implementation](../.codex/agents/fluxo-implementation.toml) | Executa um recorte de implementação recebido do agente principal usando fluxo-delivery | Somente arquivos atribuídos |
| [fluxo-tenant-security](../.codex/agents/fluxo-tenant-security.toml) | Revisa isolamento, autorização e sessões usando fluxo-review | Somente leitura |
| [fluxo-ui-accessibility](../.codex/agents/fluxo-ui-accessibility.toml) | Revisa consistência, navegação, temas e acessibilidade usando fluxo-review | Somente leitura |
| [fluxo-docs](../.codex/agents/fluxo-docs.toml) | Revisa afirmações, rotas, fontes e instruções usando fluxo-review | Somente leitura |

O arquivo `.github/agents/*.agent.md` pertence à integração que reconhece esse
formato; não registra um agente Codex nem um job GitHub Actions. Os quatro
`.codex/agents/*.toml` definem especialistas locais do Codex, sem criar outro
agente geral. Cada TOML contém somente `name`, `description` e
`developer_instructions`. Modelo, esforço, ferramentas e permissões seguem a
sessão e sua configuração herdada. O formato e os limites de herança foram
conferidos na [documentação oficial de subagentes](https://learn.chatgpt.com/docs/agent-configuration/subagents)
em 15/10/2026.

Somente leitura é uma instrução de trabalho destes revisores, não um sandbox
independente criado pelo TOML. Nenhum arquivo altera configuração global,
permissões, provedores ou MCPs. Estes papéis não operam contas, credenciais,
infraestrutura ou produção. Não há runtime autônomo, agenda, chave de IA para
GitHub ou agente executado automaticamente pelo CI.

## Contrato de delegação

O agente principal mantém o objetivo e a integração. Escolha apenas os papéis
úteis para a tarefa atual; não abra os quatro por padrão. A delegação recebe:

- objetivo e critério de aceite observável;
- arquivos/diff e base de comparação, com escrita permitida ou somente leitura;
- contexto mínimo e fontes canônicas pertinentes;
- verificações permitidas, ambiente, dados controlados e restrições de navegador;
- saída esperada e ponto de encerramento.

Um arquivo tem um responsável de escrita por vez. Leituras independentes podem
ocorrer em paralelo; revisores devem identificar a versão/diff observado, e o
principal deve conferir se ela continua atual após novas edições. Dependências
fora da atribuição retornam ao principal. Subagentes não ampliam o escopo nem
delegam novamente. Não peça nova autorização para o que o usuário já autorizou;
uma capacidade disponível também não constitui autorização para usá-la.

Exemplos de pedidos delimitados:

> Use $fluxo-delivery para corrigir o comportamento de paleta nos arquivos
> explicitamente atribuídos nesta tarefa. Preserve o padrão da marca e devolva
> testes, limites e risco. Não publique nem altere contas.

> Delegue a fluxo-tenant-security a revisão somente leitura do diff de
> autenticação desta tarefa. Rastreie tenant e papel até o servidor, sem testes
> remotos. Aguarde o relatório com arquivo/linha, impacto e lacunas de evidência.

Se o cliente não disponibilizar delegação ou não reconhecer os agentes, o agente
principal pode aplicar a skill correspondente na sessão atual e informar essa
limitação. Não alterar configurações globais para contorná-la.

## Verificação proporcional

[package.json](../package.json) é a fonte dos comandos e
[ci.yml](../.github/workflows/ci.yml) define o que o CI realmente executa. Confira
ambos na revisão: esta tabela orienta a seleção e não cria checks obrigatórios
no GitHub. O checker de documentação e o workflow têm responsáveis próprios;
não invente comandos ausentes nem edite esses arquivos fora da atribuição.

| Verificação | Comando / evidência | Quando aplicar |
| --- | --- | --- |
| Unidade e contratos | `pnpm test` | Mudança de comportamento; observar cobertura real dos casos afetados |
| Tipos Nuxt/Vue | `pnpm typecheck` | Alterações de aplicação, contratos e componentes |
| Exposição em fonte | `pnpm security:source` | Mudanças de aplicação/configuração e preparação de entrega |
| Site público | `pnpm generate` | Build público autorizado; valida ambiente público e examina `dist` |
| E2E público | `pnpm test:e2e` | No CI, depois do build público; localmente somente em QA de navegador autorizado |
| Dashboard | `pnpm generate:dashboard` | Depois da geração pública; valida ambiente e examina `dist-dashboard` |
| QA de interface | Evidência em local/preview autorizado | Fluxos e estados afetados, teclado, mobile e temas; contas fictícias ou ambiente controlado |
| Instruções e documentação | Sintaxe, referências e coerência com fontes; checker do projeto quando existir | Mudanças apenas documentais não exigem build da aplicação |

Execute `generate` e `generate:dashboard` **sequencialmente**, pois usam o mesmo
checkout e artefatos intermediários Nuxt. Não sobreponha typecheck ou outro
processo Nuxt a esses builds. O E2E público pode ficar entre as duas gerações,
como no CI; confira [playwright.config.ts](../playwright.config.ts) e o destino
antes de executar. Não aponte testes para produção por conveniência.

O revisor somente leitura examina fonte e relatórios; não inicia builds, E2E ou
geradores. O implementador ou o principal executa as verificações autorizadas e
fornece a evidência. Sucesso de scanner indica somente que os padrões cobertos
não foram encontrados; mock não comprova autenticação ou isolamento real.
Registre comando, ambiente, resultado e limitações. Distinga não executado,
bloqueado, falha preexistente e regressão sustentada pelo diff.

## Entrega e governança GitHub

O implementador devolve arquivos, efeito, resultados de verificação, risco,
rollback e dependências fora de escopo. O revisor devolve achados por prioridade
com arquivo/linha, condição, impacto e evidência, mais lacunas de cobertura.
Sem achados sustentados, declare isso sem certificar áreas não inspecionadas.

O principal integra as mudanças e prepara os requisitos de PR de GOVERNANCE.
PR, CI e revisão humana precedem produção; relatórios de agentes não substituem
a revisão humana. Criar estes arquivos não configura branch protection,
required checks, CODEOWNERS, secrets ou integrações de IA no GitHub. Verifique
controles efetivos antes de afirmar que estão aplicados. Commit, push, publicação
de PR, merge e deploy não são ações implícitas dos especialistas.

Atualize STATUS somente com evidência e permissão de escrita para esse documento.
Para Docs públicos, confira `app/data/product-docs.ts` e seus consumidores quando
disponíveis; essa fonte está em consolidação. Mantenha os documentos operacionais
em `docs/` separados da publicação pública. A convergência para `/acessar` também
deve ser descrita segundo o código e o aceite reais, sem antecipar produção.

## Manutenção destas instruções

Preserve os três campos dos TOMLs e valide com `tomllib` após alterações.
Valide cada skill com o `quick_validate.py` distribuído com `skill-creator`.
Confira links locais e se descrições e papéis continuam delimitados. Não fixe
modelos, esforço, permissões ou caminhos pessoais de runtime no repositório.

O agente geral existente foi preservado. A revisão de 15/10/2026 substituiu sua
lista antiga de prioridades pelo ROADMAP, alinhou temas à preferência atual e
corrigiu a saída `.output/public` para `dist`/`dist-dashboard`, conforme
`nuxt.config.js` e `package.json`. Também separou implementação de revisão e
vinculou aceite e autoridade a GOVERNANCE. A lista original de ferramentas foi
mantida; os novos especialistas não duplicam essa configuração.
