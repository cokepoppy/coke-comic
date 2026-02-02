#!/usr/bin/env bash
set -euo pipefail

# Build Vite front-end for production.
# The output goes to front/dist.

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT/front"

# For production behind same domain, use relative API base.
cat > .env.production <<ENV
VITE_API_URL=/api
ENV

npm ci
npm run build

echo "==> Built front/dist"
