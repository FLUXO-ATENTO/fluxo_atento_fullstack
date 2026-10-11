# Backlog de ativação full stack — FLUXO

Revisão: 10/10/2026. As 11 tarefas abaixo são trabalho futuro com aceite definido.
**Registro externo:** o conector GitHub retornou HTTP 403 (permissão de criação
de issues indisponível). Nenhuma issue foi criada por esta tentativa. Os IDs
FLUXO-01…11 são identificadores deste plano, não números de issues GitHub.
Após liberar a permissão Issues: write na integração autorizada, pesquisar
existentes antes de abrir e registrar os links aqui, sem duplicação.

P0 = pré-requisito de publicação/segurança ou portão de lançamento; P1 = evolução
funcional. Prioridade não substitui dependência. Nenhuma tarefa autoriza deploy,
envio de mensagem, gasto ou mudança global de infraestrutura por si só.

## Sequência e critérios de avanço

1. Revisão humana do PR atual → FLUXO-01 (publicação controlada).
2. FLUXO-02 e FLUXO-03 (segurança e recuperação), antes de ampliar o piloto.
3. FLUXO-04 (fila durável) → FLUXO-05/06 (canais escolhidos) → FLUXO-07
   (importação/histórico e governança; consentimento precede campanhas).
4. FLUXO-08, FLUXO-09 e FLUXO-10 conforme escopo anunciado, com homologação.
5. FLUXO-11 aceita ou rejeita o lançamento do escopo declarado por evidência.

Não lançar o conjunto como omnichannel completo sem ambos os canais anunciados.
Google OAuth ou módulo não incluído no piloto deve permanecer indisponível e
explicitamente fora da oferta. Designar pessoa executora e revisor antes de iniciar.

## FLUXO-01 — Publicar e homologar Super Admin e contatos na VPS

- Prioridade: **P0**.
- Responsável por função: Operação VPS + desenvolvimento; executor/revisor a designar.
- Dependência: PR de Super Admin/sessão/CRM revisado e merge autorizado.
- Estado: pendente; issue externa ainda não criada.

### Tarefas e aceite

- [ ] Registrar SHA aprovado, versão atual de frontend/API e migrações no projeto qbfmebpzxnzdpalmgtxr.
- [ ] Preservar env e diretório dist não rastreado; preparar checkout limpo sem reset destrutivo.
- [ ] Preparar CSP por release e rollback do Nginx; publicar API compatível e frontend em janela aprovada.
- [ ] Testar login do responsável sem receber sua senha, Super Admin, usuário comum negado, isolamento, contatos, retorno site/app e logout.
- [ ] Registrar evidências sanitizadas, SHA em execução e rollback testado em docs/STATUS.md.

### Evidência para encerrar

PR revisado, testes com resultado e ambiente, versão/configuração afetada,
rollback quando operacional e atualização de STATUS/VALIDATION. Não registrar
segredos ou dados de clientes. Seguir [governança](GOVERNANCE.md) e
[procedimento VPS](VPS_AGENT.md). Sem aceite não fechar como concluído.

## FLUXO-02 — Reforçar autenticação administrativa e auditoria global

- Prioridade: **P0**.
- Responsável por função: Backend/Auth + responsável do produto; executor/revisor a designar.
- Dependência: FLUXO-01 para homologação publicada; implementação pode ocorrer antes.
- Estado: pendente; issue externa ainda não criada.

### Tarefas e aceite

- [ ] Implementar matrícula e exigência de MFA para ações administrativas sensíveis; verificar fator no servidor, não só na interface.
- [ ] Definir revogação, reautenticação, acesso emergencial e nomeação/remoção de Super Admin com proteção do último administrador.
- [ ] Avaliar/ativar proteção de senhas comprometidas conforme plano Supabase; registrar impedimento sem expor senha.
- [ ] Auditar acesso global, convites e alterações de provedor sem registrar tokens, mensagens ou segredos.
- [ ] Testar sessão revogada, usuário comum, ausência de segundo fator e recuperação administrativa autorizada.

### Evidência para encerrar

