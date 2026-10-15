# Estado operacional do Fluxo Atento

Registro factual em **15/10/2026**, substituindo o diagnóstico de 10/10.
Código nesta branch não é deploy de produção.

Pacote publicado para revisão no [PR #6](https://github.com/FLUXO-ATENTO/fluxo_atento_fullstack/pull/6),
em rascunho. Conferir os checks do commit mais recente antes de qualquer merge;
a publicação do PR não libera as integrações nem altera a produção.

| Área | Evidência / estado | Próximo aceite |
| --- | --- | --- |
| Site Netlify | Público e acessível; o novo link /acessar atingiu 404 no app ainda antigo | Correção preparada: links públicos usam /login/ até aceite da nova entrada; publicar somente após revisão |
| Dashboard VPS | HTTPS, login e monitor real verificados | Nova interface ainda não publicada |
| API Node /v1 | Health e monitor persistido operantes | Duas contas e cenários de falha/expiração |
| Supabase | Auth, tenants e dados usados no produto | Advisors atuais sem permissão pelo conector; auditoria não concluída |
| Superadmin | Consulta administrativa real já validada | Templates, módulos e quotas comerciais ainda pendentes |
| Login Google/GitHub | Google autenticou a conta escolhida pelo proprietário no app local; nome, empresa, sessão após recarga e bloqueio visual de /admin confirmados; retorno temporário removido; GitHub desligado | Aceite HTTPS e duas contas, cancelamento/expiração e publicação da interface; login da VPS ainda sem botão Google |
| Turnstile | Widget Fluxo Atento — Autenticação criado no Cloudflare, gerenciado, restrito ao app e sem pré-liberação; frontend e envio captchaToken preparados | Deploy da interface/CSP, segredo e ativação no Supabase, teste real HTTPS; não está protegendo a produção ainda |
| Google de dados | Frontend + backend OAuth em revisão, desligados por padrão; 17 testes PostgreSQL aprovados | Cliente de dados, configuração externa e OAuth real HTTPS; ainda sem relatórios |
| Console Google | Projeto adotado Fluxo - Google Integration (`empirical-envoy-508802-k0`); cliente de login criado, 28 APIs listadas | Analytics Admin/Data, Search Console e PageSpeed ausentes; branding ainda Fluxo de Clientes. Os 82 serviços vistos pertenciam ao projeto anterior |
| Meta/WABA | Sem conexão de negócio aceita de ponta a ponta | Consentimento, fontes, sincronização e revisão |
| Agente IA | Serviço Python existente; chave válida na consulta de modelos | Resposta de bloqueio não prova análise; chat/BFF pendentes |
| Suporte | Ajuda contextual e orientação na interface | Chat persistente, anexos, áudio e notificações ainda não conectados |
| Planos/licenciamento | Proposta de capacidades | Sem cobrança/quotas comerciais completas |
| Docs/agente | /docs com 12 guias pesquisáveis e /agente público preparados | Subdomínios, TLS, documentos privados e chat real pendentes |
| n8n/Portainer | Inventário e interfaces vistos | n8n adiado, sem projeto/pasta/contratação |

## Esta revisão

### Continuidade: validação do banco

Foi adicionada a suíte [Database isolation](DATABASE_VALIDATION.md), com
PostgreSQL 17 descartável no GitHub e sem credenciais do produto. Testa migrações,
grants explícitos/legados, RLS de duas empresas, RPCs privadas e concorrência.
O [check executado](https://github.com/FLUXO-ATENTO/fluxo_atento_fullstack/actions/runs/38800297609)
passou com **17/17 testes**, sem pulados, em PostgreSQL 17.11 no commit `368de636`.
A migração
Google pendente foi ajustada para retirar permissões legadas excessivas também
do serviço interno, mantendo configuração sem exclusão e auditoria append-only.

Local e [CI completo](https://github.com/FLUXO-ATENTO/fluxo_atento_fullstack/actions/runs/38800297483):
104 testes unitários/contrato aprovados; scanner, tipos, builds de site/dashboard,
E2E público e referências dos Docs aprovados no commit `368de636`.
Não há PostgreSQL/Docker local disponível nesta sessão;
nenhum teste foi redirecionado ao banco de produção. O conector Supabase segue
recusando consultas por permissão.

O cliente Google antigo recebeu uma tentativa autorizada de inclusão do callback;
a persistência dessa tentativa segue não confirmada. Depois, o proprietário adotou
**Fluxo - Google Integration** e autorizou um novo cliente **Fluxo Atento - Login**,
cuja criação foi confirmada. O cliente preexistente Fluxo de Clientes foi preservado.
A nova credencial foi inserida e salva pelo proprietário no Supabase. A releitura
do provedor confirmou Google habilitado, ID do cliente correto e as opções
`Skip nonce checks` / `Allow users without an email` desligadas. O segredo não
foi revelado. Site URL e os dois retornos de produção estão corretos.
O proprietário concluiu a escolha e o consentimento Google. O SDK real retornou
ao painel local, que mostrou o nome do perfil, a empresa inicial e o papel de
responsável pela empresa. A sessão persistiu após recarga. O acesso direto a
`/admin` mostrou a mensagem de acesso reservado, sem conteúdo administrativo.
Esse teste não promoveu a conta ao superadmin nem alterou permissões. Não
substitui teste de duas identidades nem uma tentativa direta contra a API.
O retorno temporário `http://127.0.0.1:4175/auth/callback` foi removido ao concluir;
a UI confirmou **Total URLs: 2**, mantendo callback e recuperação de produção.
Ver [GOOGLE_SETUP](GOOGLE_SETUP.md). `/login/` publicado na VPS continua na
versão anterior, sem botão Google: aceite local não é publicação em HTTPS.
Nenhuma alteração de faturamento, IAM, APIs de dados ou revogação de chave antiga.

### Correção do botão Entrar e compatibilidade de publicação

O proprietário reportou 404 em
`https://app.fluxoatento.com.br/acessar?next=%2F&origem=site`. A inspeção confirmou
a resposta Nginx nessa rota e a tela de login existente em `/login/`. A nova
entrada estava preparada na branch, mas não publicada no dashboard da VPS.
O site raiz inspecionado também ainda mostrava a interface anterior; não foi
confirmado que a origem do clique era o último deploy público, e não uma prévia.

Correção nesta branch: o helper comum dos links de site, docs e agente usa
`/login/?next=%2F&origem=...` por padrão. Novas rotas de módulos não são encaminhadas
à versão antiga. Depois do deploy e aceite do dashboard, definir
`NUXT_PUBLIC_DASHBOARD_ENTRY_MODE=guided` no build do site e reconstruí-lo para
ativar `/acessar` e os destinos específicos. O dashboard desta revisão mantém
a entrada guiada local. Isso não altera DNS, cookies, credenciais ou privilégios.
Procedimento, aceite e rollback: [AUTH_ONBOARDING](AUTH_ONBOARDING.md).
Não houve deploy nem correção direta do Nginx nesta continuidade; o 404 público
permanece até a publicação aprovada. O caminho de acesso atual é `/login/`.

### Proteção Turnstile

O adicional de Turnstile usa o mecanismo nativo do Supabase para ações por
e-mail, sem duplicar validação em Edge Function. Expiração/erro/uso do token
exigem nova verificação; chave secreta não pertence ao build. A exigência no
Supabase **não foi ligada**, porque a versão publicada do dashboard é anterior.
Configuração, aceite, limites do OAuth e rollback em
[TURNSTILE_SETUP](TURNSTILE_SETUP.md). O widget IDGate preexistente foi preservado.

Validação local final deste adicional: **116/116** testes unitários/contrato,
tipos e builds sequenciais de site/dashboard aprovados; scanners de 194 arquivos
de fonte e 174/90 arquivos gerados sem padrões privados detectados; referências
em 26 documentos aprovadas. QA isolado conferiu sucesso, falha, nova tentativa,
cadastro/recuperação fictícios, temas e mobile. Os builds concluíram com avisos
registrados em [VALIDATION](VALIDATION_2026-10-15.md). Conferir CI do commit
mais recente; nenhuma dessas verificações substitui o aceite HTTPS com Auth real.

### Pacote anterior

Navegação empresa/plataforma separada, tour de três passos, Home orientada,
Ctrl+K, perfil, temas claro/escuro/sistema, ajuda oficial, docs públicos e rotas
legais iniciais. CTAs distinguem exemplo e painel.

Preferências de paleta por conta: marca padrão, Oceano, Botânico, Violeta e duas
cores personalizadas. Persistência no perfil validada com fixture, sem usar
metadados como autorização. A marca do site e as cores semânticas não mudam.

Entrada comum /acessar para site, agente e docs, com cinco segundos **visíveis**,
pausa e ação imediata. A prévia confirmou pausa e chegada a /canais mantendo a
sessão fictícia. Os controles aguardam a inicialização antes de aceitar cliques.

Nome vem do perfil; destino pós-login usa papel confirmado pela API. Painel
de empresa não oferece alternância ao superadmin. Botões Google/GitHub têm
portão de configuração; Facebook fica somente como integração.

IA, suporte e notificações indicam claramente conexão pendente. Visitar páginas
não finge conclusão de onboarding. Não há PageSpeed público, memória do copiloto
nem integração de campanhas implementados nesta entrega.

Google tem uma área própria em Provedores globais e em Integrações da empresa.
O backend prepara consentimento de leitura, estados temporários de uso único,
renovação, tokens criptografados e descoberta de propriedades/sites. O aceite
real ainda não ocorreu. Clientes OAuth separados no mesmo projeto não isolam
revogação; a confirmação informa o possível impacto em outras autorizações.

Regras em AGENTS.md, duas skills e quatro agentes especializados orientam
implementação, segurança, UI e documentação. O workflow de docs verifica links
e impacto por área; não inventa textos nem publica sozinho. Ver
[operação dos agentes](AGENT_OPERATIONS.md), [evolução dos docs](DOCS_PROCESS.md)
e [configuração Google](GOOGLE_SETUP.md).

## Segurança inspecionada

Netlify: somente URL/chave publicável Supabase no site, nenhuma variável no
projeto legado do app e nenhuma compartilhada da equipe. Novos bloqueios verificam
nomes/tipos de variáveis públicas, fonte e artefatos de build.

Auditoria delimitada: 77 arquivos públicos do site, 43 do dashboard e 177 versões
do histórico Git recuperado, sem padrões reconhecidos de credenciais privadas.
Não cobre todos os segredos possíveis, logs, builds antigos ou o ambiente da VPS.
Detalhes em [SECURITY_CREDENTIALS](SECURITY_CREDENTIALS.md).

## Limites da evidência

Teste de produção anterior: usuário existente autenticou, consultou/criou monitor,
recebeu HTTP 200 e viu resultado persistido após reload. Não comprova cadastro,
recuperação por e-mail, isolamento de dois tenants ou capacidade em escala.

Prévia de frontend usa conta fictícia e banner explícito. As [evidências locais
e seus limites](VALIDATION_2026-10-15.md) registram builds, testes e inspeção de
interface; o resultado do CI deve acompanhar o PR. O [checklist](LAUNCH_CHECKLIST.md) exige
também backup restaurado, permissões, entrega de e-mail e revisão jurídica.

Nesta revisão não houve alteração de senha, rotação de chave, contratação,
deploy de produção nem criação de DNS docs/agente.
