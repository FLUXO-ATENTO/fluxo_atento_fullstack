# Google: acesso ao produto e dados por empresa

Registro de 15/10/2026. Este documento acompanha código para revisão; não atesta
ativação no Google, configuração de segredos ou deploy de produção.

## Decisão de arquitetura

O agente do produto continua na VPS. Google Cloud fornece a identidade do app e
as APIs de dados; não é necessário criar um agente em Vertex/Agent Platform,
Gemini, Cloud Run ou Agent Engine para esta integração. Não reativar faturamento,
criar recursos pagos ou excluir recursos antigos como efeito desta entrega.

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

## Inventário observado no Console

Projeto confirmado: **Agente Fluxo Atento**, ID `fluxo-atento`. Também foi visto
um projeto separado chamado “Fluxo - Google Integration”; não foi alterado nem
adotado como destino sem verificar dependências.

No projeto atual, a lista completa exibiu **82 APIs/serviços habilitados**:

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

## APIs por fase

| API | Identificador | Uso | Ação nesta fase |
| --- | --- | --- | --- |
| Analytics Admin | `analyticsadmin.googleapis.com` | Descobrir contas/propriedades GA4 autorizadas | Já habilitada; validar leitura |
| Analytics Data | `analyticsdata.googleapis.com` | Relatórios de visitas/conversões da propriedade | Habilitar e validar antes dos relatórios |
| Search Console | `searchconsole.googleapis.com` | Sites e resultados de pesquisa autorizados | Habilitar e validar |
| PageSpeed Insights | `pagespeedonline.googleapis.com` | Diagnóstico público determinístico | API habilitada; endpoint do produto, chave restrita/cache/limites ainda pendentes |
| Google Ads | `googleads.googleapis.com` | Campanhas, investimento e conversões | Fase separada: developer token, acesso e revisão próprios |
| BigQuery | `bigquery.googleapis.com` | Exportação e análises detalhadas de eventos GA4 | Já habilitada, mas não necessária para o login ou a descoberta inicial; não criar exportações/jobs agora |

Não habilitar Gmail, Drive, Calendar, YouTube ou serviços de IA para “garantir”
esta integração. BigQuery pode ter custos de armazenamento e processamento;
há sandbox com limites. Decidir necessidade, retenção, região, orçamento e
propriedade dos dados antes de conectar exportações de clientes.

## Login Google — configuração e aceite

1. Revisar o cliente **Fluxo Atento Web** e suas dependências. Não rotacionar ou
   apagar o segredo usado por outro sistema sem um plano de transição.
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

- [ ] Restabelecer acesso estável aos detalhes do cliente OAuth/biblioteca.
- [ ] Confirmar e habilitar somente Analytics Data e Search Console, sem aceitar
  reativação de faturamento como efeito colateral.
- [ ] Revisar branding, público de teste, escopos e callbacks exatos.
- [ ] Configurar/validar o provedor de login no Supabase.
- [ ] Configurar cliente de integração distinto e segredos privados na VPS.
- [ ] Validar migração, RLS/grants, dois tenants, rollback e cópia de segurança.
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