PR revisado, testes com resultado e ambiente, versão/configuração afetada,
rollback quando operacional e atualização de STATUS/VALIDATION. Não registrar
segredos ou dados de clientes. Seguir [governança](GOVERNANCE.md) e
[procedimento VPS](VPS_AGENT.md). Sem aceite não fechar como concluído.

## FLUXO-03 — Validar inventário VPS, backups, recuperação e observabilidade

- Prioridade: **P0**.
- Responsável por função: Operação VPS; executor/revisor a designar.
- Dependência: Inventário documental inicial; mudanças globais exigem autorização própria.
- Estado: pendente; issue externa ainda não criada.

### Tarefas e aceite

- [ ] Confirmar serviços, contêineres, volumes e responsáveis de 8000/5678/9443; não alterar ativos legados.
- [ ] Definir RPO/RTO com responsável e testar restauração de backup Supabase em ambiente isolado, incluindo dados e políticas.
- [ ] Validar backup de configuração e releases da VPS, integridade e procedimento de restauração sem incluir segredos no Git.
- [ ] Definir alertas de processo, disco, certificado e fila; redigir retenção de logs antes de instalar política journald global.
- [ ] Tratar atualização/reboot pendente em janela aprovada; documentar impacto por serviço e ensaio de rollback.

### Evidência para encerrar

PR revisado, testes com resultado e ambiente, versão/configuração afetada,
rollback quando operacional e atualização de STATUS/VALIDATION. Não registrar
segredos ou dados de clientes. Seguir [governança](GOVERNANCE.md) e
[procedimento VPS](VPS_AGENT.md). Sem aceite não fechar como concluído.

## FLUXO-04 — Implementar fila durável e worker de webhooks

- Prioridade: **P1**.
- Responsável por função: Backend + banco + operação VPS; executor/revisor a designar.
- Dependência: Provedor piloto e contrato de evento definidos; FLUXO-03 para recuperação.
- Estado: pendente; issue externa ainda não criada.

### Tarefas e aceite

- [ ] Persistir evento autenticado e idempotente antes do ACK; responder falha se não houver persistência durável.
- [ ] Validar assinatura, tamanho, anti-replay e vínculo provedor/conexão/tenant; nunca confiar no tenant do payload.
- [ ] Processar fora da conexão HTTP com backoff, máximo de tentativas e fila de falhas; worker com usuário dedicado.
- [ ] Testar duplicatas, assinatura inválida, indisponibilidade do banco, queda/reinício do worker e recuperação sem perda.
- [ ] Registrar métricas e correlação sem payload privado; provar isolamento entre dois tenants.

### Evidência para encerrar

PR revisado, testes com resultado e ambiente, versão/configuração afetada,
rollback quando operacional e atualização de STATUS/VALIDATION. Não registrar
segredos ou dados de clientes. Seguir [governança](GOVERNANCE.md) e
[procedimento VPS](VPS_AGENT.md). Sem aceite não fechar como concluído.

## FLUXO-05 — Ativar conector WhatsApp WABA com isolamento por tenant

- Prioridade: **P1**.
- Responsável por função: Integrações + Super Admin; executor/revisor a designar.
- Dependência: FLUXO-04; conta/app Meta, permissões e custos aprovados pelo responsável.
- Estado: pendente; issue externa ainda não criada.

### Tarefas e aceite

- [ ] Definir conta própria versus provedor global; guardar tokens somente no servidor e projetar metadados seguros ao navegador.
- [ ] Implementar vínculo de número/conexão ao tenant e validação real antes de marcar provedor como validated.
- [ ] Testar envio e recebimento autorizado com número de teste, persistência, idempotência e erros do provedor.
- [ ] Verificar documentação vigente de templates, consentimento, limites e eventual histórico; não prometer backfill irrestrito.
- [ ] Homologar dois tenants sem cruzamento de dados, credenciais ou eventos e documentar desconexão/revogação.

### Evidência para encerrar

