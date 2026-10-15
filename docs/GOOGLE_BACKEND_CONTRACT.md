# Google de dados — contrato do backend para revisão

Implementação local em 15/10/2026, **desligada por padrão e não publicada**.
Não configura login Supabase, projeto Google, APIs habilitadas, faturamento ou
credenciais reais. Não inclui Ads, Gmail, Drive, Gemini, Vertex ou Agent Engine.
Não altera o catálogo de canais WABA/SMTP.

## Configuração privada e responsabilidades

Somente o processo da API na VPS recebe:

| Variável | Valor esperado, sem segredo neste documento |
| --- | --- |
| `GOOGLE_INTEGRATION_CLIENT_ID` | ID de cliente OAuth Web exclusivo para dados |
| `GOOGLE_INTEGRATION_CLIENT_SECRET` | Secret desse cliente, no ambiente privado |
| `GOOGLE_TOKEN_ENCRYPTION_KEY` | Base64 canônico de exatamente 32 bytes aleatórios criptográficos |
| `GOOGLE_OAUTH_REDIRECT_URL` | `https://api.fluxoatento.com.br/v1/integrations/google/callback` |

Nenhum desses valores entra em `NUXT_PUBLIC_*`, no formulário do superadmin ou
em requisições do navegador. A chave AES fica fora do banco. Uma chave diferente
torna os envelopes anteriores ilegíveis: esta versão não implementa rotação
transparente ou chaveiro multiversão; planejar migração de chave ou reconexão.

Login Google via Supabase é outra configuração. O cliente de dados solicita
**somente**:

- `https://www.googleapis.com/auth/analytics.readonly`
- `https://www.googleapis.com/auth/webmasters.readonly`

Não solicita `openid`, identidade, escrita ou escopos adicionais. A resposta de
consentimento deve conter exatamente os dois escopos; consentimento parcial ou
escopo excedente falha sem persistir o token. O refresh pode omitir `scope`, como
previsto em OAuth; nesse caso preserva os escopos anteriormente validados.

Listagem GA4 usa Analytics Admin API (`accountSummaries`); listagem SC usa
Search Console API (`sites`). Esta entrega não consulta métricas e não chama a
Analytics Data API. APIs, consent screen, usuários de teste, verificação Google
e callback autorizado ainda exigem configuração/aceite externo.

## Contrato HTTP para a UI

Todos os endpoints, exceto o callback, exigem Bearer Supabase verificado.
O header opcional `X-Fluxo-Tenant-Id` seleciona **apenas** um tenant do qual o
usuário é membro. Não existe tenant/user/client secret enviado no corpo.
`user_metadata`, menus e preferências nunca concedem permissão.

| Método e rota | Autorização | Entrada / resultado |
| --- | --- | --- |
| `GET /v1/admin/google` | Superadmin confirmado no servidor | Estado local da configuração |
| `PATCH /v1/admin/google` | Superadmin | Exatamente `{ "enabled": boolean }`; retorna estado local atualizado |
| `GET /v1/integrations/google` | Membro do tenant | Disponibilidade e metadados da conexão |
| `POST /v1/integrations/google/authorize` | Owner/admin | Exatamente `{}`; `{ authorization_url }` e cookie HttpOnly |
| `GET /v1/integrations/google/callback` | Estado + cookie, sem Bearer | HTTP 303 para destino fixo |
| `GET /v1/integrations/google/resources` | Owner/admin | GA4/SC, erros explícitos por fonte, limite atingido |
| `POST /v1/integrations/google/disconnect` | Owner/admin | Exatamente `{}`; remoção local e resultado de revogação |

O frontend deve usar `credentials: 'include'` nas chamadas Google cross-origin,
em especial `authorize`, e navegar para `authorization_url` no **mesmo navegador**.
CORS permite credenciais somente para uma origem exata de `ALLOWED_ORIGINS`;
não aceita `*`, sufixos aproximados ou origem `null`. As rotas existentes de
monitoramento mantêm seu comportamento de CORS sem credenciais.

