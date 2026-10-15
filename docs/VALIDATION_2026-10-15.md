# Evidências de revisão — 15/10/2026

Esta entrega é **código para revisão**, não publicação nem aceite de produção.
Os fatos anteriores de produção estão em [STATUS](STATUS.md). Nenhum resultado
de fixture comprova permissões de contas reais ou comportamento do banco.

## Ambiente e escopo do pacote inicial

Este bloco registra a primeira entrega. As continuidades abaixo e em
[STATUS](STATUS.md) registram testes/configurações posteriores; não confundir
o aceite inicial com o estado atual das contas e do login.

- Base remota conferida: `882ba47d7e82e59e035827e9742d1570989261f2`.
- Nuxt 4.6.1, Vue 3.5.43, Nuxt UI 4.11.3; dependências mantidas.
- Site e dashboard gerados separadamente, de forma sequencial.
- Conta de QA sintética, sem tráfego Supabase/Google/produção na prévia isolada.
- Nenhum deploy, DNS, billing, segredo, conta real ou migração remota alterado.

## Conferências locais do pacote inicial

| Conferência | Resultado observado | Limite |
| --- | --- | --- |
| Testes unitários e contratos | 103/103 passaram após as correções Google | Serviços externos simulados; não comprova RLS/locks ou OAuth real |
| Regressões focadas Google | 47/47 passaram, incluindo 14 casos novos | HTTP local, store/Google simulados e revisão estática de SQL |
| Tipos Nuxt/TypeScript | Passou | Não comprova comportamento de serviços reais |
| Geração do site | Passou, 76 rotas | Artefato local, não deploy Netlify |
| Geração do dashboard | Passou, 36 rotas | Artefato local, não deploy VPS |
| Scanner do site gerado | 173 arquivos, nenhum padrão privado detectado | Busca por padrões, não garantia de ausência de todo segredo |
| Scanner do dashboard gerado | 89 arquivos, nenhum padrão privado detectado | Mesmo limite |
| Scanner da fonte | 183 arquivos, nenhum padrão privado detectado | Não cobre VPS, logs, contas externas ou histórico completo |
| Links da documentação | Passou em 24 documentos | Valida existência local, não correção editorial |
| Skills do projeto | 2/2 passaram no validador oficial | Não comprova execução autônoma de tarefas |
| Configuração dos agentes | 4 arquivos TOML válidos | Permissões efetivas dependem do executor |
| Whitespace do diff | Passou | Não substitui revisão de código |

Os builds exibiram avisos de tempo dos plugins e de resolução externa de um
utilitário Nitro, mas encerraram com código 0. A prévia autenticada fictícia
também exibiu avisos de hidratação; os fluxos listados abaixo foram conferidos
depois da inicialização. Não declarar o navegador livre de avisos.

## Navegador — resultados observáveis

- Paleta personalizada salva e preservada após recarregar, depois restaurada
  para a marca padrão. Tema escuro conferido.
- Entrada comum pausada com “Preciso de mais tempo”; “Continuar agora” levou a
  `/canais` com a sessão fictícia existente. Os controles agora aguardam a
  inicialização da página para não perder o primeiro clique.
- Google no Superadmin distingue login e integração. Na fixture sem configuração,
  a liberação fica desabilitada e os requisitos aparecem pendentes.
- Google na empresa informa “Aguardando liberação”, sem simular fontes conectadas.
- Conta fictícia da empresa acessando `/admin` recebeu “Acesso reservado à
  administração da plataforma”. Nenhum menu de provedores globais foi mostrado.
  O tour inicial pode se sobrepor ao primeiro acesso; o bloqueio foi conferido
  após dispensá-lo. O teste não substitui o aceite negativo em produção.
- Docs: busca `integracoes` sem acento localizou o guia; abertura e reload
  preservaram o artigo após a inicialização. Tema escuro aplicado.
- Docs em viewport móvel solicitado de 390 px (área útil observada: 375 px):
  largura do documento igual à área útil, sem overflow horizontal; abrir menu,
  escolher guia e recolher navegação funcionaram.
- Página pública do agente explica que o chat está pendente. Seu CTA aponta
  para a entrada comum do app com destino `/assistente`, sem carregar tokens.

## Revisão de segurança Google

Uma revisão independente encontrou três cenários, corrigidos e cobertos por
regressões nesta entrega:

