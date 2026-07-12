<#
Quick tests to validate the migration effects against a Supabase project.

Set these env vars before running:
 $env:SUPABASE_URL, $env:SUPABASE_ANON_KEY, $env:SUPABASE_SERVICE_ROLE_KEY

Usage (PowerShell):
 ./scripts/test-supabase-migrations.ps1

This script performs basic HTTP calls to the RPC endpoints to verify permission differences.
#>

$ErrorActionPreference = 'Stop'

if (-not $env:SUPABASE_URL) { Write-Host 'Set SUPABASE_URL' -ForegroundColor Red; exit 1 }
if (-not $env:SUPABASE_ANON_KEY) { Write-Host 'Set SUPABASE_ANON_KEY' -ForegroundColor Red; exit 1 }
if (-not $env:SUPABASE_SERVICE_ROLE_KEY) { Write-Host 'Set SUPABASE_SERVICE_ROLE_KEY' -ForegroundColor Yellow }

function RpcCall($rpcName, $bodyJson, $key) {
  $url = "$($env:SUPABASE_URL.TrimEnd('/'))/rest/v1/rpc/$rpcName"
  Write-Host "POST $rpcName -> $url"
  $hdrs = @(
    @{ Name = 'apikey'; Value = $key },
    @{ Name = 'Authorization'; Value = "Bearer $key" },
    @{ Name = 'Content-Type'; Value = 'application/json' }
  )
  try {
    $r = Invoke-RestMethod -Method Post -Uri $url -Headers ($hdrs | ForEach-Object { $_.Value } ) -Body $bodyJson -ErrorAction Stop
    return @{ ok = $true; body = $r }
  } catch {
    return @{ ok = $false; error = $_.Exception.Response.StatusCode.Value__  ; message = $_.Exception.Message }
  }
}

Write-Host "1) Test get_submission_by_token as anon (expected: 401 or permission denied)" -ForegroundColor Cyan
$sample = '{"_token":"00000000-0000-0000-0000-000000000000"}'
$anonRes = RpcCall 'get_submission_by_token' $sample $env:SUPABASE_ANON_KEY
Write-Host ($anonRes | ConvertTo-Json -Depth 4)

Write-Host "`n2) Test get_submission_by_token as service_role (expected: 200 or SQL error but not permission denied)" -ForegroundColor Cyan
if ($env:SUPABASE_SERVICE_ROLE_KEY) {
  $svcRes = RpcCall 'get_submission_by_token' $sample $env:SUPABASE_SERVICE_ROLE_KEY
  Write-Host ($svcRes | ConvertTo-Json -Depth 4)
} else {
  Write-Host "Skipping service role test: SUPABASE_SERVICE_ROLE_KEY not set." -ForegroundColor Yellow
}

Write-Host "`n3) Test submit_evaluation_by_token as anon (expected: 401 or permission denied)" -ForegroundColor Cyan
$submitSample = '{"_token":"00000000-0000-0000-0000-000000000000","_phase1":1,"_phase2":1,"_phase3":1,"_phase4":1,"_remarks":"test","_teacher_name":"T","_teacher_title":null,"_teacher_license":null}'
$anonSubmit = RpcCall 'submit_evaluation_by_token' $submitSample $env:SUPABASE_ANON_KEY
Write-Host ($anonSubmit | ConvertTo-Json -Depth 4)

Write-Host "`n4) (Optional) Service role submit test" -ForegroundColor Cyan
if ($env:SUPABASE_SERVICE_ROLE_KEY) {
  $svcSubmit = RpcCall 'submit_evaluation_by_token' $submitSample $env:SUPABASE_SERVICE_ROLE_KEY
  Write-Host ($svcSubmit | ConvertTo-Json -Depth 4)
}

Write-Host "\nTests complete. Review HTTP status codes and error messages to verify permissions." -ForegroundColor Green
