#!/usr/bin/env bash
set -euo pipefail

# Deploy to a remote VPS over SSH (password via sshpass).
#
# Example:
#   export SSH_HOST=107.174.39.191 SSH_PORT=2222 SSH_USER=root SSH_PASS='...'
#   export DOMAIN=comic.coke-twitter.com
#   export DB_PASS='...' DB_PASSWORD='...' JWT_SECRET='...' DEFAULT_ADMIN_PASSWORD='...'
#   bash deploy/scripts/deploy_remote.sh
#
# Defaults:
# - STAGING_DIR: /opt/coke-comic-src  (rsync target)
# - APP_DIR:     /opt/coke-comic      (runtime + nginx root)

DOMAIN=${DOMAIN:-comic.coke-twitter.com}

SSH_HOST=${SSH_HOST:-}
SSH_PORT=${SSH_PORT:-22}
SSH_USER=${SSH_USER:-root}
SSH_PASS=${SSH_PASS:-}

STAGING_DIR=${STAGING_DIR:-/opt/coke-comic-src}
APP_DIR=${APP_DIR:-/opt/coke-comic}
PORT=${PORT:-5001}
SERVICE_NAME=${SERVICE_NAME:-coke-comic-service}

DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-3306}
DB_NAME=${DB_NAME:-coke_comic}
DB_USER=${DB_USER:-coke_comic_user}
DB_PASS=${DB_PASS:-}

DB_PASSWORD=${DB_PASSWORD:-}
JWT_SECRET=${JWT_SECRET:-}
ALLOWED_ORIGINS=${ALLOWED_ORIGINS:-https://comic.coke-twitter.com}
DEFAULT_ADMIN_EMAIL=${DEFAULT_ADMIN_EMAIL:-admin@comic.coke-twitter.com}
DEFAULT_ADMIN_NAME=${DEFAULT_ADMIN_NAME:-Admin}
DEFAULT_ADMIN_PASSWORD=${DEFAULT_ADMIN_PASSWORD:-}

ISSUE_HTTPS=${ISSUE_HTTPS:-0}
CERTBOT_EMAIL=${CERTBOT_EMAIL:-}

if [[ -z "$SSH_HOST" ]]; then
  echo "ERROR: SSH_HOST is required." >&2
  exit 1
fi
if [[ -z "$SSH_PASS" ]]; then
  echo "ERROR: SSH_PASS is required (used by sshpass)." >&2
  exit 1
fi
if [[ -z "$DB_PASS" ]]; then
  echo "ERROR: DB_PASS is required (password for MySQL app user)." >&2
  exit 1
fi
if [[ -z "$DB_PASSWORD" ]]; then
  echo "ERROR: DB_PASSWORD is required (used by server/.env)." >&2
  exit 1
fi
if [[ -z "$JWT_SECRET" ]]; then
  echo "ERROR: JWT_SECRET is required." >&2
  exit 1
fi
if [[ -z "$DEFAULT_ADMIN_PASSWORD" ]]; then
  echo "ERROR: DEFAULT_ADMIN_PASSWORD is required." >&2
  exit 1
fi

if ! command -v sshpass >/dev/null 2>&1; then
  echo "ERROR: sshpass not found. Install it locally (e.g. brew install sshpass)." >&2
  exit 1
fi

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SSH_OPTS=(-p "$SSH_PORT" -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null)

echo "==> Rsync code to $SSH_USER@$SSH_HOST:$STAGING_DIR"
sshpass -p "$SSH_PASS" ssh "${SSH_OPTS[@]}" "$SSH_USER@$SSH_HOST" "mkdir -p '$STAGING_DIR' '$APP_DIR'"
sshpass -p "$SSH_PASS" rsync -az --delete \
  -e "ssh ${SSH_OPTS[*]}" \
  --exclude .git \
  --exclude .DS_Store \
  --exclude node_modules \
  --exclude "*/node_modules" \
  --exclude "*/node_modules/**" \
  --exclude "server/public/uploads" \
  --exclude "server/public/uploads/**" \
  --exclude "front/dist" \
  --exclude "front/dist/**" \
  --exclude "server/dist" \
  --exclude "server/dist/**" \
  --exclude ".env" \
  --exclude ".env.*" \
  --exclude "front/.env.production" \
  "$REPO_ROOT/" "$SSH_USER@$SSH_HOST:$STAGING_DIR/"

echo "==> Remote deploy (MySQL -> PM2 -> front build -> Nginx)"
sshpass -p "$SSH_PASS" ssh "${SSH_OPTS[@]}" "$SSH_USER@$SSH_HOST" bash -s <<EOF
set -euo pipefail

if ss -ltn | awk '{print \$4}' | grep -q ":$PORT\$"; then
  echo "==> Note: port $PORT already has a listener; continuing (re-deploy)."
fi

chmod +x "$STAGING_DIR/deploy/scripts/"*.sh || true
chmod +x "$APP_DIR/deploy/scripts/"*.sh || true

cd "$STAGING_DIR"

echo "==> [1/5] Init MySQL DB + run migrations"
DB_HOST="$DB_HOST" DB_PORT="$DB_PORT" DB_NAME="$DB_NAME" DB_USER="$DB_USER" DB_PASS="$DB_PASS" bash deploy/scripts/init_mysql.sh

echo "==> [2/5] Deploy backend via PM2"
APP_DIR="$APP_DIR" SERVICE_NAME="$SERVICE_NAME" PORT="$PORT" \
DB_HOST="$DB_HOST" DB_PORT="$DB_PORT" DB_NAME="$DB_NAME" DB_USER="$DB_USER" DB_PASSWORD="$DB_PASSWORD" \
JWT_SECRET="$JWT_SECRET" ALLOWED_ORIGINS="$ALLOWED_ORIGINS" \
DEFAULT_ADMIN_EMAIL="$DEFAULT_ADMIN_EMAIL" DEFAULT_ADMIN_NAME="$DEFAULT_ADMIN_NAME" DEFAULT_ADMIN_PASSWORD="$DEFAULT_ADMIN_PASSWORD" \
bash deploy/scripts/deploy_pm2.sh

echo "==> [3/5] Build frontend"
cd "$APP_DIR"
bash deploy/scripts/build_front.sh

echo "==> [4/5] Configure Nginx"
APP_DIR="$APP_DIR" PORT="$PORT" bash deploy/scripts/setup_nginx.sh "$DOMAIN"

if [[ "$ISSUE_HTTPS" == "1" ]]; then
  if command -v certbot >/dev/null 2>&1; then
    echo "==> [5/5] Issue/renew HTTPS cert via certbot"
    if [[ -n "$CERTBOT_EMAIL" ]]; then
      certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m "$CERTBOT_EMAIL" --redirect
    else
      certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --register-unsafely-without-email --redirect
    fi
  else
    echo "==> [5/5] certbot not found; skipping HTTPS"
  fi
else
  echo "==> [5/5] Skipping HTTPS (ISSUE_HTTPS=0)"
fi

echo "==> Smoke tests"
curl -fsS "http://127.0.0.1:$PORT/health" >/dev/null
curl -fsS -H "Host: $DOMAIN" "http://127.0.0.1/health" >/dev/null
code=\$(curl -sS -o /dev/null -w "%{http_code}" -H "Host: $DOMAIN" "http://127.0.0.1/api/auth/me" || true)
echo "==> /api/auth/me status: \$code (expected 401 without token)"

echo "==> OK"
EOF
