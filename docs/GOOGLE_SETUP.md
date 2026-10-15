# Google: acesso ao produto e dados por empresa

Registro de 15/10/2026. Código permanece em revisão. O cliente de login abaixo
foi criado no Google e o proprietário habilitou o provedor no Supabase. A
configuração foi relida e uma conta escolhida pelo proprietário completou o
login na prévia local. Isso não atesta conexão de dados nem deploy/aceite HTTPS.

## Decisão de arquitetura

O agente do produto continua na VPS. Google Cloud fornece a identidade do app e
as APIs de dados; não é necessário criar um agente em Vertex/Agent Platform,
Gemini, Cloud Run ou Agent Engine para esta integração. Não reativar faturamento,
criar recursos pagos ou excluir recursos antigos como efeito desta entrega.

Projeto adotado expressamente pelo proprietário: **Fluxo - Google Integration**,
ID **`empirical-envoy-508802-k0`**. Usar esse projeto para os novos clientes de
login e dados do Fluxo Atento. O projeto anterior `fluxo-atento` permanece
preservado; não transferir, excluir, revogar nem desligar seus recursos.

| Finalidade | Quem autentica/autoriza | Onde ficam as credenciais | Retorno |
| --- | --- | --- | --- |
| Entrar com Google | Google comprova identidade; Supabase cria a sessão do produto | Client ID/Secret do login no provedor Google do Supabase | `https://qbfmebpzxnzdpalmgtxr.supabase.co/auth/v1/callback` |
| Voltar ao app após o login | Supabase, com PKCE e destino local validado | Sessão mantida pelo SDK no host do app | `https://app.fluxoatento.com.br/auth/callback` |
| Conectar Analytics/Search Console | Responsável pela empresa autoriza leitura no Google | Cliente de integração e chave de proteção somente na VPS; tokens protegidos por tenant | `https://api.fluxoatento.com.br/v1/integrations/google/callback` |
| Consulta pública de PageSpeed | Consulta determinística de URL pública; sem login social | Chave restrita do serviço consumidor, quando configurada; nunca no bundle | Não usa callback OAuth |

Usar **clientes OAuth distintos** para login e integração de dados, com callbacks
e segredos separados. Isso não garante revogação independente: no mesmo projeto
Google, a revogação pode atingir outras concessões da mesma conta, inclusive em
outros clientes OAuth. A confirmação de desconexão informa esse efeito; sessões
e registros locais de outros tenants não são apagados. Avaliar projetos separados
se isolamento de concessões for requisito. Não usar conta de serviço global para
ter acesso implícito aos ativos de clientes.

## Projeto adotado e cliente de login criado

A lista do projeto adotado continha um cliente **Fluxo de Clientes**, com origens
e retorno no domínio `fluxodeclientes.com.br`, distinto do produto atual. Esse
cliente e seu segredo foram preservados. O proprietário autorizou a criação
de um cliente independente, confirmada pela mensagem **Cliente OAuth criado**:

| Campo | Configuração do novo cliente |
| --- | --- |
| Nome interno | `Fluxo Atento - Login` |
| Tipo | Aplicativo da Web |
| Projeto | `empirical-envoy-508802-k0` |
| Client ID público | `564163280307-ee3l0vo4v49gt1fpf7aohtkd63po8v11.apps.googleusercontent.com` |
| Origem JavaScript | `https://app.fluxoatento.com.br` |
| Retorno OAuth | `https://qbfmebpzxnzdpalmgtxr.supabase.co/auth/v1/callback` |
| Cliente para agente de IA | Não selecionado; este cliente serve somente ao login |
| Segredo | Inserido e salvo pelo proprietário no Supabase; campo mantido oculto na conferência, sem cópia para o repositório |

O Google informou acesso restrito aos usuários de teste do projeto. A criação
do cliente não muda o público-alvo nem conclui a verificação da marca. Branding,
público e escopos são configurações compartilhadas pelo projeto: revisar impacto
no cliente preexistente antes de alterar. Dois clientes não são dois projetos.

A conferência de Branding mostrou **Fluxo de Clientes**, homepage e links legais
em `fluxodeclientes.com.br`, além dos domínios autorizados preexistentes. O domínio
`fluxoatento.com.br` e o host do Supabase atual aparecem na lista após a criação.
Marca e links não foram alterados: uma atualização atingiria também o cliente
antigo, usado recentemente segundo o Console. Antes de lançamento, decidir a
transição da marca compartilhada e verificar os textos/URLs públicos do produto.

Inventário completo do projeto adotado: **28 APIs/serviços**, uma página de 28.
Analytics Admin, Analytics Data, Search Console e PageSpeed não constavam.
Google Ads, Chrome UX Report, BigQuery, Gmail, Calendar e YouTube já constavam;
isso não demonstra acesso aos dados dos clientes nem necessidade de uso desses
serviços. Nenhuma API foi ativada ou desativada nesta conferência.

