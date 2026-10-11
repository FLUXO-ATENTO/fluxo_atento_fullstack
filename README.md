# FLUXO

FLUXO combina site institucional, dashboard multi-tenant e administração global. O login é único; as permissões determinam o painel. A existência de telas ou tabelas não significa que todos os conectores estão ativos.

## Fontes canônicas

- [Status e migrações aplicadas](docs/STATUS.md)
- [Arquitetura e contratos](docs/FULLSTACK.md)
- [Sequência de implementação](docs/IMPLEMENTATION_PLAN.md)
- [Governança](docs/GOVERNANCE.md)
- [Regras dos agentes](AGENTS.md) e [especialista VPS](docs/VPS_AGENT.md)
- [Site map e rotas](docs/SITE_MAP.md)
- [Inventário VPS e estrutura](docs/INFRASTRUCTURE.md)
- [Tarefas futuras e critérios de aceite](docs/BACKLOG.md)
- [Controle e revisão documental](docs/DOCUMENTATION.md)
- [Testes e limites da entrega](VALIDATION.md)
- [Deploy e rollback na VPS](ops/dashboard-vps/README.md)

## Stack e destinos

| Componente | Tecnologia | Destino |
| --- | --- | --- |
| Site institucional | Nuxt 4, Vue 3, TypeScript e CSS | Netlify, fluxoatento.com.br |
| Dashboard e Super Admin | Build estático Nuxt, layouts separados | Nginx na VPS, app.fluxoatento.com.br |
| API | Node.js HTTP nativo, systemd, journald | VPS, /v1 em api.fluxoatento.com.br |
| Identidade e banco | Supabase Auth, Postgres e RLS | Projeto qbfmebpzxnzdpalmgtxr |

Não modificar o projeto Supabase Fluxo de Clientes. Não instalar este dashboard no serviço legado de agentes. As versões resolvidas estão no lockfile.

## Desenvolvimento e testes

```bash
pnpm install --frozen-lockfile
pnpm test
pnpm exec nuxt typecheck
pnpm generate
pnpm test:e2e
pnpm generate:dashboard
pnpm exec playwright test --config playwright.dashboard.config.ts
```

Os E2E servem os arquivos estáticos com Node em loopback. Os testes do dashboard precisam da URL e de uma chave publicável de formato válido no build, mas interceptam Auth/API com fixtures; não utilizam senhas de produção. O CI fornece essa configuração. Os testes reais de banco estão em tests/database/tenant-isolation.sql e desfazem todas as fixtures.

## Configuração e segredos

Somente URL, chave publicável e origens podem usar NUXT_PUBLIC_. Credenciais administrativas, senhas SMTP e tokens WABA ficam exclusivamente no ambiente privado da VPS, fora do Git e dos logs. O build rejeita segredos reconhecidos em variáveis públicas.

O site continua encaminhando para o mesmo /login do app. Uma sessão válida volta ao painel correspondente sem novo login. Sair, revogação e expiração continuam sendo respeitados.
