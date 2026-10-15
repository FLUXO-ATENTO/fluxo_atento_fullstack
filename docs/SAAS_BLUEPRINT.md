# Stack, integrações e jornada do Fluxo Atento

Decisões de produto consolidadas em 15/10/2026. Este é o desenho aprovado/proposto para implementação; não é uma declaração de que todas as integrações já estão operantes. Veja [STATUS.md](STATUS.md) para evidências e [LAUNCH_CHECKLIST.md](LAUNCH_CHECKLIST.md) para pendências.

## 1. Decisão central

Manter o repositório `FLUXO-ATENTO/fluxo_atento_fullstack`. Não criar um repositório por módulo, cliente, domínio ou provedor. Um monorepositório pode publicar site, documentação e dashboard separadamente.

O agente Python existente na VPS não deve ser copiado às cegas: localizar sua origem Git, verificar mudanças e licenciamento e só então decidir entre incorporá-lo a `services/agent-runtime` ou documentar uma dependência versionada. Hoje essa origem ainda precisa de confirmação. Não confundir o serviço do agente com a API Node de monitoramento.

Preservar Nuxt 4, Vue 3, Nuxt UI e Motion já presentes. Não migrar o produto para outro construtor, framework ou banco apenas para implementar a nova interface.

## 2. Quem comanda cada parte

| Camada | Responsabilidade | Não deve fazer |
| --- | --- | --- |
| Site público / Nuxt / Netlify | Apresentação, demonstração dedicada, consulta inicial e direcionamento ao app | Guardar segredos, simular resultado real ou prometer módulos inativos |
| Dashboard / Nuxt / VPS | Interface autenticada, escolha da empresa, integrações, relatórios, IA e suporte | Decidir sozinho quem é Superadmin ou qual plano permite uma ação |
| Supabase Auth | Identidade, sessão, confirmação, recuperação e login social quando configurado | Conceder automaticamente acesso a anúncios ou dados Google/Meta |
| Backend / VPS | Verificar sessão, vínculo com tenant, permissão e plano; consultar provedores, controlar custos e processar filas | Confiar em user_id, tenant_id, role ou preço enviados pelo navegador sem validação |
| Supabase Postgres / Storage | Histórico durável, resultados, vínculos, permissões e anexos privados | Expor dados de empresas diferentes ou tornar segredo acessível via chave publicável |
| Redis / filas | Cache, coordenação temporária, limites e entrega de trabalho | Ser a única memória do cliente ou a única cópia de resultados |
| Agente / OpenAI | Interpretar dados autorizados e sugerir próximos passos; executar só ferramentas permitidas | Inventar métricas, elevar permissões ou fazer campanhas/pagamentos sem confirmação |
| Superadmin | Configurar provedores globais, planos e operação da plataforma | Usar uma senha universal ou compartilhar credenciais com tenants |
| Admin da empresa | Autorizar suas próprias contas e operar recursos do plano | Criar um aplicativo global Google/Meta para cada nova empresa |

Autenticar é identificar a pessoa. Autorizar é decidir quais dados e ações ela pode acessar. Os dois controles são necessários.

## 3. Jornada alvo: primeiro valor antes do login

```text
Site → endereço público → consulta determinística → resultado e limitações
                                                     ↓ escolha explícita
                             Continuar no painel OU Conversar com especialista IA
                                                     ↓
                                    Login central / Supabase Auth
                                                     ↓
                          Vínculo com tenant + permissão + plano + limite
                                                     ↓
                         Retomar resultado → autorizar contas quando necessário
                                                     ↓
                           Análise / copiloto com contexto e histórico durável
```

### Consulta pública: decisão confirmada pelo responsável

