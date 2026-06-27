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

# Prisma Migrate needs a direct Postgres connection (not PgBouncer).
if [ -z "$DIRECT_DATABASE_URL" ]; then
  if [ -n "$DATABASE_UNPOOLED_URL" ]; then
    DIRECT_DATABASE_URL="$DATABASE_UNPOOLED_URL"
  else
    DIRECT_DATABASE_URL="$DATABASE_URL"
  fi
  export DIRECT_DATABASE_URL
fi

db_host=$(node -e "try { const u = new URL(process.env.DIRECT_DATABASE_URL); console.log(u.hostname + ':' + (u.port || '5432') + u.pathname); } catch { console.log('invalid'); }")
log "Migration target (direct): ${db_host}"

log 'Checking migration status...'
npx prisma migrate status || true

log 'Waiting for Postgres and applying migrations...'
attempt=1
max_attempts=10
until npx prisma migrate deploy; do
  if [ "$attempt" -ge "$max_attempts" ]; then
    log 'ERROR: prisma migrate deploy failed after retries.'
    log 'Check api Variables: DATABASE_URL linked to Postgres, and DIRECT_DATABASE_URL or DATABASE_UNPOOLED_URL for migrations.'
    exit 1
  fi
  log "Migrate failed (attempt $attempt/$max_attempts). Retrying in 5s..."
  attempt=$((attempt + 1))
  sleep 5
done

log 'Verifying tables...'
if table_count=$(node scripts/verify-db-tables.js); then
  log "Public tables found: ${table_count}"
else
  log 'ERROR: Expected application tables after migrate deploy. Check Railway api deploy logs.'
  exit 1
fi

log 'Migration complete. Running seed...'
if npm run db:seed; then
  log 'Seed completed.'
else
  log 'WARNING: Seed failed. Tables exist but demo data may be missing.'
fi

log 'Starting NestJS API...'
exec npm run start:prod --workspace=api
