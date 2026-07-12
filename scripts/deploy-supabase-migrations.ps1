<#
Apply new Supabase SQL migrations to a target Postgres instance using `psql`.

Usage (PowerShell):
 $env:DATABASE_URL = 'postgres://user:pass@host:5432/dbname'
 ./scripts/deploy-supabase-migrations.ps1

Requirements: `psql` must be installed and on PATH.
#>

$ErrorActionPreference = 'Stop'

if (-not $env:DATABASE_URL) {
  Write-Host "ERROR: Set the environment variable DATABASE_URL to your Postgres connection string." -ForegroundColor Red
  exit 1
}

$migrations = @(
  "supabase/migrations/20260606020000_lockdown_token_rpcs.sql",
  "supabase/migrations/20260606020100_lockdown_project_submissions.sql",
  "supabase/migrations/20260606021000_narrow_teacher_update_policy.sql"
)

foreach ($file in $migrations) {
  if (-not (Test-Path $file)) {
    Write-Host "Migration file not found: $file" -ForegroundColor Yellow
    continue
  }
  Write-Host "Applying $file..."
  & psql $env:DATABASE_URL -f $file
  if ($LASTEXITCODE -ne 0) {
    Write-Host "psql failed on $file with exit code $LASTEXITCODE" -ForegroundColor Red
    exit $LASTEXITCODE
  }
}

Write-Host "Migrations applied (or skipped if missing)." -ForegroundColor Green
