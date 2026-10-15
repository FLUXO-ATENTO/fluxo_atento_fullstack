# Implantação segura do dashboard do FLUXO na VPS

Este procedimento hospeda apenas arquivos estáticos do dashboard em
`app.fluxoatento.com.br`. Ele não cria um processo Node permanente e não muda
os blocos Nginx de `api`, `flow` ou `infra`.

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

Todos os comandos abaixo devem ser executados como root na VPS, depois de
revisar os valores e sem colar segredos no terminal compartilhado.

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

Faça o primeiro deploy usando a revisão aprovada de `main`:

```bash
install -o root -g root -m 0750 ops/dashboard-vps/deploy-static-dashboard.sh /usr/local/sbin/fluxo-dashboard-deploy
REF=origin/main /usr/local/sbin/fluxo-dashboard-deploy
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

Para voltar para uma release específica, use o script versionado:

```bash
/usr/local/sbin/fluxo-dashboard-rollback <nome-da-release>
```

Instale o script de rollback junto com o de deploy:

```bash
install -o root -g root -m 0750 ops/dashboard-vps/rollback-static-dashboard.sh /usr/local/sbin/fluxo-dashboard-rollback
```