- Setor imediatamente abaixo do hero; campo de endereço, explicação curta e botão “Consultar meu site”.
- Primeira fonte Google: PageSpeed Insights / Lighthouse público. Search Console somente depois de conectar a conta.
- Não chamar OpenAI, não consumir respostas de IA do plano e não executar agente nesta etapa.
- Código transforma a resposta da API em dados legíveis. Não inventar uma “nota Fluxo” ou confundir nota Lighthouse com vendas, segurança completa, posição no Google ou desempenho real de todos os usuários.
- Exibir URL consultada, fonte, data, estratégia mobile/desktop, valores ausentes, falhas e condição de cache. Dados de laboratório são estimativas e variam.
- Resposta HTTP e duração da consulta HEAD não são o tempo de carregamento visual da página. Exibir medidas separadas.
- A ausência de CrUX não significa nota zero. Não depender de CrUX embutido no PageSpeed: o Google recomenda APIs próprias de CrUX para esse dado.
- Não testar áreas logadas, compras, formulários nem publicar mudanças no site consultado.
- Só oferecer resultado real após resposta real. Em erro/cota esgotada, mostrar indisponibilidade e próxima ação, nunca trocar silenciosamente por exemplo.
- Avisar que a URL pública será enviada ao Google. Rejeitar credenciais, dados pessoais em query, IPs, hosts privados e destinos inseguros.
- Oferecer “Continuar no dashboard” e “Conversar com o especialista IA” junto ao resultado, sem obrigar cadastro para ler a primeira entrega.

### Custo e proteção

“Grátis para o visitante” não significa infraestrutura gratuita nem uso ilimitado. Há custos de servidor, banco, tráfego, logs, armazenamento e operação, mesmo sem IA. Confirmar cota e condições do projeto Google no console antes da ativação; não prometer quantidade ilimitada ou preço fixo com base em uma suposição.

Configuração inicial proposta, ainda não aplicada: cache de 24 horas por URL normalizada + estratégia + versão de análise; uma execução concorrente por visitante; limite global e por origem de abuso; teto diário de chamadas e interruptor operacional. Os números finais precisam ser confrontados com a cota real. Cache deve exibir a data original e nunca misturar resultados privados de clientes.

CORS não impede abuso de clientes fora do navegador. Exigir proteção no backend: timeout, payload e resposta limitados, concorrência, rate limit com identidade de rede confiável, fila, deduplicação e desafio antiabuso quando necessário. Não confiar em cabeçalhos de IP arbitrários. Não usar slider visual como CAPTCHA.

Reutilizar a validação de destinos do monitor existente. O backend chama o endpoint fixo do Google, nunca uma URL arbitrária de “provedor” enviada pelo visitante. Consultas de páginas pela VPS precisam manter DNS validado e fixado no socket, bloqueio de rede privada e validação a cada redirecionamento.

### Continuidade e persistência

A transferência do resultado para o app ainda precisa ser implementada. Não basta enviar a URL no botão nem gravar estado somente no navegador.

1. Backend cria um registro mínimo da consulta, com prazo de expiração, origem, versão, URL normalizada e resultado tratado.
2. O visitante recebe um comprovante opaco, curto em duração e de uso único; não um JWT de sessão ou chave de provedor na URL.
3. Após o login no app, o backend valida usuário e empresa e associa o resultado uma única vez, em operação atômica.
4. Troca de empresa, expiração, repetição e tentativa de resgate por outra sessão devem ser testadas. Não associar registros apenas porque o e-mail ou a URL coincidem.
5. Sem login, eliminar consultas abandonadas conforme política publicada. Com login, aplicar retenção por categoria e permitir exclusão/exportação.
6. Supabase é a fonte durável; Redis é cache/fila. Eventos realtime notificam mudanças, mas reconectar sempre recupera o histórico.
7. O agente encontra objetivos, etapas, conexões, análises e ações anteriores, com datas e fontes. Separar fatos, preferências e inferências da IA.

Não usar cookies amplos de domínio ou tokens em links como atalho para SSO. O site público pode funcionar sem sessão; o app centraliza a autenticação e retoma a intenção.

## 4. Mapa canônico de rotas e domínios

