# Site map e mapa de rotas do FLUXO

Mapa derivado de app/pages, nuxt.config.js e useDeployment, revisado em
10/10/2026. Documenta o código desta revisão; não declara que toda rota nova já
está publicada. Estado operacional em [STATUS.md](STATUS.md).

## Dois destinos, a mesma identidade

| Origem | Função | Entrada |
| --- | --- | --- |
| https://fluxoatento.com.br | Site e demonstração pública na Netlify | / |
| https://app.fluxoatento.com.br | App autenticado na VPS | /login, depois / ou /admin conforme permissão |
| https://api.fluxoatento.com.br | Serviço de dados, não uma página do painel | /v1; contratos em FULLSTACK |

O botão de acesso do site aponta ao /login do app. Usuário com sessão válida
no app não precisa entrar novamente ao voltar do site. O site não recebe seus
tokens. Super Admin usa a mesma conta; /admin não é uma segunda autenticação.

## Páginas públicas do site

| Rota | Conteúdo/estado no código |
| --- | --- |
| / | Apresentação, exemplo e caminhos para demo/app |
| /como-funciona | Explicação sinal → contexto → ação |
| /demo | Página explicativa com animação; não é redirect automático |
| /exemplo | Demonstração sem dados reais, scenario=errors/tracking/changes |
| /exemplo/monitores e /exemplo/configuracoes | Operações ilustrativas locais |
| /modulos e /modulos/:slug | Catálogo informativo de seis módulos |
| /integracoes | Explicação da proposta; não valida conexão real |
| /planos | Proposta comercial não vigente |
| /ajuda, /suporte, /contato | Ajuda e estado dos canais; sem inventar atendimento |
| /privacy, /terms | Textos sujeitos a revisão de privacidade/jurídica |

Slugs existentes: recuperaia, adsguard, atendescore, contratovivo, compracerta,
leadradar. A existência da página não comprova operação do módulo.

## Área autenticada: origem do código e URL no app

No build dashboard, o hook pages:extend remove o prefixo /dashboard e mantém
apenas páginas do painel e acesso. No build marketing, as rotas de origem
continuam geradas por compatibilidade; não são o destino canônico do produto.

| Arquivo em app/pages | Rota no build marketing | Rota no app dedicado | Controle |
| --- | --- | --- | --- |
| dashboard/index.vue | /dashboard | / | Sessão + tenant |
| dashboard/admin.vue | /dashboard/admin | /admin | Super Admin confirmado pela API |
| dashboard/contatos.vue | /dashboard/contatos | /contatos | Contatos/histórico do tenant |
| dashboard/monitores.vue | /dashboard/monitores | /monitores | Páginas autorizadas do tenant |
| dashboard/canais.vue | /dashboard/canais | /canais | Leitura tenant; alteração owner/admin ou Super Admin |
| dashboard/configuracoes.vue | /dashboard/configuracoes | /configuracoes | Conta atual |
| dashboard/modulos/index.vue | /dashboard/modulos | /modulos | Catálogo em definição |
| dashboard/modulos/[slug].vue | /dashboard/modulos/:slug | /modulos/:slug | Informação, não operação do módulo |
| dashboard/planos.vue | /dashboard/planos | /planos | Proposta; não ativa cobrança |

Não tratar /admin e /contatos como rotas implantadas da nova revisão: aguardam
publicação do PR. A segurança é aplicada na API/RLS, não no segredo da URL ou
na ocultação da navegação.

## Acesso e retornos

| Rota | Uso |
| --- | --- |
| /login | Entrar, criar conta e solicitar recuperação; configuração obrigatória |
| /auth/callback | Confirmação do Supabase |
| /recuperar-acesso | Definir nova senha a partir de sessão válida de recuperação |
| /privacy, /terms | Consultáveis também no app antes do login |

Validar next como caminho interno permitido; rejeitar retorno externo e loops.
Não colocar tokens em links site/app. Usuário comum não recebe console global;
erro de consulta de permissão falha fechado. Google OAuth continua pendente.

## Indexação e sitemap XML

Este documento é o **mapa de navegação**, não um sitemap.xml publicado.
O repositório ainda não contém gerador de sitemap XML nem robots.txt dedicados.
As páginas de app/demo/acesso declaram noindex no código, mas indexação,
canonicals e cabeçalhos finais ainda exigem homologação.

A tarefa FLUXO-10 prevê sitemap XML somente de páginas públicas informativas,
excluindo /exemplo, /dashboard, login, callback, recuperação e o app inteiro.
Não adicionar IDs de tenants, contatos ou URLs privadas. Robots/noindex não
substituem autenticação. Registrar alterações futuras neste mapa junto do PR.
