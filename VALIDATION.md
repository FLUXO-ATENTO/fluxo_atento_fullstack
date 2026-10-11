# Validação do FLUXO

## Super Admin separado e contatos em 10 de outubro de 2026

Branch: fix/superadmin-session-crm. A atualização de código fica em PR para
revisão humana, sem merge automático. Por solicitação final do responsável,
esta revisão não foi publicada na VPS. As migrações remotas abaixo já haviam
sido aplicadas antes dessa restrição de escopo.

| Verificação | Resultado |
| --- | --- |
| pnpm test | 22 testes aprovados |
| pnpm exec nuxt typecheck | Aprovado |
| pnpm generate | Aprovado, site institucional |
| pnpm generate:dashboard | Aprovado, app separado e CSP por release |
| pnpm test:e2e | 8 testes públicos aprovados, desktop e mobile |
| Playwright dashboard | 6 testes aprovados, desktop e mobile |
| Revisão documental | 19 documentos Markdown conferidos; 0 links relativos quebrados |
| Higiene Git | git diff --check aprovado; padrões de segredo privado pesquisados sem ocorrência (não substitui secret scanner completo) |
| tests/database/tenant-isolation.sql | Aprovado no projeto autorizado, fixtures revertidas integralmente |
| Supabase security advisor | Aviso: proteção contra senhas vazadas desativada; nenhuma falha de RLS apontada |
| Supabase performance advisor | Índice de FK corrigido; índices recém-criados sem uso preservados |

O E2E do dashboard usa sessões e respostas controladas para provar destino por
papel, bloqueio de usuário comum, retorno site/app, logout e execução com CSP.
Não valida a senha pessoal nem representa um teste autenticado da nova versão
em produção. O primeiro teste mobile revelou um erro na fixture em about:blank;
foi corrigido para navegar por uma origem de site real, sem ignorar erros.

Os testes SQL verificam isolamento com RLS, constraints de tenant/conexão,
deduplicação, conflitos de identidade, mensagens idempotentes, bloqueio de
autoelevação, proteção do último owner e auditoria. Nenhum convite ou mensagem
foi enviado pelos testes de banco.

Migrações confirmadas remotamente nesta revisão:

- 20261011013631_superadmin_contacts_history
- 20261011014130_channel_sync_fk_index

Conta administrativa existente confirmada no banco; senha não lida nem alterada.
Não foram configurados provedores reais, MFA, backup/restore, Google OAuth ou
sincronização histórica. Esses limites estão em docs/STATUS.md.

O CI inclui validação de sintaxe dos scripts Bash. Os scripts operacionais
não foram executados na VPS nesta revisão. Deploy agora exige SHA completo
aprovado, aceita checkout/worktree limpo, confirma projeto Supabase e divide
lock com o rollback. A validação operacional final continua no backlog.

## Registro histórico da entrega anterior

Tudo abaixo desta seção descreve aquela execução anterior, não o estado atual.
Pendências posteriormente tratadas foram reconciliadas em docs/STATUS.md e
docs/DOCUMENTATION.md; números de testes antigos são preservados como histórico.

Base: `bc322a82c521d0104e8e259c6db4a40fa0204137`, branch
`feat/experience-design-system`, clone separado em `/tmp/fluxo-atento`.
Escopo do envio: testes e documentação na mesma branch, sem substituir Nuxt.
Não houve merge, migração remota ou publicação manual em produção.

> Este é um registro histórico da validação daquela entrega. Em 10/10/2026, a
> migração `monitor_workspace` foi aplicada ao Supabase; o estado operacional
> corrente e a evidência correspondente ficam em `docs/STATUS.md`.

## Resultados executados

| Comando | Resultado |
| --- | --- |
| `pnpm install --frozen-lockfile` | Passou, pnpm 11.25.0, Node 22.22.0 |
| `pnpm test` | Passou: 15 testes |
| `pnpm exec nuxt typecheck` | Passou |
| `pnpm generate` | Passou: saída `dist`, 60 rotas pré-renderizadas |
| `pnpm exec playwright install --with-deps chromium` | Falhou: elevação via `su` não autorizada |
| `pnpm exec playwright install chromium` | Passou; navegador executou com bibliotecas já presentes |
| `pnpm test:e2e` (execução final) | Passou: 8 testes, desktop e mobile, 8,7 s (reexecução) |

Os E2E verificam navegação pública, ausência de chamadas à API de monitores
na jornada geral da demonstração, continuidade de `tracking`, `errors` e
`changes`, evidências e revisão local. A configuração explícita e o diretório
`tests/e2e` resolvem a ausência de casos descobertos pelo Playwright.

As primeiras execuções falharam por ausência do navegador e por pressupostos
incorretos dos testes sobre as etapas mobile e o status visual oculto. Os
testes finais avançam manualmente à etapa de decisão, esperam a seleção e
o destino corretos, e verificam a revisão reabrindo o item.

## Limites e pendências

- Os unitários usam substitutos controlados; não comprovam RLS instalado,
  isolamento em Postgres real, autenticação ou gravação no Supabase remoto.
- Não foram fornecidas nem solicitadas credenciais, `.env` ou segredos.
- Não houve ativação da API na VPS, agendamento ou integração de mensagens.
- A conformidade integral com UX/CONTENT e a acessibilidade completa não
  foram auditadas; há divergências de copy e de comportamento ainda pendentes.
- A divergência de email marketing entre OFFER e CONTENT continua pendente.
- `gh auth status` falhou por token inválido; o envio usa o conector GitHub.
  Os resultados acima são locais, não evidência de um novo CI no PR #2.
- O histórico informado pelo usuário registrava build falhando,
  headers/redirects passando e Supabase Preview ignorado; os checks remotos
  não foram atualizados nem reconsultados nesta execução.

Esta alteração entrega infraestrutura de E2E e evidências locais, não a
conclusão do produto full-stack nem uma certificação de segurança.
