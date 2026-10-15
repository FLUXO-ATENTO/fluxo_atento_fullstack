# Estado operacional do Fluxo Atento

Registro factual em **15/10/2026**, atualizado após a publicação autorizada.
O proprietário fez merge do [PR #6](https://github.com/FLUXO-ATENTO/fluxo_atento_fullstack/pull/6)
às 19h50 BRT. O commit `5721c716501aea4ed2074b609b9b78108f7db7d6` foi publicado
no site pelo Netlify e, com autorização operacional separada, no dashboard da VPS.
O primeiro aceite de navegador falhou e a versão anterior foi restaurada;
após corrigir os hashes CSP, a publicação foi repetida e a interface abriu.
Registro, limites e rollback em [DEPLOYMENT_2026-10-15](DEPLOYMENT_2026-10-15.md).
Merge e publicação da interface não ativam integrações ou CAPTCHA.

| Área | Evidência / estado | Próximo aceite |
| --- | --- | --- |
| Site Netlify | Commit do merge publicado automaticamente; Entrar usa /login/ e não apresentou 404 no teste | Modo guided ainda não ativado no site; manter a separação entre publicação e aceite completo |
| Dashboard VPS | Nova interface publicada; login com botão Google, sessão existente, consulta de monitor e Superadmin verificados por HTTPS | Aceite OAuth novo em HTTPS, duas contas, cadastro/recuperação e regressões de hidratação |
| API Node /v1 | Health e monitor persistido operantes | Duas contas e cenários de falha/expiração |
| Supabase | Auth, tenants e dados usados no produto | Advisors atuais sem permissão pelo conector; auditoria não concluída |
| Superadmin | Consulta administrativa real já validada | Templates, módulos e quotas comerciais ainda pendentes |
| Login Google/GitHub | Google já validado com uma conta na prévia local; botão publicado na VPS com authProviders=google; sessão existente do app preservada; GitHub desligado | Nova troca OAuth em HTTPS e duas contas, cancelamento/expiração; botão visível não comprova esse aceite |
| Turnstile | Código publicado, mas flag da UI false; widget criado e segredo não instalado nesta operação; Supabase não alterado | Homologação negativa, flag/chave pública/CSP Cloudflare, segredo e ativação coordenada; produção ainda não protegida pelo CAPTCHA |
| Google de dados | Código OAuth incorporado no merge; frontend publicado, backend de integração não implantado nesta janela; recurso desligado; 17 testes PostgreSQL aprovados | Cliente de dados, configuração externa e OAuth real HTTPS; ainda sem relatórios |
| Console Google | Projeto adotado Fluxo - Google Integration (`empirical-envoy-508802-k0`); cliente de login criado, 28 APIs listadas | Analytics Admin/Data, Search Console e PageSpeed ausentes; branding ainda Fluxo de Clientes. Os 82 serviços vistos pertenciam ao projeto anterior |
| Meta/WABA | Sem conexão de negócio aceita de ponta a ponta | Consentimento, fontes, sincronização e revisão |
| Agente IA | Serviço Python existente; chave válida na consulta de modelos | Resposta de bloqueio não prova análise; chat/BFF pendentes |
| Suporte | Ajuda contextual e orientação na interface | Chat persistente, anexos, áudio e notificações ainda não conectados |
| Planos/licenciamento | Proposta de capacidades | Sem cobrança/quotas comerciais completas |
| Docs/agente | Rotas públicas /docs e /agente incluídas no deploy Netlify do merge | Rever avisos editoriais após publicação; subdomínios, TLS, documentos privados e chat real pendentes |
| n8n/Portainer | Inventário e interfaces vistos | n8n adiado, sem projeto/pasta/contratação |

## Histórico da preparação do PR #6

As seções abaixo descrevem a preparação anterior ao merge. Afirmações de
"não publicado" nesse histórico são substituídas pelo quadro atual e pelo
registro de publicação acima; limites de integração e testes continuam válidos.

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

Durante a preparação do PR não houve deploy. A publicação autorizada posterior
está registrada acima. Não houve alteração de senha, rotação de chave,
contratação ou criação de DNS docs/agente nessa publicação.
