# Plano de implementação do produto funcional

## Objetivo e limite deste plano

Este plano transforma a fundação atual em um MVP verificável de monitoramento
de páginas. Ele não declara prontos os módulos de WhatsApp, e-mail, CRM, IA,
cobrança, equipes ou automações. Esses itens entram em fases posteriores,
somente após o MVP operar com segurança e evidência.

O documento organiza o trabalho por **portões de entrega**. Nenhuma fase pode
ser marcada como concluída porque o código existe; ela exige os critérios de
aceite e a evidência descritos aqui.

## Arquitetura-alvo do MVP

```text
fluxoatento.com.br              app.fluxoatento.com.br
site institucional              dashboard autenticado
          │                               │
          └──────────────┬────────────────┘
                         │ HTTPS
                         ▼
                 Supabase Auth + Postgres
              (sessão, RLS, monitores, checks)
                         ▲
                         │ token do usuário / gravação de servidor
                         │
          api.fluxoatento.com.br na VPS
      monitor-api em loopback + Nginx /v1/
```

O navegador recebe apenas configurações públicas. A chave administrativa do
Supabase pertence exclusivamente ao ambiente privado da VPS. O serviço de
monitoramento não deve substituir, reiniciar ou alterar o serviço de agente
já existente na mesma VPS.

## Fases, procedimento e critério de aceite

### Fase 0 — Organização e governança

**Propósito:** estabelecer uma fonte única de verdade e impedir que uma tela,
um deploy ou uma resposta HTTP isolada seja confundida com produto funcional.

**Procedimento:**

1. Manter `docs/STATUS.md` como estado factual do ambiente.
2. Manter este plano como sequência oficial de ativação.
3. Abrir um PR por mudança coerente: documentação, banco, VPS, frontend ou
   módulo de negócio não devem ser misturados sem justificativa.
4. Associar a cada PR: objetivo, risco, plano de teste, rollback e evidência.
5. Bloquear merge sem CI verde e revisão humana para mudanças de produção.

**Aceite:** documentação aprovada, responsáveis pela revisão definidos e PRs
passam a registrar evidência em vez de apenas descrição.

### Fase 1 — Fundação de release e ambientes

**Propósito:** publicar o dashboard em domínio próprio sem misturar a área
autenticada com o site institucional.

**Procedimento:**

1. No projeto Netlify `fluxo-atento-app`, associar o repositório e configurar
   a branch de produção como `main` após a revisão do PR.
2. Configurar `pnpm generate:dashboard` como comando de build e
   `dist-dashboard` como diretório publicado.
3. Manter `app.fluxoatento.com.br` como domínio do projeto do dashboard e
   esperar a emissão de certificado que inclua explicitamente esse host.
4. Cadastrar apenas variáveis públicas no projeto Netlify:
   `NUXT_PUBLIC_SUPABASE_URL`, chave publicável do Supabase,
   `NUXT_PUBLIC_API_BASE` e `NUXT_PUBLIC_MARKETING_URL`.
5. Nunca cadastrar chave `service_role`, `sb_secret_`, senha de banco ou
   segredo de assinatura JWT na Netlify.

**Aceite:** HTTPS válido no subdomínio, deploy proveniente do repositório,
rota `/` do subdomínio abrindo o dashboard e rollback para o deploy anterior
documentado.

### Fase 2 — Banco de dados, autenticação e isolamento

**Propósito:** preparar persistência individual e confirmar que uma conta não
acessa os dados de outra.

**Procedimento:**

1. Revisar a migração `supabase/migrations/*_monitor_workspace.sql`.
2. Aplicar a migração no projeto Supabase correto por um PR/registro de
   mudança autorizado.
3. Conferir que as tabelas `monitors` e `monitor_checks`, índices, RLS e
   políticas foram criados.
4. Cadastrar os Redirect URLs exatos de produção:
   `https://app.fluxoatento.com.br/auth/callback` e
   `https://app.fluxoatento.com.br/recuperar-acesso`.
5. Configurar entrega de e-mail de autenticação, limites antiabuso e remetente
   antes de convidar clientes reais.
6. Testar duas contas distintas: cada uma deve ler somente seus próprios
   monitores e checks; tentativas de leitura cruzada devem falhar.

**Aceite:** cadastro, confirmação, login, recuperação e logout executados em
produção; RLS testado contra acesso cruzado; nenhuma chave administrativa no
navegador; advisories de segurança revisados.

### Fase 3 — API de monitoramento na VPS

**Propósito:** tornar a verificação real, autenticada e isolada do serviço de
agente já existente.

**Procedimento:**