### Configuração global

```json
{
  "enabled": false,
  "ready": false,
  "checks": [
    { "id": "client_id", "label": "Client ID Google de dados no servidor", "configured": false },
    { "id": "client_secret", "label": "Client Secret Google de dados no servidor", "configured": false },
    { "id": "encryption_key", "label": "Chave privada AES-256 de 32 bytes", "configured": false },
    { "id": "callback_url", "label": "Callback HTTPS exato da API", "configured": false },
    { "id": "schema", "label": "Persistência privada Google disponível", "configured": false }
  ],
  "callback_url": "https://api.fluxoatento.com.br/v1/integrations/google/callback",
  "scopes": [
    "https://www.googleapis.com/auth/analytics.readonly",
    "https://www.googleapis.com/auth/webmasters.readonly"
  ],
  "external_apis_verified": false,
  "updated_at": null,
  "updated_by": null
}
```

`ready` significa configuração privada válida + schema/grants disponíveis ao
serviço. **Não** certifica APIs Google, segredo aceito pelo provedor, política
de consentimento ou conectividade externa. `external_apis_verified` permanece
`false`; a UI não deve tratá-lo como falha comprovada, e sim como não verificado
por esse endpoint. O botão global não cria conexões de clientes.

Ativar sem configuração retorna `409 GOOGLE_CONFIG_REQUIRED`; schema ausente
retorna `503 GOOGLE_SCHEMA_UNAVAILABLE`. Desativar preserva conexões, bloqueia
novas autorizações/leituras de recursos e cancela tentativas pendentes. Tentativas
ainda não consumidas são removidas; as consumidas recebem `invalidated_at` e
permanecem protegendo a troca em andamento até sua finalização. Reativar não
torna esses callbacks válidos novamente. Não há revogação externa como efeito
de desativar, reativar ou rejeitar um callback. Mudanças do sinalizador registram
ator e horário no banco, na mesma transação.

### Status por tenant

```json
{ "available": false, "connection": null }
```

Quando existe conexão, `connection` contém somente `status` (`connected` ou
`needs_reconnect`), `connected_at`, `last_checked_at` e `scopes`.
`connected` indica credenciais OAuth validadas e armazenadas, não saúde contínua
das APIs. Tokens danificados ou perda do papel do autorizador aparecem como
`needs_reconnect`. Revogação externa é detectada no refresh/consulta; não há
sondagem automática neste endpoint. `available` é independente do estado de uma
conexão anterior e fica falso quando a integração global está indisponível.

### Recursos e falhas parciais

```json
{
  "analytics": [{ "id": "properties/123", "name": "Propriedade de exemplo", "account_name": "Conta de exemplo" }],
  "search_console": [{ "id": "sc-domain:example.test", "name": "sc-domain:example.test", "permission": "siteOwner" }],
  "checked_at": "2026-10-15T12:00:00.000Z",
  "errors": {},
  "truncated": false
}
```

O exemplo é ilustrativo; a API não gera métricas nem recursos fictícios.
`errors` pode ter `analytics` e/ou `search_console`, com códigos sanitizados como
`GOOGLE_FORBIDDEN`, `GOOGLE_TIMEOUT`, `GOOGLE_INVALID_RESPONSE`,
`GOOGLE_RATE_LIMIT`, `GOOGLE_RECONNECT_REQUIRED` ou `GOOGLE_UNAVAILABLE`.
Uma fonte que falha retorna array vazio **junto com seu erro**, nunca zero
interpretado como sucesso. Mesmo falha das duas fontes retorna este relatório
HTTP 200; a UI deve ler `errors`, não apenas `response.ok`. Falhas anteriores à
descoberta (autorização/refresh/persistência) usam o erro HTTP normal.

Antes de entregar qualquer relatório, inclusive respostas parciais com `401`
de uma das fontes, a RPC revalida transacionalmente a conexão/revisão, o
sinalizador global, o papel do solicitante e o papel de quem autorizou os tokens.
Perda do papel do autorizador durante a consulta retorna HTTP **409**:

```json
{
  "error": {
    "code": "GOOGLE_CONNECTION_CHANGED",
    "message": "A conexão foi alterada. Atualize a página e tente novamente."
  }
}
```

Nenhum recurso da outra fonte acompanha esse erro. Se o solicitante perdeu o
papel exigido, a autorização retorna 403. A operação interna de apenas marcar
`needs_reconnect` continua permitida para um solicitante autorizado, mesmo após
a perda do papel do autorizador. A RPC `google_connection_update` distingue os
dois usos pelo parâmetro `p_returning_resources boolean default false`: a
resposta de `/resources` sempre envia `true`, independentemente do status salvo.
O ponto de autorização é a transação final, que bloqueia as associações lidas
até o commit; não há transação de banco aberta durante as chamadas Google.

Até 5 páginas GA4, 100 resumos de conta por página e 500 propriedades retornadas;
SC até 500 sites. `truncated: true` informa limite/paginação incompleta, não
ausência de mais recursos. Não são expostos tokens de paginação Google.
`checked_at` é o instante da tentativa atual. `last_checked_at` da conexão só é
atualizado quando ambas as fontes responderam sem erro, mesmo que truncadas.
Na falha de uma página GA4, a fonte inteira é marcada com erro; não apresenta
as páginas anteriores como conjunto completo.

### Desconexão

`POST /v1/integrations/google/disconnect` recebe `{}`. Se houver uma tentativa
consumida no tenant cujo callback ainda não finalizou, retorna HTTP **409**:

```json
{
  "error": {
    "code": "GOOGLE_OAUTH_IN_PROGRESS",
    "message": "Uma autorização Google está em andamento ou aguarda confirmação de término. Aguarde e tente novamente."
  }
}
```

Nesse caso, a transação não altera a conexão nem as tentativas e não chama o
Google. A UI deve manter o estado atual e orientar nova tentativa de desconexão
após o callback terminar. `POST /v1/integrations/google/authorize` também pode
retornar esse conflito enquanto existe uma tentativa consumida no mesmo tenant.
Os limites usuais de autenticação, papel, taxa e concorrência continuam podendo
recusar a requisição antes da RPC, inclusive `503 GOOGLE_BUSY`.

O consumo e a desconexão usam o mesmo lock de tenant. Se a desconexão ocorrer
primeiro, remove as tentativas ainda não consumidas e o callback posterior não
troca código por tokens. Se o consumo ocorrer primeiro, a desconexão retorna
409. Depois de um callback bem-sucedido, uma nova desconexão encontra e revoga
o token persistido. Expirar o state de 10 minutos não libera uma troca em curso.

Quando a remoção local é concluída e a revogação do token persistido recebe
HTTP 200 do Google, a API retorna HTTP **200**:

```json
{ "disconnected": true, "revocation": "succeeded" }
```

Se o token local estiver danificado, sua decifragem falhar ou a revogação externa
falhar/não for confirmada, retorna HTTP **200** com:

```json
{
  "disconnected": true,
  "revocation": "failed",
  "warning": "O acesso local foi removido. Revise também a autorização na sua conta Google."
}
```

Se não houver token local, inclusive ao remover consentimentos ainda não
consumidos, após timeout/cancelamento ou numa desconexão repetida, retorna HTTP
**200** com:

```json
{
  "disconnected": true,
  "revocation": "failed",
  "warning": "O acesso local foi removido, mas não há credencial local para confirmar a revogação externa. Revise a autorização na sua conta Google."
}
```

**`not_needed` deixou de ser emitido.** A ausência de token local não prova
ausência de uma autorização no Google, e não há histórico durável de revogação
que permita afirmar isso numa requisição posterior. `failed` inclui tanto uma
tentativa externa malsucedida como a impossibilidade de confirmá-la sem token;
a UI deve apresentar `warning`. `succeeded` confirma a resposta à revogação do
token persistido usado naquela requisição, não uma auditoria de todos os grants.