| Endereço | Finalidade | Situação / decisão |
| --- | --- | --- |
| `fluxoatento.com.br/` | Apresentação e consulta pública abaixo do hero | Site ativo; consulta PageSpeed ainda pendente |
| `fluxoatento.com.br/como-funciona` | Página de produto compartilhável e demonstração guiada | Rota existe; reorganização necessária |
| `fluxoatento.com.br/exemplo` | Sandbox ilustrativo, explicitamente marcado | Manter enquanto houver links antigos |
| `app.fluxoatento.com.br/login` | Entrada única real | Acesso validado com conta existente |
| `app.fluxoatento.com.br/` | Painel da empresa | Base ativa; nova UI ainda local |
| `app.fluxoatento.com.br/admin` | Administração da plataforma | Exige papel global validado no servidor |
| `api.fluxoatento.com.br` | API da plataforma e futuros callbacks/webhooks | API de monitoramento ativa |
| `agente.fluxoatento.com.br` | Entrada dedicada do especialista IA | Domínio confirmado pelo responsável; publicação, DNS e acesso autenticado ainda pendentes |
| `flow.fluxoatento.com.br` | n8n para automação interna | Existente; evolução explicitamente adiada para depois do site/dashboard |
| `infra.fluxoatento.com.br` | Portainer para operação da VPS | Existente, acesso administrativo; não é área dos tenants |
| `fluxoatento.com.br/docs` | Rota de transição para manual público | Implementada nesta revisão, ainda não publicada |
| `docs.fluxoatento.com.br` | Domínio desejado para a documentação | DNS autorizado pelo usuário; destino/publicação precisam ser preparados antes |
| `fluxoatento.com.br/privacy` | Política de privacidade pública | Conteúdo atual insuficiente para lançamento |
| `fluxoatento.com.br/terms` | Termos públicos | Conteúdo atual é placeholder |
| `fluxoatento.com.br/exclusao-de-dados` | Orientações públicas para exclusão | A implementar; não confundir com callback técnico |
| `fluxoatento.com.br/contato` | Canal e contato do responsável | Hoje só prepara texto; atualizar com contato autorizado |
| `status.fluxoatento.com.br` | Incidentes e disponibilidade | Opcional futuro, idealmente externo à VPS |
| `auth.fluxoatento.com.br` | Domínio personalizado do Supabase Auth | Opcional, depende de suporte/plano; não é requisito para lançar |

Não criar `admin.`, `google.`, `meta.` nem um subdomínio por oferta. Rotas e autorização são suficientes. Não expor terminal, Portainer ou consoles administrativos como páginas públicas.

### Regras de navegação

- “Ver demonstração” aponta para `/como-funciona`, nunca para login disfarçado.
- “Entrar” e “Abrir meu painel” apontam para o app real.
- “Consultar meu site” aponta para o setor real de consulta, quando ativado.
- Docs oferece “Voltar ao site” e “Abrir meu painel”; o app oferece ajuda contextual e documentação.
- Prévia do dashboard reutiliza a linguagem visual real, com conta fictícia e dados identificados. Não capturar informações pessoais de produção para marketing.
- Preservar links compartilhados e âncoras úteis; mapear redirecionamentos antes de remover rotas antigas.
- Configurar endereço de Docs por ambiente; não distribuir links para um subdomínio ainda sem certificado/publicação.

### Publicação de Docs

Recomendação: conteúdo público no mesmo GitHub, publicação Netlify própria para Docs, sem segredos no build. Isso isola layout, versão e deploy sem criar outro repositório. É necessário preparar o artefato, vincular domínio no projeto de destino, criar/verificar DNS, emitir TLS e testar raiz, artigo, recarga direta e retorno ao app. Um registro DNS sozinho não entrega documentação. Não alterar apex, www, app ou registros de e-mail para isso.

### Público, autenticado e administrativo

