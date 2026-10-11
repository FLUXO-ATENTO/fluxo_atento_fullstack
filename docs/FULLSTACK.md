# Arquitetura e contratos do FLUXO

## Separação de responsabilidades

O site estático fica na Netlify. Dashboard e Super Admin são layouts e rotas distintos no app estático servido pelo Nginx da VPS. A mesma identidade Supabase abre o painel permitido; não há segunda senha nem autorização baseada em endereço de e-mail no código.

A separação de interface não é a fronteira de segurança. A API valida o token com Supabase getUser, consulta a tabela administrativa e resolve a associação ao tenant. O Postgres mantém RLS, grants restritos e referências compostas. Somente Super Admin tem visão global; administradores de tenant não são administradores da plataforma.

| Papel | Alcance |
| --- | --- |
| Super Admin | Console global, lista paginada de tenants, convites, permissões de membros, provedores e auditoria |
| Responsável do tenant | Dados do próprio tenant e configuração de conexões |
| Administrador do tenant | Dados do próprio tenant e configuração de conexões |
| Membro | Operação e contatos do próprio tenant; sem controles globais/conexões |

A API não expõe uma operação para o usuário conceder a si mesmo o papel Super Admin. Nomeação global permanece procedimento operacional controlado. Abrir um tenant como Super Admin não personifica o usuário; a identidade administrativa é preservada.

## Sessões

/login é a entrada compartilhada. Sessão válida na origem do app é restaurada pelo cliente Supabase, e a API determina o destino: /admin ou painel de tenant. Voltar ao site não executa logout. Tokens nunca são colocados em URLs nem compartilhados com o domínio do site. Logout e mudança de identidade limpam estado; respostas de contexto antigo são descartadas.

Isso segue o modelo de [sessões e renovação do Supabase](https://supabase.com/docs/guides/auth/sessions). Persistência não significa ignorar expiração, revogação ou exigir menos proteção para administradores.

## Banco de contatos e histórico

- contacts representa o cadastro de uma pessoa dentro de um tenant.
- contact_identities normaliza e-mail e telefone E.164, com unicidade por tenant/tipo/valor.
- Cadastro repetido retorna o contato existente sem sobrescrever nome ou unir identidades silenciosamente. Identificadores pertencentes a contatos diferentes exigem revisão.
- conversations vincula contato e conexão ao mesmo tenant.
- messages usa chave idempotente por tenant/conexão/identificador externo, timestamps do provedor e recebimento, e texto sem renderização HTML.
- channel_sync_state reserva checkpoints de sincronização; não contém credenciais.
- platform_audit_events registra alterações administrativas de papel/status, sem corpos de mensagens ou segredos.

Referências compostas impedem associar mensagem, contato e conexão de empresas diferentes. Índices cobrem escopo, ordenação e relações. RLS e grants são complementares: [RLS Supabase](https://supabase.com/docs/guides/database/postgres/row-level-security), [constraints PostgreSQL](https://www.postgresql.org/docs/17/ddl-constraints.html).

Cadastro de contato não é opt-in de marketing. Antes de campanhas, implementar consentimento específico, origem, evidência e revogação.

## Contratos principais

Todas as rotas abaixo exigem bearer válido, exceto /v1/health. X-Fluxo-Tenant-Id é uma seleção sujeita à autorização, nunca uma permissão.

| Rota | Método | Resultado |
| --- | --- | --- |
| /v1/workspace | GET | Tenant ativo, associações e permissão global |
| /v1/admin/tenants?page=0 | GET | 25 tenants/página, total |
| /v1/admin/tenants/:id/members | GET | Até 100 membros com papel e e-mail |
| /v1/admin/tenants/:id/members/:userId | PATCH | Alteração transacional de papel, proteção do último owner e auditoria |
| /v1/admin/users | POST | Convite e tenant inicial idempotente |
| /v1/admin/providers | GET, POST | Metadados globais, registro pendente |
| /v1/admin/providers/:id | PATCH | Desativar ou devolver à configuração; não simula validação |
| /v1/admin/audit | GET | Últimas 100 alterações de papel/status |
| /v1/contacts?page=0 | GET | Contatos e identidades do tenant, 25/página |
| /v1/contacts | POST | Nome, e-mail/telefone normalizados; cadastro ou identificação de duplicata |
| /v1/contacts/:id/history?before=cursor | GET | Histórico armazenado, até 50 mensagens, paginação por cursor |
| /v1/integrations | GET, POST | Conexões do tenant; catálogo privado projetado sem referências de segredos |
| /v1/monitors | GET, POST | Páginas e verificações |
| /v1/monitors/:id | PATCH | Ativar/pausar página |
| /v1/monitors/:id/check | POST | Verificação HTTP limitada e persistida |

A API usa supabase-js por HTTPS. Não existe conexão Postgres direta na porta 6543 nesta implementação; configurar pool só passa a ser relevante se houver driver SQL direto. Não afirmar que REST está usando uma conexão de pooling mantida pelo processo Node.

## Recuperação de histórico externo

A consulta implementada recupera mensagens já persistidas. Não busca automaticamente mensagens antigas no WhatsApp ou em caixas de e-mail.

Para Gmail, sincronização inicial seguida de historyId; cursor expirado requer nova sincronização completa, conforme [documentação oficial](https://developers.google.com/workspace/gmail/api/guides/sync). SMTP envia mensagens, não recupera caixa postal. WhatsApp exige definição do produto e fluxo suportado antes de prometer importação.

O contrato futuro de webhook está em ../ops/WEBHOOKS.md: validar e persistir recebimento durável antes do ACK, processar fora da conexão HTTP, repetir com idempotência e não registrar payload sensível em logs.

## Limites de segurança

Ainda pendem MFA administrativo, proteção contra senhas vazadas, política de revogação imediata para ações sensíveis, auditoria de todos os acessos globais, retenção e testes de carga. A atualização endurece controles concretos, mas não é uma certificação de segurança.