PR revisado, testes com resultado e ambiente, versão/configuração afetada,
rollback quando operacional e atualização de STATUS/VALIDATION. Não registrar
segredos ou dados de clientes. Seguir [governança](GOVERNANCE.md) e
[procedimento VPS](VPS_AGENT.md). Sem aceite não fechar como concluído.

## FLUXO-06 — Ativar e-mail SMTP e estratégia de recebimento/histórico

- Prioridade: **P1**.
- Responsável por função: Integrações + operação VPS; executor/revisor a designar.
- Dependência: FLUXO-04; provedor, domínio e método de recebimento aprovados.
- Estado: pendente; issue externa ainda não criada.

### Tarefas e aceite

- [ ] Implementar SMTP com TLS, segredos privados, remetente autorizado e teste real de entrega/erro.
- [ ] Definir leitura por Gmail API/IMAP ou webhook de provedor; SMTP sozinho não recebe histórico.
- [ ] Para Gmail, testar sincronização inicial, historyId, checkpoint expirado e renovação das permissões.
- [ ] Configurar SPF/DKIM/DMARC somente após verificar DNS e obter autorização para os registros.
- [ ] Testar isolamento, mensagens duplicadas, desvinculação e falhas sem vazar dados em logs.

### Evidência para encerrar

PR revisado, testes com resultado e ambiente, versão/configuração afetada,
rollback quando operacional e atualização de STATUS/VALIDATION. Não registrar
segredos ou dados de clientes. Seguir [governança](GOVERNANCE.md) e
[procedimento VPS](VPS_AGENT.md). Sem aceite não fechar como concluído.

## FLUXO-07 — Completar governança de contatos, consentimento e importação

- Prioridade: **P1**.
- Responsável por função: Banco/backend + responsável por privacidade; executor/revisor a designar.
- Dependência: Schema de contatos existente; FLUXO-05/06 antes de histórico externo.
- Estado: pendente; issue externa ainda não criada.

### Tarefas e aceite

- [ ] Registrar origem, finalidade e evidência de consentimento por canal; contato cadastrado não é autorização de campanha.
- [ ] Implementar revisão/fusão de identidades conflitantes com trilha auditável e sem merge silencioso.
- [ ] Definir retenção, exportação, exclusão e bloqueio/opt-out; revisar termos com responsável competente.
- [ ] Implementar importação em lotes e histórico com checkpoints, limites e reprocessamento idempotente.
- [ ] Testar RLS, vínculo composto, exclusão/retencão, opt-out antes do envio e recuperação de importação interrompida.

### Evidência para encerrar

PR revisado, testes com resultado e ambiente, versão/configuração afetada,
rollback quando operacional e atualização de STATUS/VALIDATION. Não registrar
segredos ou dados de clientes. Seguir [governança](GOVERNANCE.md) e
[procedimento VPS](VPS_AGENT.md). Sem aceite não fechar como concluído.

## FLUXO-08 — Habilitar login Google via Supabase sem conceder privilégios

- Prioridade: **P1**.
- Responsável por função: Frontend/Auth + responsável pelas credenciais; executor/revisor a designar.
- Dependência: Projeto Google e consent screen aprovados; login por e-mail existente permanece.
- Estado: pendente; issue externa ainda não criada.

### Tarefas e aceite

- [ ] Configurar OAuth no projeto Supabase qbfmebpzxnzdpalmgtxr e redirects exatos do app; guardar client secret no provedor.
- [ ] Ativar o botão somente quando o fluxo estiver operacional, sem simular sucesso.
- [ ] Definir vinculação de identidades e evitar conta duplicada/perda do tenant; não elevar papel por domínio ou e-mail.
- [ ] Testar consentimento negado, callback inválido, conta existente, logout e retorno site/app.
- [ ] Registrar configuração sem copiar segredo, tokens ou senha para Git/issue.

### Evidência para encerrar

PR revisado, testes com resultado e ambiente, versão/configuração afetada,
rollback quando operacional e atualização de STATUS/VALIDATION. Não registrar
segredos ou dados de clientes. Seguir [governança](GOVERNANCE.md) e
[procedimento VPS](VPS_AGENT.md). Sem aceite não fechar como concluído.

