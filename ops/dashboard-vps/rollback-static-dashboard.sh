#!/usr/bin/env bash
# Switches the static dashboard symlink to an existing release without rebuild.
set -Eeuo pipefail

APP_ROOT="${APP_ROOT:-/srv/fluxo-atento-dashboard}"
RELEASE_ROOT="${RELEASE_ROOT:-$APP_ROOT/releases}"
LIVE_LINK="${LIVE_LINK:-$APP_ROOT/current}"
release_name="${1:?Uso: rollback-static-dashboard.sh <nome-da-release>}"
target="$(readlink -f "$RELEASE_ROOT/$release_name")"

case "$target" in
  "$RELEASE_ROOT"/*) ;;
  *) printf 'ERRO: release inválida.\n' >&2; exit 1 ;;
esac
[[ -f "$target/index.html" ]] || { printf 'ERRO: index.html ausente na release.\n' >&2; exit 1; }

nginx -t
previous="$(readlink -f "$LIVE_LINK" 2>/dev/null || true)"
ln -s "$target" "$LIVE_LINK.next"
mv -Tf "$LIVE_LINK.next" "$LIVE_LINK"
if ! systemctl reload nginx; then
  rm -f "$LIVE_LINK"
  [[ -n "$previous" ]] && ln -s "$previous" "$LIVE_LINK"
  systemctl reload nginx || true
  printf 'ERRO: reload falhou; rollback do rollback efetuado.\n' >&2
  exit 1
fi
printf 'Dashboard retornou para: %s\n' "$target"
