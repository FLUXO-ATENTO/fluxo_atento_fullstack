# Validação local — entrega parcial

Base: `bc322a82c521d0104e8e259c6db4a40fa0204137`, branch
`feat/experience-design-system`, clone separado em `/tmp/fluxo-atento`.
Escopo do envio: testes e documentação na mesma branch, sem substituir Nuxt.
Não houve merge, migração remota ou publicação manual em produção.

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
