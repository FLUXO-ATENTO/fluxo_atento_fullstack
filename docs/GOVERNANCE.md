# Governança de implementação e operação

Revisão: 10/10/2026. Responsabilidades estão em [VPS_AGENT.md](VPS_AGENT.md);
fontes canônicas e revisão de todos os documentos em [DOCUMENTATION.md](DOCUMENTATION.md).
Esta política não concede autorização automática para intervenção em produção.

## Princípios obrigatórios

1. **Evidência antes de status.** Um item só é “funcionando” quando há teste
   executado no ambiente correspondente, resultado registrado e critério de
   aceite atendido.
2. **Segredos fora do Git.** O repositório contém nomes, contratos e exemplos;
   tokens, chaves privadas, senhas e configurações secretas ficam somente no
   provedor seguro que os consome.
3. **Menor privilégio.** Navegador usa chave publicável; VPS usa a credencial
   de servidor estritamente necessária; dados são isolados por RLS.
4. **Mudança reversível.** Toda alteração de banco, DNS, VPS e deploy deve ter
   alvo, validação, rollback e janela de observação definidos antes da execução.
5. **Produção não é laboratório.** Testes de contrato e falhas previsíveis
   ocorrem em ambiente controlado antes de envolver contas de clientes.
6. **Uma promessa por módulo.** Tela, plano comercial e proposta de produto
   devem indicar claramente se descrevem uma capacidade ativa ou planejada.

## Fluxo de mudança

```text
Problema ou objetivo
        ↓
Issue / decisão registrada
        ↓
PR de escopo único + testes + risco + rollback
        ↓
CI obrigatório
        ↓
Revisão humana
        ↓
Deploy controlado
        ↓
Teste de aceite no ambiente real
        ↓
Atualização de STATUS.md e evidência
```

## Requisitos de um PR

Todo PR deve declarar:

- objetivo e escopo excluído;
- sistemas afetados: frontend, Netlify, Supabase, VPS, DNS ou documentação;
- risco de segurança, privacidade e indisponibilidade;
- comandos/testes executados e seus resultados;
- critérios de aceite observáveis;
- plano de rollback;
- dependências externas ou decisões que ainda precisam de autorização.

PRs de infraestrutura devem separar, sempre que possível, a mudança de código
da execução em produção. A execução deve registrar data, ambiente, resultado e
qualquer desvio encontrado.

## Governança de ambientes

| Ambiente | Uso permitido | Proibido |
| --- | --- | --- |
| Local | desenvolvimento, testes unitários e E2E com dados controlados | segredos reais em arquivos versionados |
| Preview | revisão de interface e fluxo sem dados de cliente | chave administrativa, dados de produção sem autorização |
| Produção | clientes e dados reais, depois dos portões de aceite | testes destrutivos, mudanças sem rollback |

## Controle de dados e privacidade

- No monitoramento, coletar somente URL e resultados necessários. No CRM,
  coletar nome e identificadores de contato necessários; mensagens só devem
  entrar por conector autorizado com finalidade e retenção definidas.
- Não registrar corpos de páginas, mensagens, credenciais, tokens ou dados
  pessoais em logs operacionais. Conteúdo de conversas pertence às tabelas
  protegidas do tenant, não ao journald nem à auditoria administrativa.
- Definir retenção, exclusão, exportação e canal de atendimento ao titular
  antes de abrir o produto a clientes.
- Revisar os termos e a política de privacidade com responsável jurídico antes
  do lançamento comercial.

## Resposta a incidente

1. Conter: pausar a rota, serviço ou deploy afetado sem apagar evidências.
2. Preservar: registrar horário, impacto, versões e logs relevantes.
3. Recuperar: aplicar rollback conhecido ou restauração aprovada.
4. Validar: testar saúde, autenticação, isolamento e dados essenciais.
5. Aprender: abrir PR/issue com causa, correção e prevenção.

## Registro de decisão inicial

| Decisão | Motivo | Consequência |
| --- | --- | --- |
| Separar site e dashboard por subdomínio | Reduz confusão entre apresentação e área autenticada | `app.fluxoatento.com.br` exige deploy, domínio e HTTPS próprios |
| Usar Supabase para Auth e Postgres | Identidade central e RLS multi-tenant | Migração e políticas precisam ser aplicadas e testadas remotamente |
| Executar verificações na VPS | Evita segredos e operações de rede sensíveis no navegador | Exige serviço, Nginx, CORS, logs e operação própria |
| Lançar primeiro o monitoramento | Permite validar valor antes de construir muitos módulos | Recursos comerciais avançados permanecem explicitamente planejados |

## Administração global

- Mesmo login; console Super Admin separado da operação do tenant.
- A tabela platform_administrators é gerida exclusivamente pelo servidor.
  E-mail, parâmetros enviados pelo cliente e user_metadata não concedem papel.
- Alterações de papel e status de provedor são transacionais e auditadas.
- Nomeação de novo Super Admin, MFA, acesso emergencial e remoção de último
  administrador exigem procedimento operacional específico; não estão expostos
  em formulários de configuração comuns.
- Scripts de publicação recusam checkouts com alterações locais e preservam
  releases anteriores. HTML e política CSP precisam pertencer à mesma release.

## Decisões de alinhamento desta revisão

- O nome do produto é FLUXO. O domínio/repositório preservam seus identificadores.
- O agente de desenvolvimento e o especialista VPS são perfis documentados,
  não daemons instalados nem substitutos de revisão humana.
- A API utiliza HTTPS/Supabase REST; não declarar conexão SQL 6543 inexistente.
- O ACK de webhook depende de persistência durável; trabalho pesado vem depois.
- A demonstração pública usa /exemplo; /dashboard no build marketing é
  compatibilidade, enquanto a entrada canônica autenticada é o subdomínio app.
- Oferta/UX não são evidência de produção. Definições comerciais não confirmadas
  permanecem hipóteses, com aprovação pendente na tarefa FLUXO-10.
- O pedido final restringiu a conclusão ao GitHub. Migrações aplicadas antes
  dessa restrição constam em STATUS; frontend/API novos não foram publicados.
- As futuras issues estão integralmente preparadas em BACKLOG; criação via
  integração recebeu 403. Não substituir identificadores do plano por números
  GitHub inventados. Não contornar a permissão negada.

## Manutenção da documentação

Mudança de rota atualiza SITE_MAP; mudança de serviço/caminho atualiza
INFRASTRUCTURE; mudança de permissão/contrato atualiza FULLSTACK; execução real
atualiza STATUS/VALIDATION. Estado histórico deve ser marcado como histórico,
não reapresentado como vigente. Não copiar catálogo, preço ou caminho para
múltiplos documentos quando uma referência resolve.
