# Fluxo Atento

> **Estado de produto:** fundação de MVP; não declare o sistema como
> full-stack funcional antes dos portões de aceite. Veja o
> [estado factual](docs/STATUS.md), o
> [plano de implementação](docs/IMPLEMENTATION_PLAN.md) e a
> [governança de mudanças](docs/GOVERNANCE.md).

> **Atualização de validação:** a descrição histórica abaixo está desatualizada.
> A branch `feat/experience-design-system` contém cliente Supabase, autenticação
> no cliente, API de monitoramento e migração RLS. A presença dessas camadas
> não comprova sua ativação. Consulte [docs/FULLSTACK.md](docs/FULLSTACK.md)
> para o contrato e [VALIDATION.md](VALIDATION.md) para os resultados locais.
> A demonstração pública está em `/exemplo`; `/dashboard` é a área autenticada.

## Verificação da jornada pública

```bash
pnpm install --frozen-lockfile
pnpm test
pnpm exec nuxt typecheck
pnpm generate
pnpm exec playwright install --with-deps chromium
pnpm test:e2e
```

Os E2E servem o artefato `dist` em loopback com Python 3, sem iniciar o
servidor de desenvolvimento. Para testar uma prévia já disponível, informe
`E2E_BASE_URL`. Essa variável é uma URL, não uma credencial.

## Descrição histórica da primeira entrega

Landing page estática e fundação frontend do Fluxo Atento: uma proposta de inteligência e monitoramento de sites baseada em sinais legitimamente observáveis pelo navegador.

## Estado atual

O FLUXO possui site institucional, dashboard, cliente de autenticação, schema
Supabase com RLS e código de monitoramento preparados. Em 10/10/2026, a
migração de monitoramento foi aplicada ao Supabase, mas o fluxo completo ainda
não foi aceito em produção: a API `/v1` não está implantada na VPS, o
subdomínio do dashboard ainda precisa de deploy/HTTPS comprovados e a jornada
com duas contas ainda não foi executada. Consulte `docs/STATUS.md` antes de
usar qualquer descrição histórica abaixo como estado operacional.

## Estrutura incluída neste primeiro envio

```text
app/
  app.vue
  assets/css/main.css
  components/
    SignalDashboard.vue
    UrlAnalyzer.vue
  composables/
    useUrlAnalyzer.js
  pages/
    index.vue
    demo.vue
    login.vue
    privacy.vue
    terms.vue
public/
  icon.svg
package.json
pnpm-lock.yaml
nuxt.config.js
pnpm-workspace.yaml
```

Os documentos de produto já presentes na raiz também fazem parte do material existente do projeto.

## Tecnologias e dependências presentes

- Node.js 22+ e pnpm via Corepack para desenvolvimento local.
- Nuxt 4 e Vue 3.
- JavaScript, Vue Single File Components, HTML semântico e CSS próprio.
- A dependência de aplicação declarada no `package.json` é Nuxt; versões resolvidas ficam registradas em `pnpm-lock.yaml`.

Esta seção descreve a primeira entrega histórica. O estado canônico atual está
em `docs/STATUS.md`; há cliente Supabase, testes e código de monitoramento no
repositório, mas presença de código não substitui validação em produção.

### Variáveis de ambiente existentes

O `.env.example` existente contém somente nomes de variáveis públicas de configuração:

- `NUXT_PUBLIC_SITE_URL`: origem pública do site, destinada à configuração do frontend.
- `NUXT_PUBLIC_SUPABASE_URL`: URL pública do projeto Supabase.
- `NUXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: chave publicável para uso futuro no cliente Supabase.

Essas variáveis ainda não são lidas pelo código da aplicação, e nenhum cliente Supabase está instalado. O prefixo `NUXT_PUBLIC_` significa que valores reais são expostos ao navegador; não coloque segredos nessas variáveis. Nenhuma variável de Edge Function existe ou é usada neste projeto, portanto não há secrets a configurar no Supabase nesta etapa. Segredos futuros de Edge Functions devem ser configurados no ambiente seguro do Supabase, nunca em arquivos versionados ou variáveis públicas do Nuxt. Não há outras variáveis de ambiente usadas atualmente.

## Executar localmente

```bash
corepack pnpm install
corepack pnpm dev
```

Acesse http://localhost:3000.

Para validar uma build estática:

```bash
corepack pnpm generate
```

Os arquivos gerados ficam em `.output/public`. A saída é artefato de build e não deve ser versionada.

## Objetivo e etapas futuras

O objetivo atual é ativar de forma verificável o MVP de monitoramento do
FLUXO. A sequência obrigatória, os critérios de aceite, a governança e a
evolução dos módulos futuros estão em `docs/IMPLEMENTATION_PLAN.md` e
`docs/GOVERNANCE.md`.

Arquivos de configuração locais de hospedagem/automação e arquivos de agente ou de regras de branch não fazem parte deste primeiro envio, pois a etapa atual não autoriza configurar ou ativar esses serviços. Nenhum deploy ou alteração de configuração no GitHub faz parte deste PR.

## Segurança

- `.env`, variantes locais, tokens, chaves privadas e credenciais não devem ser versionados.
- Não há credenciais necessárias para executar a landing local.
- A demonstração não deve ser confundida com observação real de um site.
- O produto não deve contornar autenticação, CAPTCHA ou controles de acesso.