| Ambiente | Sem login | Com sessão válida | Autorização adicional |
| --- | --- | --- | --- |
| Site / demonstração / termos | Conteúdo público e exemplos claramente identificados | Não é necessário manter sessão no site | Consulta pública limitada, sem IA |
| Agente | Apresentação estática e explicação do que pode fazer | Toda solicitação real passa pelo backend | Tenant ativo, permissão, plano, quota e consentimento para a ferramenta |
| Dashboard | Tela de entrada e recuperação | Dados da empresa autorizada | Papel dentro do tenant; Superadmin é papel global separado |
| Docs | Manual geral e integração pública | Conteúdo privado servido somente após autorização | Empresa, função e classificação do documento |
| Suporte | Orientações e contato público | Conversa vinculada à empresa e ao usuário | Suporte humano não concede papel global nem acesso a outras empresas |
| n8n / Portainer | Tela de entrada administrativa | Acesso só para operadores explicitamente autorizados | Contas administrativas separadas, MFA/restrição de rede a verificar |

O mesmo projeto Supabase não compartilha localStorage entre subdomínios. Mesmo domínio-base também não faz SSO automaticamente. O MVP pode centralizar a sessão em app.fluxoatento.com.br: agente é uma entrada dedicada que encaminha a intenção ao app e retoma a conversa após login, sem solicitar senha novamente quando a sessão do app já existe. Se a conversa precisar permanecer no domínio agente, implementar troca de código de uso único, curta duração, audiência/destino fixos, vínculo com a transação e validação no servidor. Testar replay, troca de tenant, logout e expiração antes de anunciar SSO.

Nunca passar access_token, refresh_token ou credencial de provedor em query/hash entre domínios. Não criar cookie amplo para toda a zona, pois flow e infra são superfícies administrativas diferentes. Retornos de login têm lista permitida; não aceitar qualquer next externo.

Documentação privada não pode estar no repositório público, no diretório public, no HTML pré-gerado, em JSON de payload, source maps, busca pública ou CDN compartilhada. Esconder o menu não protege o conteúdo. Usar API/Storage privado com autorização no servidor, no-store e acesso por empresa; o build estático contém apenas a estrutura pública.

Acesso pronto para entrar no painel exige identidade verificada e vínculo válido com empresa. Acesso a uma função exige também permissão e disponibilidade real. Mostrar estados compreensíveis: entre na conta, confirme o e-mail quando exigido, conclua o cadastro da empresa, peça acesso, conecte a conta, aguarde a sincronização, limite atingido. Não cobrar nem conceder função administrativa automaticamente.

## 5. Credenciais: o que criar e onde guardar

Nomes de variáveis abaixo são contratos propostos quando não existem no código atual, não prova de integração implementada. Nunca colar valores em issues, PRs, documentação, chat ou variáveis públicas.

| Função | O que a plataforma precisa | Onde fica | O cliente faz |
| --- | --- | --- | --- |
| Login Supabase | URL e chave publicável; credencial de servidor já existente para operações administrativas | Publicáveis no Nuxt; segredo só no backend | Cria conta, confirma e entra |
| Login Google opcional | Cliente OAuth web: ID + segredo, consentimento e callback correto | Provedor Google do Supabase Auth | Escolhe entrar com Google |
| PageSpeed público | Projeto Google, API habilitada e chave restrita para uso controlado | `GOOGLE_PAGESPEED_API_KEY` no backend | Informa URL pública; não entrega chave |
| Search Console | API habilitada e cliente OAuth de integrações; permissão de leitura | ID/segredo no backend; tokens por tenant protegidos | Autoriza e escolhe propriedade que pode acessar |
| GA4 | Analytics Data API; Admin API se necessária para seleção de propriedades; OAuth | Backend e conexão por tenant | Autoriza e escolhe propriedade GA4 |
| Google Ads | API habilitada, OAuth e nível de acesso Google Cloud adequado a produção | Backend; conta selecionada por tenant | Autoriza conta de anúncios |
| Meta Ads / leitura | Aplicativo Meta, OAuth e permissões mínimas aprovadas para o caso | App secret no backend; tokens por tenant | Autoriza ativos e conta de anúncios |
| WhatsApp / WABA | App e configuração de onboarding, canal/telefone, webhooks verificados | Backend e vínculo por tenant | Autoriza sua empresa, número e ativos |
| Meta Conversions API | Configuração própria de envio de eventos e credencial correspondente | Somente backend | Autoriza mensuração e configura origem/consentimento |
| Copiloto OpenAI | Chave de projeto já existente autorizada para reutilização | Serviço privado da VPS | Usa recurso permitido no plano; não cadastra chave global |
| E-mail de autenticação | SMTP transacional e domínio remetente autenticado | Configuração SMTP do Supabase Auth | Recebe confirmação/recuperação |
| E-mail de campanhas | Provedor e credenciais de envio separados, opt-in, descadastro e reputação | Backend; escopo global/tenant explícito | Configura remetente e público permitido |
| Pagamentos | Conta no gateway, chaves de teste/produção e segredo de webhook específico | Backend/secret store | Contrata plano após cobrança realmente implementada |