1. Criar um usuário de serviço sem privilégios de administrador.
2. Instalar o código versionado e as dependências a partir do lockfile em
   diretório exclusivo do monitor-api.
3. Criar o arquivo privado de ambiente fora do repositório, com permissões
   restritas. Nele ficam URL Supabase, chave publicável, segredo de servidor e
   lista exata de origens permitidas, incluindo
   `https://app.fluxoatento.com.br`.
4. Instalar o serviço systemd sem substituir os serviços existentes.
5. Fazer o processo ouvir apenas `127.0.0.1:8100`.
6. Inserir apenas o bloco `location /v1/` no servidor TLS já existente do
   Nginx para `api.fluxoatento.com.br`.
7. Validar a configuração do Nginx antes de recarregá-la e testar rollback.
8. Aplicar rate limit, limites de corpo, timeout e logs estruturados para
   `/v1/`.

**Aceite:** `/v1/health` retorna o contrato esperado; rotas sem token retornam
401; a VPS não expõe porta 8100 publicamente; o serviço de agente em `/health`
continua sem regressão.

### Fase 4 — Integração funcional e segurança de dados

**Propósito:** conectar dashboard, Supabase e VPS em uma única jornada real.

**Procedimento:**

1. Entrar com uma conta de teste no dashboard publicado.
2. Cadastrar uma URL HTTPS pública permitida.
3. Conferir criação do monitor pela API e persistência no Supabase.
4. Acionar uma verificação explícita e conferir o resultado salvo.
5. Tentar URL inválida, privada, local, com credenciais e redirecionamento
   proibido; cada uma deve ser recusada com mensagem segura.
6. Criar uma segunda conta e comprovar que não lê, modifica nem dispara checks
   do primeiro usuário.
7. Conferir CORS somente para as origens autorizadas e rate limits sob carga
   moderada controlada.

**Aceite:** jornada completa aprovada, dados persistidos, isolamento de
usuário comprovado, erros previsíveis tratados e sem fallback para dados de
demonstração.

### Fase 5 — Operação, observabilidade e lançamento controlado

**Propósito:** manter o MVP recuperável depois da primeira publicação.

**Procedimento:**

1. Definir logs de aplicação, Nginx e serviço, com retenção e acesso limitado.
2. Configurar alerta de indisponibilidade para site, API e falhas de deploy.
3. Confirmar backup e restauração do banco conforme a política do Supabase.
4. Documentar rollback de deploy Netlify, rollback de serviço e rollback de
   mudança de banco antes de qualquer mudança destrutiva.
5. Executar uma revisão de privacidade/LGPD, termos, suporte e retenção antes
   de abrir a aplicação a clientes.
6. Fazer lançamento controlado com contas piloto, métricas e canal de suporte.

**Aceite:** runbook executado em teste, responsável por incidentes definido,
deploy reversível e piloto concluído sem falha crítica.

## Checklist de aceite de produção do MVP

O status só pode mudar para **MVP funcional** quando todos os itens estiverem
marcados com link para evidência:

- [ ] `app.fluxoatento.com.br` possui certificado HTTPS válido.
- [ ] O projeto Netlify do dashboard é publicado a partir de `main`.
- [ ] As variáveis públicas corretas estão no escopo de build da Netlify.
- [x] A migração foi aplicada e as tabelas existem no Supabase (10/10/2026).
- [ ] RLS bloqueia leitura e modificação cruzada entre duas contas de teste.
- [ ] Cadastro, confirmação, login, recuperação e logout foram testados.
- [ ] A VPS responde `GET /v1/health`.
- [ ] A porta 8100 está restrita ao loopback.
- [ ] A API valida tokens e rejeita chamadas não autenticadas.
- [ ] Um monitor real pode ser criado, verificado e consultado pelo dono.
- [ ] CORS, rate limit e validação de URL foram testados.
- [ ] Há logs, alertas, backup e rollback documentados.
- [ ] CI, revisão humana e teste de produção estão registrados.

## Evolução após o MVP

Cada módulo futuro deve passar pelo mesmo ciclo: descoberta do problema,
contrato de dados, avaliação de risco, protótipo, implementação, testes,
piloto, métricas e lançamento. A ordem sugerida é:

1. Alertas e agendamento de verificações do MVP.
2. Equipes, empresas e permissões por papel.
3. Planos, limites e cobrança.
4. Integrações de canais (e-mail e WhatsApp), com consentimento e opt-out.
5. CRM e automações com revisão humana.
6. Recursos de IA com avaliação de custo, privacidade e qualidade.

Nenhuma etapa de canal, IA ou cobrança deve ser anunciada como disponível sem
contrato de dados, responsável operacional e teste de aceitação específico.
