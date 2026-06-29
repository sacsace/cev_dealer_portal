# Apply Prisma schema to Railway Postgres (migrate + seed).
# Prerequisites: railway login, then railway link (api service recommended).
param(
  [switch]$MigrateOnly,
  [switch]$SeedOnly
)

$ErrorActionPreference = 'Stop'
$Root = Split-Path $PSScriptRoot -Parent
Set-Location $Root

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

function Get-RailwayPublicDatabaseUrl {
  $linkedJson = railway variables --json 2>&1
  if ($LASTEXITCODE -ne 0) {
    throw 'Failed to read Railway variables. Run `railway link` in this repo first.'
  }

  $linked = $linkedJson | ConvertFrom-Json
  if ($linked.DATABASE_PUBLIC_URL) {
    return $linked.DATABASE_PUBLIC_URL
  }

  $projectId = $linked.RAILWAY_PROJECT_ID
  $environment = $linked.RAILWAY_ENVIRONMENT_NAME
  if (-not $projectId -or -not $environment) {
    throw 'Linked Railway project/environment not found.'
  }

  $postgresJson = railway variables --service Postgres --project $projectId --environment $environment --json 2>&1
  if ($LASTEXITCODE -ne 0) {
    throw 'Failed to read Postgres service variables.'
  }

  $postgres = $postgresJson | ConvertFrom-Json
  if (-not $postgres.DATABASE_PUBLIC_URL) {
    throw 'DATABASE_PUBLIC_URL not found on Postgres service.'
  }

  return $postgres.DATABASE_PUBLIC_URL
}

Require-Railway

$publicUrl = Get-RailwayPublicDatabaseUrl
$env:DATABASE_URL = $publicUrl
$env:DIRECT_DATABASE_URL = $publicUrl

Write-Host 'Using Railway DATABASE_PUBLIC_URL for Prisma migrate.' -ForegroundColor Gray

if (-not $SeedOnly) {
  Write-Host 'Applying migrations (prisma migrate deploy)...' -ForegroundColor Cyan
  npx prisma migrate deploy
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  Write-Host 'Migrations applied.' -ForegroundColor Green
}

if (-not $MigrateOnly) {
  Write-Host 'Seeding demo data...' -ForegroundColor Cyan
  npm run db:seed
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  Write-Host 'Seed completed.' -ForegroundColor Green
}

Write-Host ''
Write-Host 'Done. Refresh Postgres -> Data tab to see tables.' -ForegroundColor Cyan
