# Aceite de ponta a ponta

Preview fictício não comprova produção. Estado atual em [STATUS](STATUS.md).

## Observado em produção

- [x] Site e dashboard acessíveis com HTTPS.
- [x] API /v1/health disponível.
- [x] Login de conta existente e monitor real persistido após reload.
- [x] Consulta de administração com conta autorizada.
- [x] Inventário inicial registrado sem copiar segredos.

## Revisão de código

- [x] Separar demonstração, entrada e ajuda.
- [x] Nome do perfil, destino por papel da API e limpeza de estado por identidade.
- [x] Sem alternância ao superadmin no painel da empresa.
- [x] Tema claro/escuro/sistema por origem.
- [x] Google/GitHub preparados com portão de configuração.
- [x] Google de dados separado do login, com telas e contrato privados para revisão.
- [x] Paletas pessoais e entrada comum para site, docs e agente.
- [x] Portal Docs pesquisável, regras de atualização e agentes com escopo definido.
- [x] Docs e rotas legais iniciais; revisão jurídica pendente.
- [x] Bloqueio de variáveis públicas e varredura de fonte/artefatos.
- [x] CI remoto, aprovação do proprietário, merge do PR #6 e publicação controlada de site/dashboard, conforme [registro](DEPLOYMENT_2026-10-15.md).
- [ ] Aceite da versão publicada, incluindo mobile, dois temas e perfil real.

## Antes de receber clientes

- [ ] Cadastro, confirmação e recuperação com remetente real.
- [ ] Dois tenants reais: negar leitura/escrita cruzada via API e RLS.
- [ ] Conta comum não acessa rotas administrativas mesmo por requisição direta.
- [ ] Conta proprietária distinta da conta teste, MFA e recuperação.
- [ ] Apps Google/GitHub, consentimento, callbacks e testes de cancelamento/falha.
- [ ] Sessão expirada/trocada durante requests não vaza dados anteriores.
- [ ] Templates, módulos, quotas e licenças aplicados no backend e auditados.
- [ ] PageSpeed real com cache, rate limit, validação e indicação de fonte/data.
- [ ] Resultado ligado ao usuário correto por recibo único.
- [ ] OAuth Google/Meta e sincronização de dados autorizados.
- [ ] Google: aplicar/testar migração em banco isolado, grants/RLS e concorrência; não confundir descoberta de fontes com relatórios.
- [ ] Google: revisar callback HTTPS, cookies, CORS, logs sanitizados e efeito da revogação no projeto.
- [ ] Copiloto com BFF, ferramentas, histórico e orçamento limitado.
- [ ] Suporte humano persistente e anexos privados.
- [ ] Cobranças assinadas, reconciliadas e limites atômicos.

## Operação

- [x] Reabrir terminal e conferir versões/configuração usadas pelo dashboard; retorno da release exercitado.
- [ ] Concluir auditoria de firewall, ambientes privados e bindings da VPS.
- [ ] Revisar advisors atuais, grants/RLS, logs e retenção.
- [ ] Backup externo com restauração e rollback testados.
- [ ] Testar recebimento de e-mail e pedidos de privacidade.
- [ ] Revisão jurídica e dados empresariais completos antes de lançamento comercial.
- [ ] Docs/agente: conteúdo, acesso e HTTPS antes de DNS.
- [ ] Medir carga/custos antes de escalar.

Não publicar secrets; não promover usuários públicos; não ativar serviços só
porque existe botão; não tratar container parado como backup; não contratar n8n
nesta etapa. Cada operação de produção exige alvo, rollback e evidência.