1. Revalidação do autorizador também antes de devolver resultados parciais.
2. Desconexão retorna conflito enquanto a troca de tokens está em andamento,
   sem declarar revogação externa quando não há confirmação.
3. Quota de callback vinculada à tentativa validada, sem penalizar todas as
   pessoas atrás do mesmo proxy por requisições inválidas de terceiros.

O [contrato do backend](GOOGLE_BACKEND_CONTRACT.md) registra testes e limites.
Uma queda de processo pode deixar uma tentativa consumida exigindo reconciliação
operacional; não há desbloqueio automático por relógio nem recuperação pela UI.
As regressões simuladas não substituem testes de concorrência no banco real.

Ao encerrar esse pacote inicial, **permaneciam pendentes** (ver as atualizações
de banco e login em STATUS):

1. Aplicar SQL em banco isolado e executar grants/RLS/RPCs como cada papel.
2. Concorrência em Postgres e entre processos, com duas contas e dois tenants.
3. Cliente OAuth, consentimento, callbacks e APIs reais no Console Google.
4. Cookie seguro, CORS, autorização/negação, renovação e revogação em HTTPS real.
5. Configuração privada e revisão de logs do proxy/APM antes de habilitar.
6. CI remoto, revisão humana, aprovação operacional e aceite do deploy.

Nenhum teste desta entrega atesta capacidade para milhões de tenants, cobrança
operacional, PageSpeed público, métricas Analytics, Google Ads, BigQuery ou chat
IA/suporte persistente. A descoberta inicial de fontes não é um relatório.

## Publicação da revisão

Na primeira tentativa de envio em 15/10/2026, a integração GitHub conseguiu
ler a branch `main`, mas recusou a criação da árvore Git com HTTP 403,
`Resource not accessible by integration`. Naquela tentativa não foram criados
commit, branch remota ou PR, e o CI remoto não foi iniciado.

O checkout e os 121 arquivos candidatos ao envio foram preservados.
O transporte Git do terminal também havia falhado na autenticação do Windows;
não foram enfraquecidos TLS nem controles de acesso para contornar essas falhas.

Na retomada, a integração continuou recusando escrita, mas o Git já configurado
no computador aceitou `push --dry-run` para a branch de revisão. A base remota
continuava no commit registrado acima. O scanner de fonte e os links dos docs
foram revalidados. Essa simulação não comprova publicação; o envio efetivo e o
PR devem ser conferidos pelos respectivos objetos remotos. Nenhuma credencial
nova, mudança de TLS ou permissão global foi necessária. Merge e deploy não
fazem parte desta publicação de revisão.

