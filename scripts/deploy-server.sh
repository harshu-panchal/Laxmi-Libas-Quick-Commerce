#!/usr/bin/env bash
# Run ON YOUR VPS (SSH), not on local Windows.
# Example: bash scripts/deploy-server.sh
set -euo pipefail

REPO_DIR="${REPO_DIR:-$HOME/Laxmi-Libas-Quick-Commerce}"
WEB_ROOT="${WEB_ROOT:-/var/www/laxmart.store/html}"
PM2_APP="${PM2_APP:-laxmart-backend}"

echo "==> Deploy from $REPO_DIR"
cd "$REPO_DIR"

echo "==> git pull"
git pull origin main

echo "==> backend install + build"
cd "$REPO_DIR/backend"
npm install
npm run build

echo "==> backend restart (pm2)"
if command -v pm2 >/dev/null 2>&1; then
  pm2 restart "$PM2_APP" || pm2 start dist/server.js --name "$PM2_APP"
  pm2 save
else
  echo "WARN: pm2 not found. Restart backend manually."
fi

echo "==> frontend install + build"
cd "$REPO_DIR/frontend"
npm install
npm run build

echo "==> publish frontend dist -> $WEB_ROOT"
mkdir -p "$WEB_ROOT"
rsync -av --delete dist/ "$WEB_ROOT/"

echo "==> done"
echo "Verify: open https://laxmart.store and console should show [LaxMart] frontend build: order-sound-v5"
