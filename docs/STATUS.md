# Estado operacional do Fluxo Atento

Registro factual em **15/10/2026**, substituindo o diagnóstico de 10/10.
Código nesta branch não é deploy de produção.

Pacote publicado para revisão no [PR #6](https://github.com/FLUXO-ATENTO/fluxo_atento_fullstack/pull/6),
em rascunho. Conferir os checks do commit mais recente antes de qualquer merge;
a publicação do PR não libera as integrações nem altera a produção.

| Área | Evidência / estado | Próximo aceite |
| --- | --- | --- |
| Site Netlify | Público e acessível | Publicar links, temas e documentação revisados |
| Dashboard VPS | HTTPS, login e monitor real verificados | Nova interface ainda não publicada |
| API Node /v1 | Health e monitor persistido operantes | Duas contas e cenários de falha/expiração |
| Supabase | Auth, tenants e dados usados no produto | Advisors atuais sem permissão pelo conector; auditoria não concluída |
| Superadmin | Consulta administrativa real já validada | Templates, módulos e quotas comerciais ainda pendentes |
| Login Google/GitHub | Desabilitados no painel Supabase | Código preparado; apps, credenciais e testes pendentes |
| Google de dados | Frontend + backend OAuth implementados para revisão, desligados por padrão | Migração/RLS em banco isolado, configuração externa e OAuth real HTTPS; ainda sem relatórios |
| Console Google | 82 serviços observados; Analytics Admin, PageSpeed e BigQuery habilitados | Analytics Data/Search Console não constavam; detalhes OAuth/biblioteca com erro; não atribuir a billing sem diagnóstico |
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
O resultado funcional deve ser conferido no check do commit atual. A migração
Google pendente foi ajustada para retirar permissões legadas excessivas também
do serviço interno, mantendo configuração sem exclusão e auditoria append-only.

Local: 104 testes unitários/contrato aprovados; scanner de fonte e referências
dos Docs aprovados. Não há PostgreSQL/Docker local disponível nesta sessão;
nenhum teste foi redirecionado ao banco de produção. O conector Supabase segue
recusando consultas por permissão.

O cliente Google antigo foi identificado e recebeu uma tentativa autorizada de
inclusão do callback atual. O Console respondeu com erro; persistência ainda
não confirmada. Ver o registro em [GOOGLE_SETUP](GOOGLE_SETUP.md). Isso não libera
o botão de login e não altera segredos, faturamento ou APIs de dados.

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
