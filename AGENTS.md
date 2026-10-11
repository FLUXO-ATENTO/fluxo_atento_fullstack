# FLUXO — instruções do repositório

## Escopo e fontes

O produto se chama **FLUXO**. Site institucional na Netlify; app estático e API
Node na VPS; identidade e banco no Supabase `qbfmebpzxnzdpalmgtxr`.
Não modificar o projeto Fluxo de Clientes nem o serviço legado `/opt/fluxo-atento`.

Antes de alterar, ler `docs/STATUS.md` e os contratos pertinentes:

- Código/segurança: `docs/FULLSTACK.md` e `docs/GOVERNANCE.md`.
- Rotas/estrutura: `docs/SITE_MAP.md` e `docs/INFRASTRUCTURE.md`.
- VPS: `docs/VPS_AGENT.md` e `ops/dashboard-vps/README.md`.
- Próximas etapas: `docs/IMPLEMENTATION_PLAN.md` e `docs/BACKLOG.md`.
- UI/conteúdo/oferta: `docs/UX.md`, `docs/CONTENT.md`, `docs/OFFER.md`.

## Regras obrigatórias

1. Respeitar o escopo da solicitação atual. “Só Git/documentação” não autoriza
   deploy, migração, DNS, restart ou mudança de conta. Diagnóstico é leitura.
2. Inspecionar branch, diff e alvo antes de editar. Preservar alterações alheias,
   ambientes privados e releases; não usar reset destrutivo para limpar checkout.
3. Manter PR aberto para revisão humana; não fazer merge ou deploy por inferência.
4. Nunca copiar segredos, `.env` real, senhas, tokens ou mensagens de clientes
   para Git, logs, screenshots de entrega ou comentários. Não pedir senha no chat.
5. Autenticar no servidor e autorizar cada operação. Super Admin vem da tabela
   protegida, nunca de e-mail, `user_metadata`, URL ou papel informado pelo cliente.
6. Toda informação operacional deve estar vinculada ao tenant autorizado. Não
   desativar RLS; referências compostas impedem vínculos entre tenants distintos.
7. Respeitar a mesma entrada de login e sessão. Nenhum token em URL ou no site
   público; logout/revogação não podem ser contornados pela persistência da sessão.
8. Não marcar provedor validado sem teste real. Schema/tela/HTTP 200 não provam
   envio, recebimento, sincronização histórica ou isolamento em produção.
9. Alteração operacional requer alvo exato, autorização, pré-validação e rollback.
   Falta de acesso é pendência explícita, nunca motivo para inventar resultado.
10. Atualizar somente os documentos afetados; consultar o índice de governança.
    Separar código preparado, testes locais, banco aplicado e release publicada.

## Validação proporcional

- JS/TS/Vue/API: `pnpm test` e `pnpm exec nuxt typecheck`.
- Site: `pnpm generate` e `pnpm test:e2e`.
- App/auth: `pnpm generate:dashboard` e
  `pnpm exec playwright test --config playwright.dashboard.config.ts`.
- Banco: revisão de grants/RLS/índices e teste sintético com rollback; aplicação
  remota somente com autorização e confirmação do projeto.
- Infraestrutura: sintaxe, escopo, rollback e health checks apenas quando a
  intervenção estiver autorizada. Não confundir análise de script com deploy.
- Documentação: links internos, rotas, caminhos, números de versão e contradições;
  `git diff --check`. Não exigir teste de produção para editar um texto.

Usar pnpm/lockfile existente. Não adicionar dependência sem necessidade concreta.
Não há script de lint configurado; não alegar execução inexistente.

## Code Review Rules

Sinalizar: segredo no cliente/log, RLS enfraquecida, acesso cruzado entre tenants,
autoelevação, resposta assíncrona que mistura sessões, escrita sem autorização,
ACK de webhook antes de persistência durável, deploy sem rollback, dados de demo
apresentados como reais e documentação que declara release não publicada.

## Encerramento

Informar PR/commit, alterações, testes e limites, estado de produção e próximas
ações. Os perfis em `.github/agents/` são instruções, não processos instalados,
credenciais permanentes nem autorização para operar sem pedido humano.

Referência de formato: [instruções AGENTS.md](https://developers.openai.com/codex/guides/agents-md).
