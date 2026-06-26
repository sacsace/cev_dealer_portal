#!/bin/sh
set -e

log() {
  printf '[api-entrypoint] %s\n' "$1"
}

# Strip invalid npm env vars injected by Railway (omit="" breaks npm).
unset NPM_CONFIG_OMIT npm_config_omit NPM_CONFIG_PRODUCTION npm_config_production 2>/dev/null || true

if [ -z "$DATABASE_URL" ]; then
  log 'ERROR: DATABASE_URL is not set. Link Postgres to the api service.'
  exit 1
fi

log 'Waiting for Postgres and applying migrations...'
attempt=1
max_attempts=10
until npm run db:migrate:deploy; do
  if [ "$attempt" -ge "$max_attempts" ]; then
    log 'ERROR: prisma migrate deploy failed after retries.'
    exit 1
  fi
  log "Migrate failed (attempt $attempt/$max_attempts). Retrying in 5s..."
  attempt=$((attempt + 1))
  sleep 5
done

log 'Migration complete. Running seed...'
if npm run db:seed; then
  log 'Seed completed.'
else
  log 'WARNING: Seed failed. API will still start.'
fi

log 'Starting NestJS API...'
exec npm run start:prod --workspace=api
