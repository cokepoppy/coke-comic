#!/usr/bin/env bash
set -euo pipefail

# Setup Nginx for a static front-end + reverse proxy to backend.
# Usage: sudo bash setup_nginx.sh comic.coke-twitter.com

DOMAIN=${1:-}
if [[ -z "$DOMAIN" ]]; then
  echo "Usage: $0 <domain>" >&2
  exit 1
fi

APP_DIR=${APP_DIR:-/opt/coke-comic}
PORT=${PORT:-5001}

SITE_CONF="/etc/nginx/sites-available/$DOMAIN"
SITE_LINK="/etc/nginx/sites-enabled/$DOMAIN"

sudo mkdir -p "$APP_DIR/front/dist"

echo "==> Writing Nginx site: $SITE_CONF"
sudo tee "$SITE_CONF" >/dev/null <<NGINX
server {
  listen 80;
  server_name $DOMAIN;

  # Frontend
  root $APP_DIR/front/dist;
  index index.html;

  # API -> backend
  location /api/ {
    proxy_pass http://127.0.0.1:$PORT/api/;
    proxy_http_version 1.1;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
  }

  # Health endpoint (optional)
  location /health {
    proxy_pass http://127.0.0.1:$PORT/health;
    proxy_set_header Host \$host;
  }

  # Uploads (served by backend)
  location /uploads/ {
    proxy_pass http://127.0.0.1:$PORT/uploads/;
    proxy_set_header Host \$host;
  }

  # SPA fallback
  location / {
    try_files \$uri \$uri/ /index.html;
  }
}
NGINX

sudo ln -sf "$SITE_CONF" "$SITE_LINK"

echo "==> Nginx config test"
sudo nginx -t

echo "==> Reloading nginx"
sudo systemctl reload nginx

echo "==> If you want HTTPS (recommended), run:"
echo "sudo certbot --nginx -d $DOMAIN"
