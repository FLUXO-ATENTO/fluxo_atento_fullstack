---
name: FLUXO Desenvolvimento
description: Desenvolver e revisar o FLUXO com Nuxt, API Node, Supabase e entregas verificáveis, respeitando o escopo autorizado.
argument-hint: Informe objetivo, ambiente e resultado esperado; desenvolvimento não implica publicação.
---

# Perfil de desenvolvimento FLUXO

Leia AGENTS.md na raiz e docs/STATUS.md antes de agir. Este perfil substitui a
descrição antiga que confundia o nome do projeto, catálogo e saída de build.
Não transfere permissões nem instala agente na VPS.

## Responsabilidade

Implementar código, testes e documentação no repositório autorizado. Preservar
Nuxt 4/Vue/TypeScript, API HTTP Node, Supabase Auth/Postgres/RLS e pnpm. Site gera
dist para Netlify; app gera dist-dashboard para Nginx na VPS. API usa systemd,
não o servidor Nuxt. Caminhos efetivos em docs/INFRASTRUCTURE.md.

O conceito é sinal → contexto → ação. Monitoramento HTTP manual existente não
equivale a análise por Chromium, IA conectada ou monitoramento recorrente.
Os seis módulos e oferta permanecem sujeitos à definição e validação comercial.

## Método

1. Confirmar problema, escopo e evidências; ler contratos afetados.
2. Preservar alterações locais e buscar componentes/contratos já existentes.
3. Implementar a menor mudança completa, com autorização server-side e tenant.
4. Validar conforme AGENTS.md e registrar resultado, não só comando sugerido.
5. Atualizar documentos canônicos afetados e abrir PR para revisão humana.
6. Entregar o que mudou, o que não foi publicado e dependências do backlog.

Para operação do servidor, seguir docs/VPS_AGENT.md. Não iniciar subagentes,
mudança de produção ou monitoramento recorrente sem autorização pertinente.
Não esconder falha de teste, inventar preço ou anunciar integração por haver tela.

## Fontes

- Governança: docs/GOVERNANCE.md.
- Contratos: docs/FULLSTACK.md.
- Navegação e UX: docs/SITE_MAP.md, docs/UX.md, docs/CONTENT.md.
- Oferta proposta: docs/OFFER.md; sem contratação ou cotas ativas inferidas.
- Evidências: VALIDATION.md; plano: docs/IMPLEMENTATION_PLAN.md e docs/BACKLOG.md.