No Superadmin, exibir provedor, ambiente, recursos habilitados, referência de segredo, teste, última validação e erro seguro. Não devolver segredos já salvos nem oferecer um formulário que grava segredo em arquivo público. Rotação e exclusão precisam de auditoria.

Os tenants normalmente autorizam o aplicativo da plataforma; não precisam desenvolver um app próprio. Login Google não autoriza GA4, Search Console ou Ads automaticamente.

### Atualização importante: Google Ads

A documentação atual informa que os developer tokens da Google Ads API foram descontinuados em 09/09/2026; o acesso passou a ser associado ao projeto Google Cloud das credenciais OAuth. Não usar uma checklist antiga que mande solicitar um novo developer token no API Center como requisito padrão deste SaaS. Conferir nível Test/Explorer/Basic/Standard e requisitos atuais no projeto selecionado. Esta mudança não elimina OAuth nem autorização da conta do cliente. A exceção documentada para App Conversion Tracking API não deve ser aplicada ao caso de leitura de campanhas.

Fontes: [mudança do developer token](https://developers.google.com/google-ads/api/docs/api-policy/developer-token), [níveis de acesso](https://developers.google.com/google-ads/api/docs/api-policy/access-levels).

### Supabase: a tela OAuth Server não é o conector Google

A área OAuth 2.1 Server transforma o Supabase em provedor de identidade para outros aplicativos. Não é necessário habilitá-la para o login convencional nem para conectar GA4/Search Console/Meta. Login Google é configurado no provedor Google do Auth. A conexão de dados é uma autorização de integração separada.

Fontes: [OAuth Server](https://supabase.com/docs/guides/auth/oauth-server), [login Google](https://supabase.com/docs/guides/auth/social-login/auth-google).

## 6. Escopo mínimo para colocar o produto em uso

1. Login, recuperação, isolamento entre duas empresas, monitor real e limites verificados.
2. Página de produto, rotas reais, políticas revisadas, contato e exclusão operacional.
3. Consulta pública PageSpeed determinística com limites e continuidade após login.
4. Search Console e GA4 em leitura; Meta Ads em leitura; Google Ads conforme acesso concedido.
5. Painéis com fonte/data/período e tratamento de dados ausentes. Nenhuma conversão/venda inferida de um HTTP 200.
6. Copiloto autenticado usando os mesmos dados autorizados, histórico durável e orçamento por empresa.
7. WABA, campanhas e cobrança somente após os fluxos básicos estarem estáveis.

Meta Marketing API para relatórios não é a Conversions API: a primeira consulta dados; a segunda envia eventos. Envio de eventos não faz parte do primeiro escopo “somente leitura”. WABA também é uma integração distinta. Validar as permissões/recursos atuais no App Dashboard do produto correto; regras de Meta Horizon/Quest não são prova de requisitos de Marketing API.

## 7. O que exige ação humana

- Selecionar/criar os projetos empresariais oficiais Google e Meta e manter propriedade/administração com a empresa.
- Fornecer informações públicas, concluir verificação empresarial/marca, validar domínio e aceitar contratos do provedor.
- Confirmar e inserir segredos diretamente nos ambientes apropriados, sem publicação no chat.
- Autorizar uma conta piloto real, com acesso legítimo às propriedades e anúncios. Não vincular a conta de um cliente sem permissão.
- Definir remetente transacional e confirmar que o e-mail de contato recebe solicitações; teste de envio precisa ser combinado.
- Aprovar políticas, retenção, descarte, termos, preços e condições de assinatura com responsáveis adequados.
- Revisar PR/CI e autorizar publicação de versões; cumprir governança antes de migrações e alterações de produção.

O agente de desenvolvimento pode preparar código, contratos, testes, runbooks, telas e documentos. Ele não pode garantir aprovação externa nem substituir titularidade/verificação ou consentimento do cliente.

## 8. Identificação e documentos públicos

Informações explicitamente autorizadas pelo responsável:
- Nome empresarial informado: **68.661.227 LEANDRO PASSOS DE SANT ANNA**.
- Responsável informado: **LEANDRO PASSOS DE SANT ANNA**.
- Contato público: **contato@fluxoatento.com.br**.

O prefixo numérico do nome não será apresentado como um CNPJ completo: não foram fornecidos os 14 dígitos. Não inventar identificação, endereço, prazo de atendimento, certificação, criptografia ponta a ponta ou política de retenção já aplicada.

Nesta revisão, termos e privacidade recebem uma versão inicial mais precisa e há instruções de exclusão. Permanecem pendentes revisão jurídica, prazos de retenção e procedimento operacional testado. A página de exclusão é acessível sem login, orienta verificação de titularidade e distingue desconectar provedor de apagar dados já importados.

Callbacks OAuth, desautorização e exclusão técnica são endpoints de backend com validação própria. Publicar uma página de instruções não implementa um callback. Não cadastrar endereços inventados no Google/Meta antes de testar o contrato implementado.

## 9. Operação e escala

“Milhões de tenants” é objetivo de arquitetura, não capacidade demonstrada da VPS atual. Exige teste de carga, filas, pools, índices, particionamento quando necessário, orçamento, limites por provedor, métricas por tenant e capacidade de recuperação.

Antes da abertura comercial: backup externo com restauração testada, alerta acionável, logs sem segredos, rastreio de jobs, política de manutenção, monitoramento de quotas e atualização de dependências. Subdomínios adicionais não resolvem escala nem isolamento.

n8n foi inventariado, mas não é prioridade atual. Não criar projeto/pasta nem contratar licença nesta etapa. Antes de usar workflows no produto, aplicar o contrato de automação descrito em [ASSETS.md](ASSETS.md) e as credenciais de [SECURITY_CREDENTIALS.md](SECURITY_CREDENTIALS.md).

## Referências técnicas

Consultadas em 15/10/2026; revisar novamente antes de ativar integrações:
- [PageSpeed: início e limitações de CrUX](https://developers.google.com/speed/docs/insights/v5/get-started)
- [PageSpeed: parâmetros e resposta](https://developers.google.com/speed/docs/insights/v5/reference/pagespeedapi/runpagespeed)
- [Search Console: autorização](https://developers.google.com/webmaster-tools/v1/how-tos/authorizing)
- [Search Console: visão geral e acesso à propriedade](https://developers.google.com/webmaster-tools/about)
- [GA4 Data API](https://developers.google.com/analytics/devguides/reporting/data/v1/quickstart-client-libraries)
- [Supabase: segurança e RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase: changelog](https://supabase.com/changelog)

Limite desta revisão: páginas técnicas específicas de Meta Marketing/Deletion não ficaram acessíveis pela consulta pública utilizada. Requisitos exatos de permissões e revisão devem ser confirmados no painel/documentação do app correto antes da submissão; não substituir por requisitos de VR/Quest.