A navegação sem a conta Google correta apresentou falta de acesso ao projeto;
voltar à conta já autorizada restabeleceu a listagem e permitiu criar o cliente.
Não foi concedido IAM adicional nem alterado faturamento. Esse achado não prova
a causa de todos os erros anteriores do Console.

Na inspeção inicial do Supabase, Google estava desligado e `Client IDs` exibia
um e-mail. Após orientação e salvamento pelo proprietário, a releitura confirmou:

- Google **Enabled**, com o Client ID público registrado acima;
- `Skip nonce checks` e `Allow users without an email` **desligados**;
- segredo oculto, sem uso da ação Reveal;
- Site URL `https://app.fluxoatento.com.br`;
- retornos exatos de produção `/auth/callback` e `/recuperar-acesso` no host app;
- GitHub desligado, confirmação de e-mail ligada e acesso anônimo desligado.

Não copiar segredo para chat, Git, frontend ou documentação. O estado Enabled
não valida sozinho o conteúdo oculto do segredo. A troca OAuth abaixo foi
concluída sem revelar o segredo.

### Aceite local autorizado concluído para uma conta

O `/login/` publicado na VPS foi aberto e ainda não contém os botões sociais
desta revisão. Não declarar o Google disponível para clientes nem publicar toda
a branch apenas para testar a credencial.

O proprietário autorizou adicionar temporariamente
`http://127.0.0.1:4175/auth/callback` e testar com sua própria conta. O Supabase
confirmou três retornos; os dois de produção foram preservados. Após a conclusão,
o retorno temporário foi removido. A UI confirmou **Total URLs: 2**, contendo
somente callback e recuperação de produção. Qualquer novo teste local precisa
de autorização própria; não recolocar o endereço automaticamente.

O ambiente local é separado da fixture e da produção, vinculado somente a
loopback, com o SDK real e somente Google habilitado. Não utiliza chave
administrativa nem segredo Google. A consulta direta da API a partir dessa
origem recebeu 403; não foi alterado o CORS da VPS. A ponte local de aceite
permite apenas GETs explicitamente listados, ao host fixo da API do produto,
mantendo o Bearer do próprio usuário e a autorização no backend. Sem cookies,
destinos arbitrários, escrita pela API ou registro de tokens. O caminho de
workspace continua sujeito ao provisionamento idempotente existente para uma
identidade nova; não elevar papéis nem criar contas de cliente para o teste.

Resultado observado no navegador: **Continuar com Google** abriu a
tela oficial **Escolha uma conta**, em `accounts.google.com`. O Client ID da
requisição corresponde ao cliente novo, o callback é o Supabase atual e os
escopos solicitados são somente `email profile`. O proprietário fez a escolha
e o consentimento; o retorno `/auth/callback` terminou no painel `/`. O nome
do perfil apareceu na saudação, a empresa inicial foi carregada e o papel era
responsável pela empresa, não superadmin. A recarga manteve a sessão e os dados
de apresentação. O acesso direto a `/admin` mostrou a mensagem de acesso
reservado, sem expor conteúdo administrativo. Nenhuma promoção de papel foi
feita; fechar o tour apenas ocultou a janela, sem marcar as etapas concluídas.
A tela confirmou a pendência de branding **Fluxo de Clientes**, com seus links
legais antigos. Não incluir e-mails de contas, URL completa da tentativa,
código, estado OAuth ou screenshot com dados pessoais neste repositório.

Verificações da ponte local: saúde 200, workspace sem sessão 401, tentativa de
POST 405, origem externa 403 e rota fora da lista 404. Três testes unitários de
login social passaram; as referências em 25 documentos e o scanner da fonte
(189 arquivos, zero padrões detectados) passaram na preparação anterior.
Este aceite usa identidade real, mas somente uma conta e interface local com
ponte restrita. Não prova isolamento entre duas identidades reais, negativa
direta da API administrativa, cancelamento, expiração, recuperação por e-mail,
autorização de Analytics/Ads nem funcionamento em produção HTTPS.

## Inventário histórico do projeto anterior

Projeto inspecionado anteriormente: **Agente Fluxo Atento**, ID `fluxo-atento`.
Esse inventário não deve ser atribuído ao novo projeto adotado.

No projeto anterior, a lista completa exibiu **82 APIs/serviços habilitados**:

- Google Analytics Admin API e PageSpeed Insights API já constavam na lista.
- BigQuery e serviços relacionados já constavam; não foram ativados nesta tarefa.
- Agent Platform, Agent Registry, Gemini e outros serviços antigos também
  constavam. API habilitada não comprova recurso ativo, uso, custo ou ausência de custo.
