# CEV DB migration — run steps in order (local -> verify -> Railway).
param(
  [switch]$LocalOnly,
  [switch]$SkipSeed
)

$ErrorActionPreference = 'Stop'
$Root = Split-Path $PSScriptRoot -Parent
Set-Location $Root

function Step([string]$Title) {
  Write-Host ''
  Write-Host "=== $Title ===" -ForegroundColor Cyan
}

Step '1/4 Local migrate deploy'
npm run db:migrate:deploy
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Step '2/4 Local verify'
npm run db:verify
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

if ($LocalOnly) {
  Write-Host ''
  Write-Host 'Local migration complete. Railway step skipped (-LocalOnly).' -ForegroundColor Green
  exit 0
}

Step '3/4 Railway auth check'
if (-not (Get-Command railway -ErrorAction SilentlyContinue)) {
  Write-Host 'Install Railway CLI: npm i -g @railway/cli' -ForegroundColor Red
  exit 1
}

$railwayOk = $false
if ($env:RAILWAY_TOKEN -or $env:RAILWAY_API_TOKEN) {
  $railwayOk = $true
  Write-Host 'Using RAILWAY_TOKEN / RAILWAY_API_TOKEN from environment.' -ForegroundColor Green
} else {
  $whoami = railway whoami 2>&1
  if ($LASTEXITCODE -eq 0) {
    $railwayOk = $true
    Write-Host "Railway: $whoami" -ForegroundColor Green
  }
}

if (-not $railwayOk) {
  Write-Host ''
  Write-Host 'Railway login required before step 4.' -ForegroundColor Yellow
  Write-Host '  1) railway login'
  Write-Host '  2) cd to repo root and run: railway link   (select api service)'
  Write-Host '  3) re-run: .\scripts\db-migrate-all.ps1'
  Write-Host ''
  Write-Host 'Alternative: Railway dashboard -> api -> Redeploy (entrypoint runs migrate deploy automatically).' -ForegroundColor Yellow
  exit 1
}

Step '4/4 Railway migrate deploy'
$args = @()
if ($SkipSeed) { $args += '-MigrateOnly' }
& "$PSScriptRoot\railway-apply-schema.ps1" @args
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ''
Write-Host 'All steps completed (local + Railway).' -ForegroundColor Green