A remoção local acontece antes da chamada externa, inclusive com o sinalizador
desligado, depois de rejeitar trocas em curso. Não há fila de retry de revogação;
após falha, o responsável deve revisar/revogar manualmente na conta Google.
Nunca apaga conexões de outro tenant. Nenhum token vai para query string.

#### Expiração, timeout e reconciliação

A expiração de 10 minutos impede consumir ou concluir o consentimento. Uma
tentativa já consumida permanece como bloqueio de desconexão/novo consentimento
até o callback concluir sua limpeza; limpeza por expiração e desativação global
não apagam esse bloqueio. Uma troca concluída com sucesso remove a tentativa e
persiste os tokens na mesma transação. Nas outras saídas, o callback remove sua
própria tentativa em `finally`, depois de terminar a operação local, sem revogar
tokens recebidos tardiamente ou rejeitados pela persistência.

O timeout de rede de até 8 segundos aborta a chamada local e conduz ao `finally`.
Abortar não comprova o resultado no Google; pode continuar existindo um grant
sem token persistido. Esse caso exige revisão na conta Google, sem tentativa de
revogação automática que possa atingir outra conexão legítima. O callback
continua retornando apenas `google=error`, sem detalhes ou credenciais na URL.

Se o processo cair, a resposta do consumo no banco se perder ou a limpeza falhar,
uma tentativa consumida pode permanecer bloqueando o tenant mesmo após expirar.
**Não há desbloqueio automático por relógio nem endpoint de recuperação nesta
versão.** Repetir a desconexão não resolve esse resíduo. A recuperação operacional
exige confirmar que nenhum processo ainda pode finalizar aquela troca,
inspecionar a conexão persistida e reconciliar somente a tentativa afetada,
com autorização própria e revisão do grant no Google quando necessário. Não
apagar tentativas consumidas só porque `expires_at` passou. Essa disponibilidade
limitada é uma escolha conservadora para evitar revogação durante uma troca cujo
término não foi confirmado.

**Limite do Google:** revogar pode remover todos os escopos concedidos pela mesma
conta Google ao mesmo projeto e invalidar tokens de seus outros clientes OAuth.
Dois Client IDs dentro do mesmo projeto não garantem isolamento dessa revogação.
Se login/dados ou a mesma conta Google em vários tenants exigirem revogação
independente, revisar a separação de projetos/grants antes do lançamento. Esta
implementação não administra projetos nem promete isolamento externo que o
provedor não oferece. A sessão do produto pertence ao Supabase, não a este token.

## Controles implementados

- Estado aleatório de 256 bits, somente SHA-256 persistido, vinculado ao tenant,
  usuário e hash do nonce do navegador. Expira em 10 minutos pelo relógio do DB.
- Cookie `__Host-fluxo-google-oauth`, Secure, HttpOnly, SameSite=Lax, Path=/,
  Max-Age=600, sem Domain. Novo início substitui tentativas não consumidas do
  navegador e do mesmo usuário/tenant. Se a tentativa anterior do navegador já
  estiver consumida em outro tenant, é invalidada mas seu bloqueio é preservado.
  No mesmo tenant, novo início recebe `409 GOOGLE_OAUTH_IN_PROGRESS`.
- PKCE S256; verifier criptografado no banco, nunca enviado à UI.
- Consumo atômico via UPDATE condicional, sob o mesmo lock de tenant usado na
  desconexão, sem replay; no máximo uma tentativa consumida por tenant. Ao trocar
  de tenant no mesmo navegador, o início bloqueia os tenants envolvidos em ordem
  de UUID. Cancelamento também consome o estado. Duplicação de state/code e cookie
  é rejeitada. Sintaxe de state/cookie inválida é rejeitada antes de banco,
  contadores ou reserva de concorrência.
- Revalidação do papel após a troca com Google dentro da transação final.
  Desativação/invalidação/expiração impedem persistência; desconexão aguarda o
  término de tentativas consumidas. Rejeição de callback nunca dispara revogação.
