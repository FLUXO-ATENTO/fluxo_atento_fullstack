#!/usr/bin/env bash
# Builds the dashboard as static files and switches releases atomically.
# Run as root only after the nginx site configuration has passed nginx -t.
set -Eeuo pipefail
umask 077

APP_ROOT="${APP_ROOT:-/srv/fluxo-atento-dashboard}"
REPOSITORY_DIR="${REPOSITORY_DIR:-$APP_ROOT/repository}"
RELEASE_ROOT="${RELEASE_ROOT:-$APP_ROOT/releases}"
LIVE_LINK="${LIVE_LINK:-$APP_ROOT/current}"
ENV_FILE="${ENV_FILE:-/etc/fluxo-atento/dashboard-build.env}"

fail() { printf 'ERRO: %s\n' "$*" >&2; exit 1; }
require_command() { command -v "$1" >/dev/null 2>&1 || fail "Comando ausente: $1"; }

[[ "${EUID}" -eq 0 ]] || fail 'Execute como root.'
for command in git node pnpm rsync nginx systemctl flock; do require_command "$command"; done
exec 9>/run/lock/fluxo-dashboard-deploy.lock
flock -n 9 || fail 'Outro deploy está em andamento.'
[[ -e "$REPOSITORY_DIR/.git" ]] || fail "Checkout Git ausente: $REPOSITORY_DIR"
git -C "$REPOSITORY_DIR" rev-parse --is-inside-work-tree >/dev/null || fail 'Checkout inválido.'
[[ -f "$ENV_FILE" ]] || fail "Arquivo de ambiente ausente: $ENV_FILE"
[[ "$(stat -c '%U' "$ENV_FILE")" == 'root' ]] || fail "$ENV_FILE deve pertencer a root."
[[ "$(stat -c '%a' "$ENV_FILE")" == '600' ]] || fail "$ENV_FILE deve ter permissão 0600."

node_major="$(node --version | sed -E 's/^v([0-9]+).*/\1/')"
[[ "$node_major" -ge 22 ]] || fail 'Node.js 22 ou superior é obrigatório para este projeto.'

# shellcheck disable=SC1090
set -a
. "$ENV_FILE"
set +a
for variable in NUXT_PUBLIC_SITE_URL NUXT_PUBLIC_DASHBOARD_URL NUXT_PUBLIC_MARKETING_URL NUXT_PUBLIC_API_BASE NUXT_PUBLIC_SUPABASE_URL NUXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY; do
  [[ -n "${!variable:-}" ]] || fail "Variável obrigatória ausente: $variable"
done

[[ "$NUXT_PUBLIC_SITE_URL" == 'https://app.fluxoatento.com.br' ]] || fail 'NUXT_PUBLIC_SITE_URL deve usar o domínio de produção do dashboard.'
[[ "$NUXT_PUBLIC_API_BASE" == 'https://api.fluxoatento.com.br' ]] || fail 'NUXT_PUBLIC_API_BASE deve usar a API HTTPS de produção.'
[[ "$NUXT_PUBLIC_SUPABASE_URL" == 'https://qbfmebpzxnzdpalmgtxr.supabase.co' ]] || fail 'Projeto Supabase diferente do FLUXO autorizado.'
[[ -n "${REF:-}" ]] || fail 'Informe REF com o SHA completo aprovado no PR; não selecionar a versão implicitamente.'
[[ "$REF" =~ ^[0-9a-fA-F]{40}$ ]] || fail 'REF deve ser o SHA completo aprovado, não uma branch mutável.'

install -d -o root -g root -m 0755 "$RELEASE_ROOT"
nginx -t

cd "$REPOSITORY_DIR"
[[ -z "$(git status --porcelain)" ]] || fail 'Checkout contém alterações locais. Preserve-as antes do deploy.'
git fetch --prune origin
# O responsável escolhe o commit revisado, sem mover automaticamente para main.
ref="$REF"
git rev-parse --verify --quiet "${ref}^{commit}" >/dev/null || fail "Referência Git inválida: $ref"
git switch --detach "$ref"
pnpm install --frozen-lockfile
pnpm test
pnpm exec nuxt typecheck
pnpm generate:dashboard

[[ -f dist-dashboard/index.html ]] || fail 'Build não gerou dist-dashboard/index.html.'
[[ -f dist-dashboard/.nginx-headers.conf ]] || fail 'Cabeçalhos CSP da release ausentes.'

commit="$(git rev-parse --short HEAD)"
release="$RELEASE_ROOT/$(date -u +%Y%m%dT%H%M%SZ)-$commit"
staging="$(mktemp -d "$RELEASE_ROOT/.staging.XXXXXX")"
trap 'printf "Staging preservado para diagnóstico: %s\n" "$staging" >&2' ERR

rsync -a --chmod=Du=rwx,Dgo=rx,Fu=rw,Fgo=r dist-dashboard/ "$staging/"
chmod 0755 "$staging"
mv "$staging" "$release"
trap - ERR

previous=""
if [[ -L "$LIVE_LINK" ]]; then previous="$(readlink -f "$LIVE_LINK")"; fi
ln -s "$release" "$LIVE_LINK.next"
mv -Tf "$LIVE_LINK.next" "$LIVE_LINK"

if ! nginx -t || ! systemctl reload nginx; then
  rm -f "$LIVE_LINK"
  if [[ -n "$previous" ]]; then ln -s "$previous" "$LIVE_LINK"; fi
  systemctl reload nginx || true
  fail 'Reload do Nginx falhou; a release anterior foi restaurada.'
fi

printf 'Dashboard publicado: %s\n' "$release"
printf 'Release anterior: %s\n' "${previous:-nenhuma}"
