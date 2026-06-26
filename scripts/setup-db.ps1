# CEV 로컬 PostgreSQL 초기화 스크립트
# 사용법:
#   $env:PGPASSWORD='postgres관리자비밀번호'; npm run db:setup
# 또는
#   .\scripts\setup-db.ps1 -Password 'postgres관리자비밀번호'

param(
    [string]$Password = $env:PGPASSWORD,
    [string]$DbHost = "localhost",
    [int]$Port = 5432,
    [string]$AdminUser = "postgres",
    [string]$DbUser = "cev",
    [string]$DbPassword = "cev_password",
    [string]$DbName = "cev_dealer_portal"
)

$ErrorActionPreference = "Stop"

if (-not $Password) {
    Write-Host ""
    Write-Host "PostgreSQL 관리자 비밀번호가 필요합니다." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "사용법:" -ForegroundColor Cyan
    Write-Host "  `$env:PGPASSWORD='your-postgres-password'; npm run db:setup"
    Write-Host ""
    Write-Host "또는 .env 의 DATABASE_URL 을 본인 PostgreSQL 계정으로 직접 수정하세요."
    Write-Host "  예) DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/cev_dealer_portal"
    Write-Host ""
    exit 1
}

$psql = @(
    "C:\Program Files\PostgreSQL\18\bin\psql.exe",
    "C:\Program Files\PostgreSQL\17\bin\psql.exe",
    "C:\Program Files\PostgreSQL\16\bin\psql.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1

if (-not $psql) {
    Write-Host "psql.exe 를 찾을 수 없습니다. PostgreSQL 이 설치되어 있는지 확인하세요." -ForegroundColor Red
    exit 1
}

Write-Host "Using: $psql" -ForegroundColor Gray
$env:PGPASSWORD = $Password

function Invoke-Psql([string]$Sql) {
    & $psql -U $AdminUser -h $DbHost -p $Port -d postgres -v ON_ERROR_STOP=1 -c $Sql
    if ($LASTEXITCODE -ne 0) { throw "psql failed" }
}

Write-Host "Creating role '$DbUser'..." -ForegroundColor Cyan
Invoke-Psql "DO `$`$ BEGIN IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '$DbUser') THEN CREATE ROLE $DbUser LOGIN PASSWORD '$DbPassword'; END IF; END `$`$;"

Write-Host "Creating database '$DbName'..." -ForegroundColor Cyan
$dbExists = & $psql -U $AdminUser -h $DbHost -p $Port -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$DbName'"
if (-not ($dbExists -and $dbExists.Trim())) {
    Invoke-Psql "CREATE DATABASE $DbName OWNER $DbUser;"
} else {
    Write-Host "Database already exists, skipping." -ForegroundColor Gray
}

Write-Host "Granting privileges..." -ForegroundColor Cyan
Invoke-Psql "GRANT ALL PRIVILEGES ON DATABASE $DbName TO $DbUser;"

Write-Host ""
Write-Host "Database setup complete!" -ForegroundColor Green
Write-Host "DATABASE_URL=postgresql://${DbUser}:${DbPassword}@${DbHost}:${Port}/${DbName}?schema=public"
Write-Host ""
