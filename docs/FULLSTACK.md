# Full stack — primeira entrega verificável

## Fonte canônica e estado

GitHub é a fonte do código, contratos, migrações e evidências. Nenhuma credencial pertence ao repositório.
O código nesta branch prepara a integração; não afirma que uma revisão foi instalada na VPS.
O resultado dos testes e os bloqueios de ativação são registrados em VALIDATION.md.

## Responsabilidades

| Camada | Responsabilidade | Limite |
| --- | --- | --- |
| Nuxt / Netlify | Site estático, autenticação no cliente, dashboard | Não executa verificações nem guarda chave administrativa |
| Supabase Auth | Cadastro, confirmação, login, recuperação e validação do usuário | Não equivale a autorização sobre todos os dados |
| Supabase Postgres | Monitores e resultados, RLS e integridade entre proprietário e monitor | Contas individuais nesta etapa; equipes ainda não habilitadas |
| VPS / monitor-api | Valida token, aplica limites, consulta HTTP e grava resultado | Não faz compras, envios, automação de navegador ou mudanças no site consultado |
| VPS / Agent Runtime | Serviço existente e independente | Não é usado como substituto de um verificador HTTP |

Em 10/10/2026, o OpenAPI público da VPS listava GET /health e POST /agent/run, /agent/stream e /agent/resume.
O contrato expõe um cabeçalho authorization, mas isso não prova como o token é validado no código do serviço existente.
Não foram executadas chamadas de agentes, aprovações ou ações com custos para inspecionar esse contrato.

## Fluxo entregue no código

1. /login autentica diretamente com Supabase; PKCE para links de confirmação e recuperação.
2. /dashboard exige sessão no cliente. Esse bloqueio é de navegação; a segurança está no backend e no banco.
3. A API valida o bearer com Supabase getUser e obtém o user_id. Não aceita identidade no corpo da requisição.
4. GET lê com o token do usuário e RLS. Escritas usam chave exclusivamente de servidor, sempre vinculadas ao usuário verificado.
5. Cadastro valida URL e DNS. O banco limita atomicamente a duas páginas de um mesmo hostname por conta.
6. Verificar agora faz HEAD com DNS fixado no socket, timeout, redirects validados e limites de concorrência.
7. Resultados são gravados pela VPS, não pelo navegador. O dashboard mostra status, horário, duração e histórico recente.
8. Sair ou trocar de usuário limpa os dados em memória e cancela solicitações pendentes.

A demonstração está em /exemplo e não acessa a API. Erro de produção nunca faz fallback para dados ilustrativos.

## Contrato de monitoramento v1

| Método / rota | Entrada | Saída |
| --- | --- | --- |
| GET /v1/health | pública | status, service, contract |
| GET /v1/monitors | bearer do usuário | monitors com até cinco checks recentes por página |
| POST /v1/monitors | { url } | id; HTTP 201 |
| PATCH /v1/monitors/:id | { enabled } | id |
| POST /v1/monitors/:id/check | bearer; sem URL arbitrária | check salvo |

Erros têm { error: { code, message } }. 401 sessão inválida; 403 origem não autorizada;
404 rota/monitor não disponível; 409 duplicado/limite/pausa; 429 limite temporal; 503 indisponibilidade.
Não há repetição automática de operações de escrita. Nova tentativa é uma ação explícita.

## Configuração e ativação

### Netlify

Build: pnpm generate; publicação: dist; Node 22. As variáveis públicas precisam estar no escopo Builds e no contexto correto.
NUXT_PUBLIC_SUPABASE_URL e NUXT_PUBLIC_SUPABASE_KEY já foram informadas como cadastradas pelo responsável.
NUXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY é uma alternativa, com prioridade sobre KEY.
NUXT_PUBLIC_API_BASE deve apontar para https://api.fluxoatento.com.br.
Somente chave sb_publishable_ ou anon legada. Nunca service_role, sb_secret_, senha Postgres ou chave de provedor.
Após mudar variáveis, gere novo deploy. Preview é público salvo proteção específica.

### Supabase

Revise/aplique a migração monitor_workspace. Ela cria objetos novos, sem migrar dados de outros sistemas.
Cadastre origens EXATAS de confiança nos Redirect URLs: /auth/callback e /recuperar-acesso em cada ambiente autorizado.
Não use wildcard para todos os previews. Para produção, configure SMTP e confirme entrega, limites e proteção contra abuso.
As tabelas não recebem dados de demonstração. Navegadores não têm INSERT, UPDATE, DELETE ou EXECUTE no criador de monitores.
SUPABASE_SECRET_KEY só será cadastrada no ambiente privado da VPS. O código não necessita JWT signing secret.
Vault pode guardar segredos utilizados pelo banco; isso não injeta segredos automaticamente no processo da VPS.
Não é necessária Edge Function para este fluxo.

### VPS — implantação pendente de acesso e revisão

Preserve Nginx, Uvicorn, n8n, Redis e Portainer existentes. Não substitua a configuração nem reinicie o servidor.
Use usuário de serviço sem privilégios e revisão Git específica em diretório próprio. Instale dependências pelo lockfile.
Guarde monitor.env fora do checkout, com permissão 0600 e dono do serviço. Não cole valores no chat.
O modelo ops/fluxo-monitor.service supõe Node em /usr/bin/node; confirme o caminho antes de instalar.
O processo ouve somente 127.0.0.1:8100. Inclua ops/nginx-monitor-location.conf dentro do bloco TLS da API.
Teste configuração e serviço antes do reload. /agent/* e /health permanecem no serviço original.
Verifique CORS apenas nas origens listadas e acrescente rate limiting no Nginx para /v1/, inclusive antes de autenticar.

## O que ainda não é uma capacidade ativa

Agendamento, múltiplos membros, cobrança, WhatsApp, email marketing, análises de formulário/pixel, seis módulos avançados,
política automática de retenção e execução de agentes em nome do usuário. Propostas comerciais não habilitam esses recursos.
Uma resposta HTTP 200 não demonstra que uma compra ou formulário funciona.

## Referências consultadas

- https://supabase.com/docs/guides/auth/passwords
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://docs.netlify.com/manage/routing/headers/
- https://docs.netlify.com/build/configure-builds/file-based-configuration/
