#!/usr/bin/env bash
set -euo pipefail

# Create DB + user for coke-comic, and run migrations.
# NOTE: This script assumes MySQL server is already installed/running on the VPS.
# It does NOT install MySQL.

DB_NAME=${DB_NAME:-coke_comic}
DB_USER=${DB_USER:-coke_comic_user}
DB_PASS=${DB_PASS:-}
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-3306}

MYSQL_ROOT_USER=${MYSQL_ROOT_USER:-root}
MYSQL_ROOT_PASS=${MYSQL_ROOT_PASS:-}
MYSQL_USE_SUDO=${MYSQL_USE_SUDO:-0}

if [[ -z "$DB_PASS" ]]; then
  echo "ERROR: DB_PASS is required (the password for the app DB user)." >&2
  exit 1
fi

# Build mysql command
MYSQL=(mysql -u"$MYSQL_ROOT_USER")
if [[ "$MYSQL_USE_SUDO" == "1" ]]; then
  MYSQL=(sudo "${MYSQL[@]}")
fi

# If DB_HOST is "localhost", prefer MySQL socket auth (common on Ubuntu) by NOT forcing TCP.
if [[ "$DB_HOST" != "localhost" && -n "$DB_HOST" ]]; then
  MYSQL+=( -h"$DB_HOST" -P"$DB_PORT" )
fi

if [[ -n "$MYSQL_ROOT_PASS" ]]; then
  MYSQL+=( -p"$MYSQL_ROOT_PASS" )
fi

echo "==> Creating database and user (if not exists): $DB_NAME / $DB_USER"
"${MYSQL[@]}" <<SQL
CREATE DATABASE IF NOT EXISTS \`$DB_NAME\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '$DB_USER'@'%' IDENTIFIED BY '$DB_PASS';
GRANT ALL PRIVILEGES ON \`$DB_NAME\`.* TO '$DB_USER'@'%';
FLUSH PRIVILEGES;
SQL

echo "==> Running migrations"
for f in "$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"/server/migrations/*.sql; do
  echo "--> $f"
  "${MYSQL[@]}" "$DB_NAME" < "$f"
done

echo "==> Done"