## FLUXO-09 — Implementar monitoramento recorrente com limites e autorização

- Prioridade: **P1**.
- Responsável por função: Backend/worker + operação VPS; executor/revisor a designar.
- Dependência: FLUXO-03; cadência/custos validados, sem assumir quotas comerciais propostas.
- Estado: pendente; issue externa ainda não criada.

### Tarefas e aceite

- [ ] Distinguir verificação HTTP manual atual de observação recorrente e análise por navegador ainda não implementadas.
- [ ] Agendar apenas páginas autorizadas e tenants ativos, com limites, locks e idempotência.
- [ ] Manter proteção SSRF, DNS/redirects, tamanho, timeout e bloqueio de rede privada em cada tentativa.
- [ ] Testar retry, pausa, reinício, concorrência e escopo tenant; medir custo/carga antes de definir cadência.
- [ ] Documentar limites de diagnóstico e alertas sem alegar análise completa ou resultado comercial.

### Evidência para encerrar

PR revisado, testes com resultado e ambiente, versão/configuração afetada,
rollback quando operacional e atualização de STATUS/VALIDATION. Não registrar
segredos ou dados de clientes. Seguir [governança](GOVERNANCE.md) e
[procedimento VPS](VPS_AGENT.md). Sem aceite não fechar como concluído.

## FLUXO-10 — Homologar site map, acessibilidade e oferta pública

- Prioridade: **P1**.
- Responsável por função: Frontend/conteúdo + responsável comercial; executor/revisor a designar.
- Dependência: Mapa técnico em docs/SITE_MAP.md; decisões de oferta humanas.
- Estado: pendente; issue externa ainda não criada.

### Tarefas e aceite

- [ ] Validar destinos públicos, links de entrada no app, módulos e rotas de demonstração sem confundir área autenticada.
- [ ] Implementar sitemap.xml/robots e URLs canônicas somente para páginas públicas; excluir login, callbacks, exemplo e app privado.
- [ ] Resolver a distribuição de e-mail entre planos, preços/cotas e escopos; não transformar hipóteses de OFFER em promessa ativa.
- [ ] Conferir copy de app versus demo, contraste, teclado, leitor de tela e movimento reduzido.
- [ ] Executar verificação de links/SEO/visual e documentar evidências; não anunciar conformidade só por teste automático.

### Evidência para encerrar

PR revisado, testes com resultado e ambiente, versão/configuração afetada,
rollback quando operacional e atualização de STATUS/VALIDATION. Não registrar
segredos ou dados de clientes. Seguir [governança](GOVERNANCE.md) e
[procedimento VPS](VPS_AGENT.md). Sem aceite não fechar como concluído.

## FLUXO-11 — Homologar piloto e autorizar lançamento full stack por evidência

- Prioridade: **P0**.
- Responsável por função: Responsável do produto + QA + especialistas; executor/revisor a designar.
- Dependência: FLUXO-01/02/03/04/07 e conectores escolhidos FLUXO-05/06; FLUXO-08/09/10 conforme escopo anunciado.
- Estado: pendente; issue externa ainda não criada.

### Tarefas e aceite

- [ ] Definir escopo explícito do piloto, tenants autorizados e critérios mensuráveis antes de convidar clientes.
- [ ] Executar jornada site → login → onboarding → canal → contato → mensagem → histórico → logout com dados autorizados.
- [ ] Validar Super Admin, dois tenants isolados, falhas de integração e restauração; conferir custos e limites acordados.
- [ ] Revisar proteção de dados, suporte, incidentes e evidências de segurança; registrar riscos aceitos pelo responsável.
- [ ] Declarar pronto apenas o escopo aprovado, atualizar STATUS/VALIDATION e manter funções restantes indisponíveis.

### Evidência para encerrar

PR revisado, testes com resultado e ambiente, versão/configuração afetada,
rollback quando operacional e atualização de STATUS/VALIDATION. Não registrar
segredos ou dados de clientes. Seguir [governança](GOVERNANCE.md) e
[procedimento VPS](VPS_AGENT.md). Sem aceite não fechar como concluído.
