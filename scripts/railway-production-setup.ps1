# Railway production setup helper (run after `railway login` and `railway link`)
param(
  [switch]$GenerateSecretsOnly,
  [switch]$RunSeed
)

$ErrorActionPreference = 'Stop'

function New-RandomSecret {
  [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
}

Write-Host '=== CEV Railway Production Setup ===' -ForegroundColor Cyan
Write-Host ''

$jwtSecret = New-RandomSecret
$jwtRefreshSecret = New-RandomSecret
while ($jwtRefreshSecret -eq $jwtSecret) {
  $jwtRefreshSecret = New-RandomSecret
}

Write-Host 'Paste these into Railway -> api -> Variables:' -ForegroundColor Yellow
Write-Host "JWT_SECRET=$jwtSecret"
Write-Host "JWT_REFRESH_SECRET=$jwtRefreshSecret"
Write-Host ''
Write-Host 'web Variables (use your actual domains):' -ForegroundColor Yellow
Write-Host 'NEXT_PUBLIC_API_URL=https://<api-domain>/api'
Write-Host 'NEXT_PUBLIC_SITE_URL=https://web-production-f5770.up.railway.app'
Write-Host ''
Write-Host 'Delete if present on web/api:' -ForegroundColor Yellow
Write-Host 'NPM_CONFIG_OMIT, NPM_CONFIG_PRODUCTION'
Write-Host ''

if ($GenerateSecretsOnly) {
  exit 0
}

if (-not (Get-Command railway -ErrorAction SilentlyContinue)) {
  Write-Host 'Railway CLI not found. Install: npm i -g @railway/cli' -ForegroundColor Red
  exit 1
}

$whoami = railway whoami 2>&1
if ($LASTEXITCODE -ne 0) {
  Write-Host 'Run `railway login` first, then `railway link` in this repo.' -ForegroundColor Red
  exit 1
}

Write-Host "Logged in as: $whoami" -ForegroundColor Green

if ($RunSeed) {
  Write-Host 'Running migrate + seed on linked api service...' -ForegroundColor Cyan
  railway run npm run db:deploy
  if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
  }
  Write-Host 'Seed completed.' -ForegroundColor Green
  exit 0
}

Write-Host 'Next steps:' -ForegroundColor Cyan
Write-Host '1. Set api/web Variables in Railway dashboard (JWT values above)'
Write-Host '2. api -> Config-as-code -> railway.api.toml'
Write-Host '3. web -> Config-as-code -> railway.web.toml'
Write-Host '4. Redeploy api and web with Clear build cache'
Write-Host '5. Or after JWT is set: .\scripts\railway-production-setup.ps1 -RunSeed'
