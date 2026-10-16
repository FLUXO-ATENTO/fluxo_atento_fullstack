# Implantação segura do dashboard do FLUXO na VPS

Este procedimento hospeda apenas arquivos estáticos do dashboard em
`app.fluxoatento.com.br`. Ele não cria um processo Node permanente e não muda
os blocos Nginx de `api`, `flow` ou `infra`.

## Estado atual e limites dos exemplos

A publicação autorizada de 15/10/2026 está registrada em
[DEPLOYMENT_2026-10-15](../../docs/DEPLOYMENT_2026-10-15.md), com commit, releases,
backup e aceites. No servidor existente, o arquivo ativo chama-se
`/etc/nginx/sites-available/fluxo-atento-dashboard`, não `fluxo-atento-app`.
Resolva o arquivo habilitado e o alvo de `current` antes de operar; não crie um
segundo bloco para o mesmo domínio nem repita a instalação inicial.

**Os scripts e o template HTTPS deste diretório não automatizam todos os
portões de publicação.** O deploy legado usa `git reset --hard`; não o execute
em checkout com mudanças a preservar. O rollback legado troca o symlink, mas
não restaura a CSP correspondente. O template HTTPS não contém os hashes dos
scripts inline gerados pelo Nuxt e ainda usa a resolução de diretórios anterior.
Não o copie sobre o servidor existente sem preparar esses ajustes. A publicação
registrada usou worktree isolada no commit aprovado e configuração conferida.

### Requisitos operacionais por release

1. Confirme PR/CI/revisão humana e autorização operacional; fixe o commit.
   Preserve release, configuração Nginx e arquivo público de build atuais em
   backup restrito. Não inclua segredos no artefato ou nos logs.
2. Gere o dashboard em checkout isolado, confira as rotas e execute o scanner.
   Calcule os hashes CSP a partir do HTML final: inclua **importmap** e scripts
   inline executáveis, não apenas JavaScript com tipo explícito. Blocos JSON de
   dados não são scripts executáveis. Não libere `unsafe-inline`/`unsafe-eval`
   para contornar falha de inicialização.
3. Prepare a CSP correspondente ao artefato e preserve os assets antigos com
   hash para abas abertas. Validar apenas HTTP 200 não detecta a falha de
   inicialização `NUXT_E1005` observada nesta publicação.
4. Mantenha URLs de página sem barra final, consulta preservada e 404 real para
   caminhos inexistentes. A regra validada em produção está abaixo. HTML deve
   receber `Cache-Control: no-store` no nível do servidor; não declare um
   `add_header` isolado em `/index.html`, pois isso pode eliminar a herança da
   CSP. Preserve o cache imutável de `/_nuxt/`.
5. Valide Nginx antes do reload e confira navegador, sessão, menu de papel e
   dados existentes. Se falhar, restaure o conjunto release/configuração/env,
   valide novamente e registre o ocorrido. Não ative CAPTCHA ou integração
   externa como efeito implícito do deploy.

Trecho de roteamento efetivamente validado (não é uma configuração completa):

```nginx
# No bloco server HTTPS, junto aos demais cabeçalhos:
add_header Cache-Control "no-store" always;

location = /index.html {
    try_files $uri =404;
}

location / {
    rewrite ^(.+)/$ $1 permanent;
    try_files $uri/index.html $uri.html $uri =404;
}
```

Automatizar esses portões e sincronizar os templates/scripts exige uma mudança
própria, com testes e revisão. Este registro documental não altera os scripts.

## Pré-requisitos e decisão de DNS

1. O PR que adiciona `pnpm generate:dashboard` e este PR precisam estar
   mesclados em `main` antes do primeiro deploy de produção.
2. O subdomínio `app.fluxoatento.com.br` precisa apontar para a VPS, não para
   a Netlify. Como o DNS é gerenciado pela Netlify, substitua apenas o registro
   de `app` pelo registro automático/endereçamento que leva à VPS. Não altere
   `api`, `flow`, `infra`, raiz ou `www`.
3. Espere a resolução pública de `app.fluxoatento.com.br` para o IP da VPS
   antes de solicitar o certificado.
4. Verifique previamente a presença de `nginx`, `certbot`, `git`, `rsync`,
   Node.js 22+ e pnpm. Não execute atualização ampla do sistema como parte
   deste deploy.

## Instalação inicial

Esta seção é referência **somente para um servidor novo**. Os comandos abaixo
exigem revisão e autorização, preparação da CSP/rotas acima e valores conferidos.
Não repita a criação do arquivo de ambiente em uma instalação existente: isso
apagaria seu conteúdo. Nunca cole segredos no terminal compartilhado.