- Analytics Data e Search Console não constavam nas duas páginas consultadas.
- Credenciais mostrou um cliente Web chamado **Fluxo Atento Web**, uma conta de
  serviço e nenhuma chave de API listada. O segredo do cliente não foi acessado.

A página inicial, a lista de APIs e a lista de credenciais carregaram. Detalhes do
cliente OAuth e partes da biblioteca retornaram erro/carregamento incompleto;
Cloud Shell perdeu conexão. Isso **não identifica faturamento como causa**.
Nenhuma API, chave, permissão, cobrança ou recurso Google foi alterado durante
essa conferência inicial. Não registrar identificadores de sessões, códigos OAuth,
valores de chaves ou e-mails privados do operador neste documento.

### Continuidade em 15/10 — cliente OAuth antigo identificado

Os detalhes de **Fluxo Atento Web** voltaram a abrir e mostraram somente dois
retornos: um projeto Supabase anterior e o host `auth.fluxoatento.com.br`.
O retorno do projeto atual `qbfmebpzxnzdpalmgtxr` não estava cadastrado. O usuário
autorizou adicionar o callback atual preservando os dois anteriores e a chave.

A tentativa de salvar o terceiro endereço retornou **“A ação falhou, tente
novamente”**. Reabrir o cliente e usar “Tentar novamente” retornou **“Falha ao
carregar”**. Persistência **não confirmada**; não declarar login corrigido nem
repetir a escrita sem reler o estado. Não foi criada/rotacionada chave, não foram
removidos retornos e não houve alteração de faturamento. A próxima conferência
deve verificar se o terceiro retorno existe antes de qualquer nova inclusão.

Paralelamente, o código ganhou [testes PostgreSQL isolados](DATABASE_VALIDATION.md)
para SQL, RLS, grants e concorrência, sem depender de acesso ao projeto remoto.

## APIs por fase no projeto adotado

O inventário antigo não comprova ativação em `empirical-envoy-508802-k0`.
Conferir cada API nesse projeto antes de marcar a integração como pronta.

| API | Identificador | Uso | Ação nesta fase |
| --- | --- | --- | --- |
| Analytics Admin | `analyticsadmin.googleapis.com` | Descobrir contas/propriedades GA4 autorizadas | Ausente na lista; habilitar e validar leitura |
| Analytics Data | `analyticsdata.googleapis.com` | Relatórios de visitas/conversões da propriedade | Ausente na lista; habilitar e validar antes dos relatórios |
| Search Console | `searchconsole.googleapis.com` | Sites e resultados de pesquisa autorizados | Ausente na lista; habilitar e validar |
| PageSpeed Insights | `pagespeedonline.googleapis.com` | Diagnóstico público determinístico | Ausente na lista; endpoint, chave restrita/cache/limites ainda pendentes |
| Google Ads | `googleads.googleapis.com` | Campanhas, investimento e conversões | API já listada; fase separada: developer token, acesso e revisão próprios |
| BigQuery | `bigquery.googleapis.com` | Exportação e análises detalhadas de eventos GA4 | Já listada, não necessária para login/descoberta inicial; não criar exportações/jobs agora |

Não habilitar Gmail, Drive, Calendar, YouTube ou serviços de IA para “garantir”
esta integração. BigQuery pode ter custos de armazenamento e processamento;
há sandbox com limites. Decidir necessidade, retenção, região, orçamento e
propriedade dos dados antes de conectar exportações de clientes.

## Login Google — configuração e aceite

1. Usar **Fluxo Atento - Login** no projeto adotado. Não reutilizar nem rotacionar
   os clientes **Fluxo de Clientes** ou **Fluxo Atento Web** por conveniência.
2. Cliente Web de login: callback exato do Supabase acima. Se forem usadas
   origens JavaScript, restringir aos hosts realmente necessários; não usar `*`.
3. Provedor Google no Supabase: guardar ID/segredo de login ali, nunca no Git,
   chat, Netlify público ou formulário de tenant.
4. Supabase Site URL no app; permitir retorno exato `/auth/callback` e a rota
   de recuperação configurada. Não habilitar OAuth Server para resolver login
   social: são funções distintas.
5. Branding público: nome Fluxo Atento, site do produto, contato autorizado e
   páginas legais reais. As rotas canônicas do código são `/privacy` e `/terms`;
   o modelo Netlify preserva `/privacidade` e `/termos` com redirecionamentos 301
   após o deploy. Conferir os endereços publicados antes do envio ao Google.
   Publicar/revisar textos legais antes de declarar o aplicativo pronto para
   verificação. Não inventar CNPJ completo a partir de número parcial.
