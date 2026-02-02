#!/usr/bin/env bash
set -euo pipefail

# One-shot deploy for coke-comic:
# - (optional) init MySQL DB + run migrations
# - deploy backend via PM2
# - build frontend
# - configure Nginx for the domain
# - (optional) issue HTTPS cert via certbot
#
# Usage:
#   DB_PASS=... DB_PASSWORD=... JWT_SECRET=... DEFAULT_ADMIN_PASSWORD=... \
#   bash deploy/scripts/deploy_all.sh comic.coke-twitter.com
#
# Notes:
# - This script assumes MySQL/Redis already exist on the VPS (it won't install them).
# - Requires: Node.js, npm, pm2, nginx, and (optionally) certbot.

DOMAIN=${1:-}
if [[ -z "$DOMAIN" ]]; then
  echo "Usage: $0 <domain>" >&2
  exit 1
fi

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

APP_DIR=${APP_DIR:-/opt/coke-comic}
PORT=${PORT:-5001}

SKIP_DB=${SKIP_DB:-0}
SKIP_HTTPS=${SKIP_HTTPS:-0}

if [[ "$SKIP_DB" != "1" ]]; then
  if [[ -z "${DB_PASS:-}" ]]; then
    echo "ERROR: DB_PASS is required for init_mysql.sh (password for app DB user)." >&2
    exit 1
  fi
  echo "==> [1/5] Init MySQL DB + run migrations"
  (cd "$REPO_ROOT" && DB_HOST="${DB_HOST:-localhost}" DB_PORT="${DB_PORT:-3306}" bash deploy/scripts/init_mysql.sh)
else
  echo "==> [1/5] Skipping DB init (SKIP_DB=1)"
fi

echo "==> [2/5] Deploy backend via PM2"
(cd "$REPO_ROOT" && PORT="$PORT" APP_DIR="$APP_DIR" bash deploy/scripts/deploy_pm2.sh)

echo "==> [3/5] Build frontend"
(cd "$APP_DIR" && bash deploy/scripts/build_front.sh)

echo "==> [4/5] Configure Nginx"
(cd "$APP_DIR" && PORT="$PORT" APP_DIR="$APP_DIR" bash deploy/scripts/setup_nginx.sh "$DOMAIN")

if [[ "$SKIP_HTTPS" != "1" ]]; then
  if command -v certbot >/dev/null 2>&1; then
    echo "==> [5/5] Issue/renew HTTPS cert via certbot"
    if [[ -n "${CERTBOT_EMAIL:-}" ]]; then
      sudo certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m "$CERTBOT_EMAIL" --redirect
    else
      sudo certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --register-unsafely-without-email --redirect
    fi
  else
    echo "==> [5/5] certbot not found; skipping HTTPS"
  fi
else
  echo "==> [5/5] Skipping HTTPS (SKIP_HTTPS=1)"
fi

echo "==> Done"