- AES-256-GCM com IV aleatório de 12 bytes, tag de 16 bytes, envelope `v:1` e
  AAD com finalidade, tenant e usuário. Finalidade PKCE inclui o hash do estado.
- Refresh privado antes da consulta quando restam no máximo 60 segundos.
  Compare-and-swap pela revisão evita restaurar uma conexão removida/substituída.
- Tabelas de config/auditoria/tokens/tentativas com RLS e FORCE RLS, sem políticas
  ou grants de navegador. Somente `service_role`, com grants explícitos mínimos.
  RPCs SECURITY INVOKER, search_path vazio, EXECUTE revogado de PUBLIC/anon/authenticated.
- FKs indexadas, uma conexão por tenant, uma tentativa por usuário/tenant, limpeza
  de até 1.000 tentativas expiradas **não consumidas** ao iniciar autorização.
  Sem cron remoto criado; tentativas consumidas exigem finalização/reconciliação.
- Até 8 operações de rede Google concorrentes no processo; uma consulta ou
  desconexão em andamento por tenant nesse processo. Rate limits por minuto:
  autorizar 5/usuário, recursos 10/usuário/tenant, desconectar 10/usuário,
  configuração escrita 10/superadmin, status 40/usuário, callback 60/usuário
  identificado na tentativa **já consumida atomicamente**, com state + nonce
  corretos e ainda válidos. Tentativas aleatórias, cookies incorretos e replays
  não criam nem incrementam contadores. O mapa de callbacks é separado dos
  limites autenticados; cada mapa tem no máximo 5.000 entradas com expiração.
  `Retry-After: 60` em respostas HTTP 429; callback preserva o contrato 303.
- Endpoints Google fixos, redirect de fetch proibido, timeout de até 8 segundos
  por requisição e corpo máximo 512 KiB (token 32 KiB, revogação 16 KiB).
  Paginação limitada: uma consulta completa pode durar até 5 timeouts em série.
- Callback sempre retorna ao caminho fixo
  `https://app.fluxoatento.com.br/canais?google=connected|cancelled|error`, limpa o
  cookie e não inclui código, token, mensagem do provedor ou destino fornecido.
- HTTP sem cache, no-referrer e sem logs de URL completa/código/token no módulo.

Os rate limits são por processo, não uma solução distribuída de quotas. O
callback não usa IP do socket, `X-Real-IP` ou `X-Forwarded-For` para a quota.
Entradas com sintaxe válida ainda exigem uma tentativa de consumo no banco:
o limite global de oito operações contém a concorrência dessa etapa, mas não
substitui proteção de volume/abuso no proxy confiável. Essa proteção deve ser
configurada e validada operacionalmente, sem registrar query/cookie/Bearer.
Escala horizontal exige limites próprios e teste de refresh concorrente. CAS
e locks protegem persistência; chamadas externas e novos consentimentos não
formam uma transação distribuída com a revogação do Google. Não há alegação de
capacidade para milhões.

## Migração, verificação e limites

Criada com a CLI oficial Supabase **2.117.0**:

`supabase migration new google_tenant_oauth`

Arquivo: [20261015171734_google_tenant_oauth.sql](../supabase/migrations/20261015171734_google_tenant_oauth.sql).
A consulta `supabase migration list --local` falhou com conexão recusada em
`127.0.0.1:54322`. **Não aplicada** local ou remotamente naquela rodada; SQL, RLS, grants, locks e
RPCs ainda precisavam de execução/aceite em banco isolado. Não foram executados
advisors nem lint conectado. Os testes estáticos verificam instruções presentes,
não comprovam comportamento do Postgres.

Continuidade: a suíte [Database isolation](DATABASE_VALIDATION.md) executou
**17/17 testes com sucesso** em PostgreSQL 17.11 descartável no GitHub, com todas
as migrações, grants legados e explícitos, RLS e concorrência real. O registro
vincula o commit e a execução; conferir também o check de qualquer commit posterior.
A migração Google ainda não aplicada ao produto agora revoga também os grants
legados de service_role antes de conceder somente as operações necessárias.
Não há aplicação remota, liberação de flag ou substituição do aceite Supabase/Google.