6. Configurar público-alvo, usuários de teste e os dados mínimos de login
   (`openid`, identidade e e-mail). Escopos de Analytics/Ads não entram no login.
7. Habilitar `NUXT_PUBLIC_AUTH_PROVIDERS=google` apenas no ambiente em que o
   provedor foi configurado. A variável ativa o botão; não cria credencial.
8. Testar conta nova/existente, cancelamento, expiração, nome no painel,
   recuperação, retorno por papel e isolamento. Não conceder superadmin pelo
   e-mail digitado, por domínio de e-mail ou por metadados editáveis.

GitHub permanece outro provedor de login, com cliente e teste próprios.
Facebook permanece integração, não login.

## Provedor global e conexão da empresa

O Superadmin tem uma área Google em **Provedores globais**. Sua conferência
mostra requisitos locais e liberação da integração; não exibe segredos e não
declara que uma chamada Google foi bem-sucedida só porque variáveis existem.

O admin da empresa encontra Google em **Integrações**. A primeira etapa permite
autorizar e consultar as propriedades GA4 e os sites Search Console acessíveis.
Essa descoberta não equivale a relatório de métricas, sincronização contínua ou
análise do funil. Resultados parciais e ausência de permissão devem ser explícitos.

Requisitos de segurança e aceite para o backend:

- usuário e tenant verificados no servidor; gestão limitada a owner/admin;
- cliente de dados distinto do cliente de login;
- somente `analytics.readonly` e `webmasters.readonly`;
- estado OAuth aleatório, temporário e de uso único, vinculado a usuário,
  tenant e navegador; PKCE, cookie seguro e retorno fixo;
- tokens protegidos no servidor, sem leitura por anon/authenticated;
- renovação, cancelamento, revogação e falha sem vazamento de segredo;
- nenhuma sessão do produto, código ou token repassado ao agente pelo browser;
- agente na VPS acessará ferramentas autorizadas pelo backend, nunca uma
  credencial administrativa global como identidade de todos os tenants.

Os nomes finais das variáveis e contratos de API pertencem ao código e ao
`.env.example` do serviço; valores reais pertencem ao ambiente privado. Não
aplicar a migração ou liberar produção antes de PR, CI, revisão e aceite.
Detalhes implementados e limites de validação estão no
[contrato Google do backend](GOOGLE_BACKEND_CONTRACT.md).
O [modelo Nginx](../ops/nginx-monitor-location.conf) tem tratamento exato do
callback sem logs de URL e timeout compatível com a descoberta paginada.
Precisa de `nginx -t`, revisão de proxy/APM e publicação operacional; não foi
aplicado à VPS. A ausência de logs nessa rota deve ser compensada por eventos
sanitizados, nunca por registro do código de autorização.

## Sequência operacional pendente

- [x] Confirmar projeto adotado e criar cliente exclusivo do login, preservando antigos.
- [ ] Confirmar e habilitar as APIs da fase inicial no projeto adotado, sem aceitar
  reativação de faturamento como efeito colateral.
- [ ] Revisar branding, público de teste, escopos e callbacks exatos.
- [x] Configurar e reler o provedor Google no Supabase, com proteções e ID corretos.
- [x] Completar login OAuth real de uma conta na prévia local e remover o retorno temporário.
- [ ] Completar aceite HTTPS e com duas identidades; publicar o botão Google no dashboard.
- [ ] Configurar cliente de integração distinto e segredos privados na VPS.
- [x] Validar migrações, RLS/grants e concorrência em PostgreSQL descartável: 17/17.
- [ ] Completar aceite Supabase com identidades reais, advisors, rollback e backup.
- [ ] Publicar backend/frontend aprovados; liberar integração pelo superadmin.
- [ ] Testar autorização, leitura real, renovação, cancelamento e desconexão.
- [ ] Registrar resultado real, data e versão em STATUS; só então liberar para clientes.

## Fontes oficiais consultadas

- [OAuth para aplicações servidor](https://developers.google.com/identity/protocols/oauth2/web-server)
- [Login Google no Supabase](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Descoberta de contas GA4](https://developers.google.com/analytics/devguides/config/admin/v1/rest/v1alpha/accountSummaries/list)
- [Analytics Data API](https://developers.google.com/analytics/devguides/reporting/data/v1/quickstart)
- [Sites no Search Console](https://developers.google.com/webmaster-tools/v1/sites/list)
- [PageSpeed Insights](https://developers.google.com/speed/docs/insights/v5/get-started)
- [Exportação GA4 para BigQuery e custos](https://support.google.com/analytics/answer/9823238?hl=en)

Essas fontes são referência técnica, não prova de configuração desta conta.
