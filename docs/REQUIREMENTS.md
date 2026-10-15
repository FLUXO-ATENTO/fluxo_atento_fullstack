# Requisitos consolidados

Orientações colaborativas: simplificar o produto e corrigir propostas inseguras.
Foco principal: sites, anúncios e funil; atendimento como complemento. Este
catálogo não indica que as funções estão implementadas.

## Superadmin — plataforma

- Tenants/licenciamento: assinatura, validade, domínios, painel de licenciado
  externo quando definido, versões reais, renovação.
- Clientes: tenants, usuários por tenant, chat de suporte, trial, plano,
  limites de usuários/conexões, canais e módulos.
- Financeiro: pagamentos/vencimentos/links, planos versionados sem alteração
  retroativa silenciosa; arquivar plano para impedir nova atribuição.
- Configurações: branding/cores/tipografia, sons opcionais, logos, PWA512,
  login/cadastro, tutoriais, SMTP e notificações.
- Canais/integrações: apps globais Google/Meta/WABA/OpenAI; autorização de
  ativos da empresa separada de segredos da plataforma.
- Sistema: backup restaurável, migração, monitor e auditoria; sem terminal
  arbitrário ou masterkey universal no MVP.
- Conta: perfil, sessão, recuperação e MFA.

Proprietário tem papel global explicitamente concedido. Cadastro público nunca
cria superadmin. Painel de empresa é privado, não “público por ser externo”.
Templates e habilitação/desativação de módulos precisam de backend auditável,
por tenant/plano/papel, e não apenas de esconder menus.

## Empresa — navegação progressiva

Principal: Home e dados. Crescimento: sites, integrações, campanhas/funil.
Operação: atendimento e automação. Administração: equipe/acessos, perfil,
planos/limites e ajuda. Não exibir dezenas de ferramentas vazias como prontas.

Evolução solicitada: atendimento/chat privado/contatos; campanhas/e-mail/mensagens,
galeria/grupos/respostas rápidas/Calendar; Instagram/Facebook/TikTok/YouTube;
agenda/funil/kanban/tarefas; equipes/canais; agentes/aniversários/chat flow visual
com rascunho/teste/versão/duplicação/importação validada; catálogo/agendamento público/
cobranças/etiquetas/filas/horários/notas; relatórios/avaliações/protocolos/VoIP.

Envios exigem consentimento e regras do canal. Fluxos e automação Instagram
dependem de integração real, não apenas editor visual.

## Ferramentas unificadas

Ads Guard (site/páginas de anúncio), Lead Radar (interesse e origem),
Recupera IA (retomada consentida de conversas), Atende Score (atendimento),
Contrato Vivo (datas/contratos) e Compra Certa (cotações).
São ferramentas do mesmo dashboard, não seis aplicações/autenticações.
As duas últimas são complementares ao foco em tráfego/funil.

## Planos propostos

| Capacidade | Gratuito | Essencial | Completo |
| --- | --- | --- | --- |
| Sites | 1 | 2 | 5 |
| Páginas | 2 | 10 | 30 |
| WhatsApp | 1, sujeito à conexão/regras | 1, sujeito à conexão/regras | 1, sujeito à conexão/regras |
| Respostas de IA/mês | 50 | 500 | 2.000 |
| E-mails marketing/mês | 100 | 1.000 | 10.000 |
| Ferramentas | 2 | 3 | 6 |

São propostas, não contratos/quotas ativas. Definir unidade de consumo, reset,
tokens, falhas, excedentes e custos antes de vender. Monitor básico atual:
duas páginas de um mesmo site.

## UX, identidade e ajuda

Claro/escuro/sistema em todas as superfícies. Login por senha, Google ou GitHub;
Facebook só integração. Nome autenticado no Olá e perfil. Tour inicial de três
passos reabrível e quatro etapas de negócio confirmadas pelo servidor.
Ctrl+K, mobile, teclado, estados/ações consistentes e movimento reduzido.
PT-BR primeiro, sem anunciar idiomas ainda não traduzidos.

Saúde da API não é presença. Online/pausado/offline futuramente regulam distribuição,
não mantêm sessão após logout. Nova conversa reutiliza atendimento existente ou
atribui ao atendente; robô de boas-vindas pode iniciar pendente quando implementado.

Ajuda “Precisa de uma direção” contextual e oficial. Suporte humano distinto de
IA e WhatsApp: filtrar empresa/nome, não lidos, histórico, resposta, anexos privados,
áudio e link de chamada. Enter envia/Shift+Enter quebra linha quando houver serviço.
Nunca mostrar envio fictício como real.

## Jornada e memória

Consulta PageSpeed pública determinística, sem IA. Search Console após autorização.
Resultado oferece dashboard ou especialista. Agente exige login; recibo opaco único
vincula contexto sem tokens na URL. Supabase armazena fatos/eventos/histórico por
tenant; VPS executa. Reconexão deve recuperar lacunas do histórico.
Docs públicos separados de docs autenticados, sem dados privados em build estático.

## Segurança financeira e operacional

Asaas/Stripe/Pagar.me/Mercado Pago são opções futuras. Assinatura obrigatória de
webhooks em produção, deduplicação, validação no gateway e reconciliação.
Não guardar secrets em JSON versionado nem aceitar cobrança sem validação.
Não prometer criptografia ponta a ponta se o serviço precisa processar os dados.

n8n e revisão conceitual de marca/logo ficam posteriores. Ver [ROADMAP](ROADMAP.md).
