# Estado operacional do Fluxo Atento

> **Registro factual em 10/10/2026.** Este documento descreve evidências de
> ambiente, não intenções, telas ou apenas presença de código no repositório.
> Atualize-o em todo marco de implantação e anexe a evidência de validação ao
> PR correspondente.

## Resumo executivo

O Fluxo Atento está em **fundação de MVP**. A experiência pública e o código
para autenticação, dashboard e monitoramento existem no repositório, mas o
fluxo completo ainda não foi ativado no ambiente de produção.

| Área | Estado | Evidência conhecida | Próxima condição para considerar pronta |
| --- | --- | --- | --- |
| Site institucional | Operante | `https://fluxoatento.com.br` respondeu HTTP 200 | Manter monitoramento e CI |
| Dashboard em subdomínio | Em implantação | Projeto Netlify separado e domínio `app.fluxoatento.com.br` cadastrados | Certificado válido, build publicado e teste autenticado |
| Código do dashboard | Preparado | Rotas, autenticação de cliente e build separado presentes | Deploy a partir de `main` e teste em produção |
| Supabase | Schema aplicado; jornada ainda não validada | Migração remota `20261010234155_monitor_workspace`; tabelas e RLS ativos; zero linhas iniciais | Testar Auth, RLS e gravação com duas contas |
| API de monitoramento | Não implantada | `GET /health` responde no serviço de agente; `/v1/health` e `/v1/monitors` retornam 404 | Serviço `monitor-api`, Nginx `/v1/` e CORS ativos |
| Observabilidade e operação | Não implantadas | Sem evidência de alertas, backup testado ou runbook executado | Alertas, logs, backup e rollback testados |
| Módulos avançados | Planejados | Telas e proposta de produto não equivalem a integrações ativas | Escopo, dados, integrações e testes por módulo |

## Migrações aplicadas no Supabase

Em 10/10/2026, a migração local de monitoramento foi aplicada e verificada no
ambiente remoto. A aplicação não inseriu dados de demonstração.

| Fonte | Estado |
| --- | --- |
| Repositório Git | Migração `20261010193511_monitor_workspace.sql` versionada |
| Histórico remoto do Supabase | `20261010234155_monitor_workspace` aplicada |
| Schema público remoto | `monitors` e `monitor_checks`, ambas com RLS ativo |
| Dados iniciais | Zero linhas, conforme esperado para ambiente sem contas de teste |
| Segurança verificada | Consulta de advisories de segurança sem alertas retornados |
| Pendente | Teste de RLS e jornada real com duas contas autenticadas |

## O que pode e o que não pode ser afirmado

### Pode ser afirmado

- O repositório contém o contrato do monitoramento, o cliente Nuxt, a migração
  RLS, a API Node e modelos de Nginx/systemd.
- A separação proposta entre site, dashboard, Supabase e VPS reduz exposição de
  segredos e permite operar cada camada com responsabilidade clara.
- A interface não usa dados ilustrativos como substituto silencioso de uma
  resposta real da API.

### Não pode ser afirmado sem nova evidência

- Que um usuário consegue concluir cadastro, confirmação por e-mail, login e
  recuperação de senha em `app.fluxoatento.com.br`.
- Que monitores ou resultados são persistidos no Supabase.
- Que a VPS aceita e processa as rotas `/v1` do dashboard.
- Que dados de uma conta são inacessíveis a outra em produção.
- Que WhatsApp, e-mail, IA, cobrança, CRM, equipes ou módulos comerciais estão
  integrados e operantes.

## Definição do primeiro produto utilizável

O MVP não é o conjunto inteiro de propostas comerciais. O primeiro produto
operante é a jornada abaixo:

1. Uma pessoa cria e confirma uma conta.
2. A pessoa entra no dashboard individual em `app.fluxoatento.com.br`.
3. A pessoa cadastra uma página HTTPS pública permitida.
4. A VPS verifica a página com limites e validações de segurança.
5. O resultado é gravado no Supabase e aparece somente para a conta dona.
6. A pessoa consegue repetir a verificação e consultar um histórico limitado.

Somente depois dessa jornada validada o sistema pode ser chamado de MVP
funcional de monitoramento.
