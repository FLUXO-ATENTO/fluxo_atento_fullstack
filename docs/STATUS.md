# Estado operacional do FLUXO

Registro em 10/10/2026, horário de Brasília; migrações após 21h usam 11/10 em UTC. Fonte autorizada: Supabase qbfmebpzxnzdpalmgtxr. O projeto Fluxo de Clientes não faz parte deste escopo.

## Situação atual

| Área | Evidência | Limite |
| --- | --- | --- |
| Dashboard na VPS | HTTPS e build estático ativo em app.fluxoatento.com.br | Nova interface Super Admin nesta revisão não foi publicada, conforme pedido final de atualizar apenas o Git |
| API na VPS | Serviço fluxo-monitor ativo, usuário dedicado, /v1/health disponível | Saúde do processo não comprova todos os conectores |
| Identidade | Conta administrativa confirmada e presente em platform_administrators | Senha existente preservada; nenhuma nova conta administrativa criada nesta revisão |
| Sessão e painel | Testes locais desktop/mobile passam: administrador, usuário comum, retorno site/app e logout | E2E usam respostas controladas, não a senha pessoal do responsável |
| Isolamento de banco | Testes SQL reais com tenants sintéticos e rollback passaram | Não equivale a auditoria independente ou certificação |
| Contatos e histórico | Schema aplicado; cadastro, deduplicação e consulta implementados na API/interface desta revisão | Backfill de provedores não implementado |
| WABA e SMTP | Catálogo e estados de configuração disponíveis | Não há prova de envio/recebimento real; não anunciar integração ativa |
| Segurança | RLS e testes de escalada/isolamento aprovados | Advisor indica proteção contra senhas vazadas desativada; MFA ainda precisa de implantação |
| Operação | Releases anteriores preservadas; publicação estática corrigida para carregar CSP por release | Backup restaurado, alertas e teste de carga ainda pendentes |
| Governança e estrutura | AGENTS, perfis de desenvolvimento/VPS, site map e inventário revisados nesta branch | Instruções não instalam processos nem conferem novas permissões |
| Próximas tarefas | 11 tarefas com ordem, função responsável e aceite em BACKLOG | Criação de issues no GitHub bloqueada por HTTP 403 da integração; nenhuma criada |

## Migrações realmente aplicadas

Histórico consultado no projeto autorizado, não inferido a partir de arquivos locais.

| Versão UTC | Nome | Efeito |
| --- | --- | --- |
| 20261010193511 | monitor_workspace | Monitores e verificações |
| 20261010235303 | tenant_workspace_and_omnichannel | Tenants, membros e provedores |
| 20261011000555 | tenant_rls_policy_and_indexes | Políticas e índices |
| 20261011013631 | superadmin_contacts_history | Autorização global controlada, contatos, identidades, conversas, mensagens, checkpoints e auditoria |
| 20261011014130 | channel_sync_fk_index | Índice da referência composta de sincronização |

As duas últimas migrações são aditivas. Não alteram senha nem removem dados existentes. Os testes de banco foram revertidos integralmente, sem envio de convites ou mensagens externas.

## Resultado de segurança

O teste tests/database/tenant-isolation.sql verificou: deduplicação interna, identificador igual permitido em empresas distintas, rejeição de fusão ambígua, RLS de contatos/mensagens, bloqueio de autoelevação, referências compostas, proteção do último proprietário, idempotência de mensagens e auditoria de mudança de papel.

A proteção contra senhas comprometidas exige configuração adicional no Auth, conforme disponibilidade do plano. Não foi alterada a senha existente. Referência: [segurança de senhas do Supabase](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

Os avisos de índices ainda sem uso não justificam removê-los em tabelas recém-criadas. O aviso de chave estrangeira sem cobertura foi corrigido com a segunda migração.

## Critérios que continuam abertos

- Revisar o PR e, em etapa autorizada posterior, publicar esta revisão preservando rollback.
- Validar com o responsável a entrada real com sua sessão, sem compartilhar senha.
- Implementar MFA administrativo e política de sessões sensíveis.
- Conectar e testar WABA/e-mail, fila durável, worker, assinaturas e recuperação de histórico.
- Definir consentimento, retenção, exclusão, backup/restauração e piloto antes do lançamento comercial.

A sequência detalhada fica em [BACKLOG.md](BACKLOG.md); os ativos além do
dashboard e lacunas do inventário ficam em [INFRASTRUCTURE.md](INFRASTRUCTURE.md).
O arquivo de exemplo da API foi corrigido para o projeto autorizado e o retorno
de convite para recuperação de senha. O env privado existente não foi regravado
como parte desta correção documental.
