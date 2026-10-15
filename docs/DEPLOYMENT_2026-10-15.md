# Publicação controlada — 15/10/2026

## Escopo autorizado e versão

O proprietário confirmou o merge do PR #6 e autorizou publicar o dashboard na
VPS, preservando a versão anterior e validando rotas/acesso. A ativação do
Turnstile no Supabase foi expressamente deixada para depois dessa validação.

- Código: `5721c716501aea4ed2074b609b9b78108f7db7d6`, merge de 19h50 BRT.
- [CI do merge](https://github.com/FLUXO-ATENTO/fluxo_atento_fullstack/actions/runs/38819800914),
  [Docs](https://github.com/FLUXO-ATENTO/fluxo_atento_fullstack/actions/runs/38819800824)
  e [Database isolation](https://github.com/FLUXO-ATENTO/fluxo_atento_fullstack/actions/runs/38819800951): sucesso.
- Netlify `fluxo-atento`: deploy `6ad158b31e8bece3f665280c`, publicado a partir desse commit.
- VPS: release `/srv/fluxo-atento-dashboard/releases/20261015-5721c71.BeKcpI`.
- Release anterior preservada: `/srv/fluxo-atento-dashboard/releases/verified-config.06GBZClB`.
- Backup restrito da configuração: `/srv/fluxo-atento-dashboard/rollback-5721c71.t8rYbf`.
- Arquivo Nginx efetivo: `/etc/nginx/sites-available/fluxo-atento-dashboard`;
  não era o nome `fluxo-atento-app` mostrado no exemplo de instalação.

O checkout antigo e seu symlink não versionado `dist` foram preservados.
A geração ocorreu em worktree isolada, fixada no commit aprovado, sem
`git reset --hard`, sem atualizar o código da API e sem aplicar migrações.
Nenhuma senha, chave secreta, cookie ou token está neste registro.

## Geração, promoção e incidente corrigido

Node 22.23.3 e pnpm 11.25.0 já estavam instalados. O arquivo de build permaneceu
pertencente a root, modo 0600. Foram utilizados somente os valores públicos
existentes do produto, com `NUXT_PUBLIC_AUTH_PROVIDERS=google` e
`NUXT_PUBLIC_TURNSTILE_ENABLED=false`; nenhum segredo Google entrou no build.

`pnpm install --frozen-lockfile` e `pnpm generate:dashboard` concluíram com código
zero, 36 rotas pré-renderizadas e scanner de 90 arquivos sem padrões privados
detectados. A presença de index, acessar, login, callback, recuperação e admin
foi verificada antes da promoção. Assets antigos com nome hash foram mantidos
para abas existentes; o pacote final foi novamente examinado: 129 arquivos,
zero padrões detectados. Isso não é auditoria absoluta de segredos.

A primeira promoção ocorreu às 20h04m47 BRT. As rotas responderam HTTP 200,
mas o navegador mostrou a página de erro 500 e `NUXT_E1005`. A versão anterior
e a configuração foram restauradas às 20h05m21 BRT; login, sessão e consulta
existentes voltaram a abrir. A tentativa não foi aceita apenas pelo HTTP 200.

Causa confirmada por teste estático local, sem Auth ou dados reais: a política
CSP preparada para o deploy incluía o hash do runtime config, mas havia omitido
o `<script type="importmap">`. Sem esse hash, o mesmo pacote reproduziu o erro;
com ele, o login abriu. O ajuste foi somente operacional: calcular os hashes
do importmap e dos scripts inline executáveis, ignorando apenas blocos de dados
JSON, e autorizá-los explicitamente em `script-src`. Não foi adicionado
`unsafe-inline` nem `unsafe-eval` para scripts.

A segunda promoção ocorreu às **20h13m57 BRT**, com os dois hashes conferidos
em 19 HTMLs. A interface abriu e a sessão existente carregou o novo painel.
O código da aplicação continuou exatamente no commit aprovado.

Na conferência seguinte, as rotas foram alinhadas ao formato sem barra final
usado pelo aplicativo. Nginx passou a procurar `$uri/index.html` antes de
diretórios, mantendo 404 para caminhos inexistentes. `/admin/` redireciona para
`/admin`, sem perder a consulta; o menu Superadmin foi verificado após recarga.
HTML recebe `Cache-Control: no-store`, inclusive a raiz, preservando a herança
da CSP. Assets com hash continuam com cache imutável. Abas que ainda tenham
HTML anterior em cache podem exigir uma atualização completa uma vez.

## Aceite observado e limites

| Conferência | Resultado |
| --- | --- |
| Nginx antes/depois | `nginx -t` aprovado; reload, sem restart dos demais serviços |
| Rotas do app | Raiz, acessar, login, callback, recuperação, admin e monitores responderam 200 |
| Caminho inexistente | 404 real, sem fallback genérico de sucesso |
| Links antigos | `/login/` continua aceito, com retorno canônico sem barra e parâmetros preservados |
| Cabeçalhos | CSP com hashes específicos e cache no-store verificados no HTML; DENY/nosniff no login |
| Login | Nova interface, temas e botão Google habilitado visíveis em HTTPS; GitHub permanece em configuração |
| Sessão já existente | Nome de apresentação e empresa carregados; sessão preservada entre recargas |
| Monitoramento | Monitor previamente salvo retornou na nova interface; nenhuma nova verificação ou escrita de monitor foi disparada |
| Superadmin | Conta proprietária já autorizada abriu menu de plataforma e dados administrativos; nenhuma promoção de papel |
| Entrada guiada | Página com cinco segundos exibida; pausa para leitura e ação Continuar testadas; a sessão proprietária existente chegou a /admin sem pedir outra senha |
| API | `/v1/health` permaneceu ok, serviço fluxo-atento-monitor, contrato 1 |

O navegador ainda registrou aviso de diferença de hidratação na restauração do
perfil autenticado. A navegação continuou operante; registrar correção e teste
de regressão, sem tratar a ausência de erro fatal como ausência de avisos.

Não houve nova troca completa de login Google em HTTPS nesta etapa, teste de
duas identidades reais, cadastro, recuperação por e-mail, negativa administrativa
direta, expiração ou teste de carga. Esses aceites continuam pendentes. O teste
Google anterior foi local e de uma conta. Não anunciar disponibilidade comercial
geral só porque o botão está visível; branding/público de teste também têm pendências.

## O que não foi alterado

- Supabase Auth/CAPTCHA, segredos, papéis, políticas, banco e migrações.
- DNS, certificados, Netlify do app legado, API Node, agente Python, n8n e Portainer.
- Google Cloud, escopos, faturamento e integrações de Analytics/Search/Ads.
- Modo de entrada do site: permanece `login`; não foi ligado `guided` no Netlify.
- Turnstile: UI false, sem segredo instalado e sem autorização Cloudflare nova
  na CSP ativa. Código publicado não significa proteção ativada.

## Retorno seguro

Preservar o backup root-only e as duas releases. Confirmar o alvo atual antes
de qualquer retorno. O rollback deve restaurar **release + CSP correspondente +
configuração pública de build**: trocar só o symlink pode deixar hashes de outra
versão e impedir a abertura. O retorno efetivamente exercitado nesta janela
restaurou os três itens e passou em `nginx -t`, reload e navegador.

Os links públicos continuam em modo `login`, compatível com a release anterior.
Se `guided` for ativado depois, restaurar primeiro o modo compatível no site,
conforme [AUTH_ONBOARDING](AUTH_ONBOARDING.md). Se CAPTCHA for exigido no Supabase
no futuro, não voltar a uma interface sem widget sem recuperação coordenada e
autorizada conforme [TURNSTILE_SETUP](TURNSTILE_SETUP.md).

Não apagar releases/backups como parte desta entrega. A retenção e a limpeza
exigem decisão posterior. Automatizar o cálculo/verificação de CSP e o aceite
de navegador antes da promoção é uma melhoria prioritária do deploy; o script
antigo ainda não fornece esses portões sozinho.

Referências da conferência: [CSP script-src](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/script-src),
[importmap](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/script/type/importmap),
[reescrita Nginx](https://nginx.org/en/docs/http/ngx_http_rewrite_module.html#rewrite)
e [herança de cabeçalhos](https://nginx.org/en/docs/http/ngx_http_headers_module.html#add_header).