O envio efetivo foi concluído pelo Git no commit
`622bb200db1815c431bcd777668c346797fdedd6`, na branch remota
`feat/dashboard-guided-workspace`. A suíte completa passou novamente (103/103),
e a checagem dos 24 documentos também aprovou o mapa de impacto contra a base.
A criação do PR pela integração retornou o mesmo HTTP 403. O
[PR #6](https://github.com/FLUXO-ATENTO/fluxo_atento_fullstack/pull/6) foi então
aberto pelo navegador autenticado, em rascunho, com base em `main`; sua existência,
branch e estado foram confirmados também pela API de leitura. O CI foi iniciado.
O resultado dos checks deve ser consultado no PR para o commit mais recente;
um resultado de commit anterior não certifica alterações posteriores. A branch
`main` e a produção não foram modificadas.

## Continuidade — login Google real e botão Entrar

O proprietário concluiu o consentimento Google com uma conta própria na prévia
local autorizada, usando o SDK real e a ponte restrita descrita em
[GOOGLE_SETUP](GOOGLE_SETUP.md), sem credencial administrativa no frontend.
Foram observados o retorno ao painel, nome do perfil, empresa inicial e papel
de responsável pela empresa. Uma recarga manteve a sessão. A visita direta a
`/admin` mostrou acesso reservado, sem conteúdo de plataforma. Não se realizou
promoção de papel nem negativa direta por chamada manual à API.

O retorno local temporário foi removido do Supabase; a UI voltou a **2 URLs**,
mantendo os dois retornos de produção. E-mails privados, UUIDs, código OAuth,
tokens, segredo e screenshots com dados pessoais não foram enviados ao Git.

O botão Entrar informado pelo proprietário chegou a um 404 Nginx em `/acessar`
no host público do app. `/login/` abriu a versão anterior do autenticador, ainda
sem Google. O site raiz inspecionado também estava na versão anterior; a origem
exata do clique (público ou preview) não foi presumida. A correção no helper
comum mantém os links de site/docs/agente no login compatível até liberação
explícita do modo guiado. O destino inicial também fica em `/` para não encaminhar
a pessoa a um módulo ausente na versão antiga. A nova configuração tem validação
de valores, regressões unitárias e expectativas de E2E público atualizadas.

Verificação já executada nesta continuidade: **107/107** testes unitários e de
contrato; referências em **25 documentos**; scanner de fonte em **189 arquivos**,
sem padrões reconhecidos de segredo. Tipos, builds e navegador do artefato
corrigido concluíram: typecheck aprovado; site e dashboard gerados sequencialmente
com código 0; scanners de 173/89 arquivos sem achados. Houve avisos de tempo de
plugins, resolução Nitro e timeout de ícones no prerender, sem falha de build.
Na prévia estática do site, clicar Entrar abriu `/login/?next=%2F&origem=site`
na VPS, sem 404. Docs e agente exibiram o mesmo caminho compatível com suas origens.
Isso valida o artefato local e o destino existente, não publica os novos links.
O aceite real de uma conta local não valida duas identidades reais, cadastro,
recuperação, cancelamento/expiração, integrações de dados ou produção HTTPS.

## Adicional — Turnstile

Widget Cloudflare criado: **Fluxo Atento — Autenticação**, um hostname (app),
gerenciado, sem pré-liberação. Widget preexistente preservado. Nenhum segredo
enviado ao Git; a proteção obrigatória no Supabase não foi ativada.

Após incluir o componente, contrato dos três métodos por e-mail, política pública
e CSP: **116/116 testes unitários/contrato aprovados**, typecheck aprovado,
scanner de fonte **194 arquivos / 0 achados**, referências em **26 documentos**.
A inspeção de ciclo de vida em unidade é estática e os métodos Auth usam mocks;
não confundir com validação real pelo servidor. Guia de operação em
[TURNSTILE_SETUP](TURNSTILE_SETUP.md).

QA no navegador, camada `tests/preview`, usando chaves oficiais de teste:

- Widget de sucesso carregado; botão por e-mail inicialmente bloqueado e depois
  liberado. Cadastro e recuperação fictícios devolveram suas mensagens esperadas
  e uma nova verificação. Nenhum e-mail real enviado, conta criada ou senha real usada.
- Troca login/cadastro/recuperação e claro/escuro conferida. Em viewport de 390 px,
  documento e área útil mediram 375 px, sem overflow horizontal.
- Com a chave de falha, apareceu orientação e **Verificar novamente**; o botão
  Entrar no painel ficou desabilitado. Retry renovou o widget e manteve o bloqueio
  diante de nova falha. Não foi resolvido ou contornado desafio real.
- Ajustado idioma do widget para `pt-br`, conforme o aviso do provedor na primeira
  inspeção. A compilação inicial da prévia foi lenta; isso não é medição de produção.
- UI Supabase → Attack Protection confirmou CAPTCHA desligado; nenhuma alteração
  foi salva ali. Não houve teste remoto de token inválido/reutilizado com Auth real.

A validação final após o adicional concluiu com código 0: tipos Nuxt/TypeScript,
`pnpm generate` (76 rotas) e `pnpm generate:dashboard` (36 rotas), executados
sequencialmente. Scanners dos artefatos: **174 arquivos do site** e **90 do
dashboard**, sem padrões privados detectados. Builds usaram CAPTCHA desligado
e entrada pública compatível; o comportamento habilitado foi conferido na
prévia isolada descrita acima. Nenhuma chave real foi incluída nesses builds.

A suíte completa passou novamente (**116/116**), assim como scanner da fonte
(194 arquivos), referências dos 26 documentos e whitespace do diff. Persistiram
avisos de tempo dos plugins, resolução externa Nitro e timeout de ícones no
prerender público; não houve falha de build. CI/E2E do novo commit devem ser
conferidos no PR. Os resultados locais não ativam o CAPTCHA no servidor nem
certificam o login de produção.
