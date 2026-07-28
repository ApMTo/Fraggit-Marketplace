#!/bin/sh
set -e

echo "[entrypoint] Running prisma migrate deploy..."
npx prisma migrate deploy
echo "[entrypoint] Migrations OK. Starting API..."

exec node dist/main.js
