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
for command in git node pnpm rsync nginx systemctl; do require_command "$command"; done
[[ -d "$REPOSITORY_DIR/.git" ]] || fail "Checkout Git ausente: $REPOSITORY_DIR"
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

install -d -o root -g root -m 0755 "$RELEASE_ROOT"
nginx -t

cd "$REPOSITORY_DIR"
git fetch --prune origin
# A produção sempre parte da referência remota já revisada. Evita usar uma
# branch local antiga por engano quando a VPS ficou algum tempo sem atualizar.
ref="${REF:-origin/main}"
git rev-parse --verify --quiet "${ref}^{commit}" >/dev/null || fail "Referência Git inválida: $ref"
git switch --detach "$ref"
git reset --hard "$ref"
pnpm install --frozen-lockfile
pnpm generate:dashboard

[[ -f dist-dashboard/index.html ]] || fail 'Build não gerou dist-dashboard/index.html.'

commit="$(git rev-parse --short HEAD)"
release="$RELEASE_ROOT/$(date -u +%Y%m%dT%H%M%SZ)-$commit"
staging="$(mktemp -d "$RELEASE_ROOT/.staging.XXXXXX")"
cleanup() { rm -rf "$staging"; }
trap cleanup EXIT

rsync -a --delete --chmod=Du=rwx,Dgo=rx,Fu=rw,Fgo=r dist-dashboard/ "$staging/"
mv "$staging" "$release"
trap - EXIT

previous=""
if [[ -L "$LIVE_LINK" ]]; then previous="$(readlink -f "$LIVE_LINK")"; fi
ln -s "$release" "$LIVE_LINK.next"
mv -Tf "$LIVE_LINK.next" "$LIVE_LINK"

if ! systemctl reload nginx; then
  rm -f "$LIVE_LINK"
  if [[ -n "$previous" ]]; then ln -s "$previous" "$LIVE_LINK"; fi
  systemctl reload nginx || true
  fail 'Reload do Nginx falhou; a release anterior foi restaurada.'
fi

printf 'Dashboard publicado: %s\n' "$release"
printf 'Release anterior: %s\n' "${previous:-nenhuma}"