Testes focados Node:

```text
node --test tests/unit/google-backend.test.mjs tests/unit/google-store.test.mjs
```

Após as correções de segurança, **47/47 testes Google passaram** em Node
22.23.1: HTTP real em loopback, Google e store simulados, verificação do adaptador
e fonte SQL. As regressões cobrem perda do papel de outro autorizador com resposta
parcial, as duas ordens de consumo/desconexão, tentativa expirada ainda em troca,
desativação/reativação, substituição pelo mesmo navegador em outro tenant,
timeout, resposta de consumo perdida e falha de limpeza. Pausas controladas por
promessas e relógio de fixture ordenam as corridas, sem sleeps. O teste de timeout
aguarda o sinal de abort da própria chamada.

Também cobrem mais de 5.000 pares aleatórios de state/nonce, cookie incorreto
com state existente, replays, quota por usuário validado e limite global de
concorrência antes da validação no banco. Não são testes reais de locks/RLS.
A rodada focada não executou requests Google reais, credenciais reais, navegador,
build Nuxt, commit, push, deploy ou aplicação de migração. Depois da integração,
o responsável executou a suíte completa: **103/103 testes aprovados** naquela
rodada, incluindo monitoramento e UI. A suíte passou a **104/104** com a proteção
do ambiente de testes de banco, também aprovada no CI do commit `368de636`.
As demais evidências e seus limites estão no
[registro de validação](VALIDATION_2026-10-15.md).

Antes de ativar:

1. Manter verde a validação de migrações/grants/RLS em PostgreSQL descartável,
   já executada; conferir schema/histórico e advisors no Supabase de teste.
2. Manter os testes de concorrência e isolamento já aprovados e completar o
   aceite com duas identidades reais no Supabase. A fixture SQL não valida Auth/JWT.
3. Configurar cliente de dados, escopos, callback, APIs e consentimento no Google;
   usar cofre privado para as quatro variáveis, nunca formulário frontend.
4. Testar cookies/CORS com navegador em HTTPS real de revisão. Os fixtures HTTP
   injetam cookie manualmente; não comprovam a política de cookies do navegador.
5. Impedir que proxy/APM/access log registre query string do callback, Authorization,
   cookies ou corpos OAuth; revisar backup/chave, retenção e observabilidade sanitizada.
6. Testar autorização/negação/renovação/revogação e APIs reais com ativos de teste.
   Um callback aceito não certifica APIs nem dados; validar a listagem separadamente.
7. PR, CI, revisão humana e autorização operacional precedem produção. Não habilitar
   a flag como substituto desses aceites. Não alterar billing ou serviços de IA.

Rollback seguro da aplicação: desabilitar a integração no superadmin, voltar a
versão da API anterior e preservar as tabelas/envelopes. Não derrubar tabelas ou
revogar grants Google de clientes como efeito implícito de rollback. Reversão de
schema e exclusão de dados requerem plano próprio aprovado.

## Fontes oficiais consultadas

- [Google OAuth de servidor e revogação](https://developers.google.com/identity/protocols/oauth2/web-server)
- [PKCE S256 — RFC 7636](https://www.rfc-editor.org/rfc/rfc7636)
- [Analytics Admin: accountSummaries](https://developers.google.com/analytics/devguides/config/admin/v1/rest/v1beta/accountSummaries/list)
- [Search Console: sites.list](https://developers.google.com/webmaster-tools/v1/sites/list)
- [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Funções e privilégios Supabase](https://supabase.com/docs/guides/database/functions)
- [Mudança de grants explícitos na Data API](https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically)

As skills fluxo-delivery, Supabase e Postgres orientaram o escopo, criação via CLI,
separação de evidências, privilégios mínimos, índices e transações sem rede.
