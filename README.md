# Fluxo Atento

Site, demonstração e dashboard de um SaaS voltado a sites, tráfego e funil.
Base: Nuxt 4, Vue 3, Nuxt UI, Supabase Auth/Postgres e API Node na VPS.

**Estado factual:** [STATUS](docs/STATUS.md). Login e monitoramento básico foram
observados em produção; integrações, chat e billing ainda têm pendências. A nova
interface desta revisão depende de CI, revisão humana e publicação controlada.

## Documentação canônica

- [Roadmap e prioridades](docs/ROADMAP.md)
- [Mapa de sistemas](docs/ASSETS.md)
- [Arquitetura e integrações](docs/SAAS_BLUEPRINT.md)
- [Login e onboarding](docs/AUTH_ONBOARDING.md)
- [Google: login, Analytics, Search Console e BigQuery](docs/GOOGLE_SETUP.md)
- [Contrato Google do backend e limites de validação](docs/GOOGLE_BACKEND_CONTRACT.md)
- [Credenciais e permissões](docs/SECURITY_CREDENTIALS.md)
- [Requisitos consolidados](docs/REQUIREMENTS.md)
- [Checklist de lançamento](docs/LAUNCH_CHECKLIST.md)
- [Evidências e limites da revisão de 15/10/2026](docs/VALIDATION_2026-10-15.md)
- [Governança](docs/GOVERNANCE.md)
- [Processo de documentação e portal público](docs/DOCS_PROCESS.md)
- [Skills e agentes de implementação/revisão](docs/AGENT_OPERATIONS.md)
- [Contrato técnico do monitoramento](docs/FULLSTACK.md)

## Desenvolvimento

Node 22.12+ e pnpm na versão do packageManager. A demonstração funciona sem
autenticação configurada. Nunca inserir secrets em .env.example.

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm security:source
pnpm docs:check
pnpm test
pnpm typecheck
pnpm generate
pnpm test:e2e
pnpm generate:dashboard
```

CI instala o navegador antes dos E2E. Builds saem em dist e dist-dashboard;
executar sequencialmente, pois compartilham intermediários Nuxt. Não versionar
artefatos. Para UI sem serviços reais, veja [a prévia isolada](tests/preview/README.md).

## Acesso e segurança

Site: https://fluxoatento.com.br. App: https://app.fluxoatento.com.br.
No site, /exemplo é ilustrativo. No app, /admin é global e / é o espaço privado
da empresa. Cadastro público não concede superadmin.

Site, /agente e /docs usam a entrada comum /acessar, com contexto, contagem
visível de cinco segundos, pausa e opção de continuar imediatamente. Uma sessão
válida no app não exige outro login. /agente ainda não é um chat operacional.

O provedor Google de dados está implementado para revisão, desligado por padrão.
Descobre fontes GA4/Search Console; não entrega relatórios, Google Ads ou BigQuery
nesta etapa. Migração e autorização Google reais ainda precisam de aceite.

NUXT_PUBLIC_* aceita somente configurações públicas aprovadas. Chaves privadas
ficam no serviço consumidor, nunca frontend/Git. Login Google/GitHub depende da
configuração dos provedores; Facebook pertence às integrações, não ao login.

Branch → PR com riscos/testes → CI → revisão humana → deploy → aceite real.
n8n e revisão da marca/logo são etapas posteriores, não dependências do MVP.
