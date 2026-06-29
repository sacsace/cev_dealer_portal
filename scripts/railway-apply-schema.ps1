# Apply Prisma schema to Railway Postgres (migrate + seed).
# Prerequisites: railway login, then railway link (select api service).
param(
  [switch]$MigrateOnly,
  [switch]$SeedOnly
)

$ErrorActionPreference = 'Stop'

function Require-Railway {
  if (-not (Get-Command railway -ErrorAction SilentlyContinue)) {
    Write-Host 'Install Railway CLI: npm i -g @railway/cli' -ForegroundColor Red
    exit 1
  }
  if ($env:RAILWAY_TOKEN -or $env:RAILWAY_API_TOKEN) {
    Write-Host 'Railway: using RAILWAY_TOKEN / RAILWAY_API_TOKEN from environment.' -ForegroundColor Green
    return
  }
  $whoami = railway whoami 2>&1
  if ($LASTEXITCODE -ne 0) {
    Write-Host 'Run `railway login` first, then `railway link` in this repo (select the api service).' -ForegroundColor Red
    Write-Host 'Or set RAILWAY_TOKEN for non-interactive use: https://docs.railway.com/guides/cli' -ForegroundColor Yellow
    exit 1
  }
  Write-Host "Railway: $whoami" -ForegroundColor Green
}

Require-Railway

$envBlock = @'
if [ -z "$DIRECT_DATABASE_URL" ]; then
  if [ -n "$DATABASE_UNPOOLED_URL" ]; then export DIRECT_DATABASE_URL="$DATABASE_UNPOOLED_URL"
  else export DIRECT_DATABASE_URL="$DATABASE_URL"; fi
fi
'@

if (-not $SeedOnly) {
  Write-Host 'Applying migrations (prisma migrate deploy)...' -ForegroundColor Cyan
  railway run sh -lc "$envBlock && npx prisma migrate deploy"
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  Write-Host 'Migrations applied.' -ForegroundColor Green
}

if (-not $MigrateOnly) {
  Write-Host 'Seeding demo data...' -ForegroundColor Cyan
  railway run sh -lc "$envBlock && npm run db:seed"
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  Write-Host 'Seed completed.' -ForegroundColor Green
}

Write-Host ''
Write-Host 'Done. Refresh Postgres -> Data tab to see tables.' -ForegroundColor Cyan
Write-Host 'Login: root / admin123  |  admin@cev.local / Admin@123  |  FH001 / Dealer@123' -ForegroundColor Yellow
