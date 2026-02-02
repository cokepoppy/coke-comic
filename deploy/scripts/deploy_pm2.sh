#!/usr/bin/env bash
set -euo pipefail

# Deploy backend under /opt/coke-comic, build, and run via PM2.
# NOTE: This script assumes Node.js + PM2 already installed.

APP_DIR=${APP_DIR:-/opt/coke-comic}
SERVICE_NAME=${SERVICE_NAME:-coke-comic-service}
PORT=${PORT:-5001}

# App env
DB_HOST=${DB_HOST:-127.0.0.1}
DB_PORT=${DB_PORT:-3306}
DB_NAME=${DB_NAME:-coke_comic}
DB_USER=${DB_USER:-coke_comic_user}
DB_PASSWORD=${DB_PASSWORD:-}
JWT_SECRET=${JWT_SECRET:-}
ALLOWED_ORIGINS=${ALLOWED_ORIGINS:-https://comic.coke-twitter.com}
DEFAULT_ADMIN_EMAIL=${DEFAULT_ADMIN_EMAIL:-admin@comic.coke-twitter.com}
DEFAULT_ADMIN_NAME=${DEFAULT_ADMIN_NAME:-Admin}
DEFAULT_ADMIN_PASSWORD=${DEFAULT_ADMIN_PASSWORD:-}

if [[ -z "$DB_PASSWORD" ]]; then
  echo "ERROR: DB_PASSWORD is required." >&2
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

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

echo "==> Syncing code to $APP_DIR"
sudo mkdir -p "$APP_DIR"
sudo rsync -a --delete \
  --exclude .git \
  --exclude node_modules \
  --exclude front/dist \
  --exclude server/public/uploads \
  "$REPO_ROOT/" "$APP_DIR/"

echo "==> Installing server deps + building"
cd "$APP_DIR/server"
npm ci
npm run build

echo "==> Writing server/.env (production)"
cat > "$APP_DIR/server/.env" <<ENV
PORT=$PORT
NODE_ENV=production

DB_HOST=$DB_HOST
DB_PORT=$DB_PORT
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_NAME=$DB_NAME

JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=7d

MAX_FILE_SIZE=20971520
UPLOAD_DIR=public/uploads

ALLOWED_ORIGINS=$ALLOWED_ORIGINS

# Seed admin user on boot if users table is empty
DEFAULT_ADMIN_EMAIL=$DEFAULT_ADMIN_EMAIL
DEFAULT_ADMIN_NAME=$DEFAULT_ADMIN_NAME
DEFAULT_ADMIN_PASSWORD=$DEFAULT_ADMIN_PASSWORD
ENV

echo "==> Ensuring upload dirs"
mkdir -p "$APP_DIR/server/public/uploads/covers" "$APP_DIR/server/public/uploads/pages"

echo "==> Starting via PM2"
if pm2 describe "$SERVICE_NAME" >/dev/null 2>&1; then
  pm2 restart "$SERVICE_NAME" --update-env
else
  pm2 start "$APP_DIR/server/dist/server.js" --name "$SERVICE_NAME" --update-env
fi
pm2 save

echo "==> Done. PM2 status:"
pm2 status "$SERVICE_NAME" || true
