# Validação de banco e isolamento

Etapa de 15/10/2026 para o PR #6. **17/17 testes aprovados**, sem falhas nem
casos pulados, no PostgreSQL **17.11**, para o commit
`368de636a95912409abdf086054fcc02480d8634`.
Evidência: [Database isolation, execução 38800297609](https://github.com/FLUXO-ATENTO/fluxo_atento_fullstack/actions/runs/38800297609).
Não é aplicação de migração no Supabase de produção. Mudanças posteriores
continuam exigindo o check do seu próprio commit.

No mesmo commit, o [CI completo](https://github.com/FLUXO-ATENTO/fluxo_atento_fullstack/actions/runs/38800297483)
concluiu com sucesso: scanner de fonte, 104 testes unitários/contrato, tipos,
build público, E2E público e build do dashboard. A [qualidade documental](https://github.com/FLUXO-ATENTO/fluxo_atento_fullstack/actions/runs/38800297544)
também passou. Esses checks não executam OAuth real nem liberam produção.

## Ambiente e proteção

O [workflow](../.github/workflows/database-tests.yml) inicia um PostgreSQL 17
descartável no runner do GitHub. Não usa secrets, projeto Supabase, VPS, contas
Google ou dados de clientes. `pg` está fixado no lockfile como dependência de
desenvolvimento. O usuário/senha do serviço CI são dados públicos de teste,
válidos apenas durante aquele job, não credenciais do produto.

O [harness](../tests/database/harness.mjs) exige simultaneamente:

- `FLUXO_TEST_DATABASE_ALLOW_CREATE=1`;
- `FLUXO_TEST_DATABASE_URL` com protocolo Postgres, usuário `postgres`, IP literal
  de loopback e banco de controle vazio chamado `fluxo_test`, sem parâmetros na URL;
- roles anon/authenticated sem bypass de RLS ou superuser; service_role sem
  superuser e com bypass, reproduzindo o limite privado do serviço.

Cada caso cria seu próprio banco com nome aleatório, aplica **todas** as migrações
do repositório em ordem e insere somente usuários/empresas fictícios. Ao terminar,
fecha suas conexões e apaga apenas o banco criado naquele caso. Não usa limpeza
por prefixo, `DROP ... FORCE`, acesso remoto ou reset de projeto.

Localmente, o mesmo comando `pnpm test:database` exige um PostgreSQL descartável
já preparado com esse banco de controle. Senha, se necessária, vem de `PGPASSWORD`
no ambiente do teste, não de URL versionada. Sem as duas variáveis de proteção a
suíte falha, em vez de pular silenciosamente ou procurar credenciais da aplicação.
Não reutilizar um cluster que contenha dados reais, mesmo acessível por loopback.

## O que é testado

- Migrações desde banco vazio sob defaults explícitos e sob grants legados.
- Negação real de leitura/escrita e chamadas Google para anon/authenticated.
- RLS e FORCE RLS nas tabelas privadas; RPCs invoker com search_path vazio.
- Permissões exatas do serviço: configuração sem DELETE/INSERT e auditoria sem
  UPDATE/DELETE. A migração Google pendente limpa também grants legados do serviço.
- Leitura de monitores, resultados e canais isolada por empresa; usuário comum
  não altera associações nem se promove a administrador global.
- Metadados editáveis não concedem papel ou associação; Superadmin não é membro
  implícito de todos os tenants na leitura direta pelo navegador.
- Estado OAuth, navegador, ator, tenant, escopos, replay, perda de papel,
  desativação/reativação e proteção da tentativa consumida.
- Concorrência e compare-and-swap com conexões PostgreSQL independentes, incluindo
  callback versus desconexão, atualização de papel e criação idempotente do tenant.

As asserções agrupam várias operações por caso. A quantidade de casos não é a
quantidade de consultas nem uma medida de cobertura completa.

## Limites e próximo aceite

PostgreSQL é real; `auth.users`, `auth.uid()` e roles são uma **fixture mínima**.
Não há GoTrue/Supabase Auth, PostgREST, JWT assinado, e-mail, Storage ou browser
neste job. Ele prova SQL, grants, RLS e locks nas condições controladas, não
configuração remota, callback HTTPS, cookies, CORS ou integração Google real.

O conector Supabase recusou a consulta de branches por falta de permissão nesta
etapa. Não foram criados branches pagos nem alteradas permissões para contornar
isso. O preview Supabase pulado no PR anterior não é evidência de teste de banco.

Antes de produção ainda é necessário conferir o histórico/schema remoto, validar
o fluxo no Supabase de teste com duas identidades reais, executar advisors,
revisar backup/restore e completar o aceite Google descrito em
[GOOGLE_SETUP](GOOGLE_SETUP.md). Um check verde não aprova merge/deploy sozinho.

Rollback desta etapa: remover o novo job/testes por revisão se necessário.
A migração Google continua pendente em produção; não reaplicar migrações antigas
nem reverter dados reais como efeito de um rollback do código.

## Referências

- [Supabase: testes de banco e RLS](https://supabase.com/docs/guides/local-development/testing/overview)
- [Supabase: grants explícitos na Data API](https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically)
- [GitHub: PostgreSQL como serviço do job](https://docs.github.com/en/actions/tutorials/use-containerized-services/create-postgresql-service-containers)
- [node-postgres: transações na mesma conexão](https://node-postgres.com/features/transactions)