```bash
install -d -o root -g root -m 0755 /srv/fluxo-atento-dashboard/releases
install -d -o root -g root -m 0755 /var/lib/letsencrypt/.well-known/acme-challenge
git clone https://github.com/FLUXO-ATENTO/fluxo_atento_fullstack.git /srv/fluxo-atento-dashboard/repository
install -d -o root -g root -m 0700 /etc/fluxo-atento
install -o root -g root -m 0600 /dev/null /etc/fluxo-atento/dashboard-build.env
```

Preencha `/etc/fluxo-atento/dashboard-build.env` com base em
`dashboard-build.env.example`. Inclua somente a URL e a chave **publicável**
do Supabase; chaves administrativas não pertencem ao build do navegador.

Instale primeiro o Nginx HTTP inicial, valide e recarregue:

```bash
install -o root -g root -m 0644 ops/dashboard-vps/nginx-app-http.conf /etc/nginx/sites-available/fluxo-atento-app
ln -s /etc/nginx/sites-available/fluxo-atento-app /etc/nginx/sites-enabled/fluxo-atento-app
nginx -t && systemctl reload nginx
```

Depois que o DNS apontar para a VPS, emita o certificado sem redirecionamento
automático de configuração:

```bash
certbot certonly --webroot -w /var/lib/letsencrypt -d app.fluxoatento.com.br
```

Substitua o arquivo Nginx pela configuração HTTPS e valide novamente:

```bash
install -o root -g root -m 0644 ops/dashboard-vps/nginx-app-https.conf /etc/nginx/sites-available/fluxo-atento-app
nginx -t && systemctl reload nginx
```

O script legado pode ser instalado para inspeção, mas **não é um comando pronto
para publicação sem os portões acima**. Use uma revisão aprovada e fixa, não um
`origin/main` móvel; preserve alterações locais antes de qualquer operação Git:

```bash
install -o root -g root -m 0750 ops/dashboard-vps/deploy-static-dashboard.sh /usr/local/sbin/fluxo-dashboard-deploy
```

## Validação obrigatória após o deploy

A nova entrada `/acessar` deve ser publicada e aceita **antes** de ser anunciada
pelo site, Docs e agente. Até lá, o helper público mantém `/login/` com
`NUXT_PUBLIC_DASHBOARD_ENTRY_MODE=login`. O modo `guided` exige novo build do site
após o aceite; não é configurado por adicionar um retorno no Supabase. Sequência
completa e rollback coordenado em [AUTH_ONBOARDING](../../docs/AUTH_ONBOARDING.md).

```bash
curl --fail --silent --show-error --head https://app.fluxoatento.com.br/
curl --fail --silent --show-error --head https://app.fluxoatento.com.br/acessar
curl --fail --silent --show-error --head https://app.fluxoatento.com.br/login/
curl --fail --silent --show-error --head https://app.fluxoatento.com.br/auth/callback/
curl --fail --silent --show-error https://api.fluxoatento.com.br/v1/health
nginx -t
```

Os quatro primeiros comandos conferem HTTPS e rotas estáticas. A chamada a
`/v1/health` só deve passar depois que a API de monitoramento for implantada
separadamente na VPS.
Não trate a página renderizada como prova de Auth, RLS ou criação de monitores:
a jornada com duas contas continua obrigatória. Abra também cada rota em nova
aba e com recarga, conferindo a página correta; um fallback genérico HTTP 200
não comprova a publicação da tela. Não registrar códigos de retorno OAuth.

## Rollback

Ao habilitar Turnstile, seguir também [TURNSTILE_SETUP](../../docs/TURNSTILE_SETUP.md):
publicar a UI com chave pública e instalar o CSP atualizado antes de exigir
CAPTCHA no Supabase. O segredo não vai para o build. Reverter para uma release
sem widget enquanto o Supabase exige CAPTCHA bloqueia ações por e-mail;
coordenar a recuperação com o responsável, sem desligar proteção automaticamente.

Cada deploy cria uma diretório imutável em
`/srv/fluxo-atento-dashboard/releases`. Para listar releases:

```bash
ls -1 /srv/fluxo-atento-dashboard/releases
```

Para voltar para uma release específica, restaure também sua configuração Nginx
com os hashes CSP correspondentes e, quando necessário, o arquivo público de
build. Preserve os backups e confira a configuração antes do reload. O script
versionado `rollback-static-dashboard.sh` **não restaura esses arquivos**;
usá-lo sozinho pode deixar o navegador bloqueado mesmo com HTTP 200.

Confira raiz, login, entrada guiada, sessão e saúde da API depois do retorno.
O procedimento completo exercitado em produção está no registro de publicação.

Instale o script de rollback junto com o de deploy:

```bash
install -o root -g root -m 0750 ops/dashboard-vps/rollback-static-dashboard.sh /usr/local/sbin/fluxo-dashboard-rollback
```
