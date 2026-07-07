# Judge0 CE — Start Script (Windows / PowerShell)
# Usage: .\scripts\judge0-start.ps1
# Prerequisites: Docker Desktop, Docker Compose

param(
  [Parameter(Mandatory = $false)]
  [string]$EnvFile = "infra/judge0/.env"
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Path $PSScriptRoot -Parent
$ComposeFile = Join-Path $ProjectRoot "infra/judge0/docker-compose.yml"
$EnvPath = Join-Path $ProjectRoot $EnvFile

if (-not (Test-Path $EnvPath)) {
  Write-Error "Environment file not found: $EnvPath"
  Write-Error "Copy .env.judge0.example to $EnvPath and fill in secrets."
  exit 1
}

Write-Host "Starting Judge0 CE..." -ForegroundColor Cyan
Write-Host "Compose file: $ComposeFile" -ForegroundColor Cyan
Write-Host "Env file:     $EnvPath" -ForegroundColor Cyan

$envFile = Resolve-Path $EnvPath
docker compose --env-file "$envFile" -f $ComposeFile up -d --remove-orphans

if ($LASTEXITCODE -eq 0) {
  Write-Host ""
  Write-Host "Judge0 CE started successfully!" -ForegroundColor Green
  Write-Host ""
  Write-Host "Monitor logs with:" -ForegroundColor Yellow
  Write-Host "  docker compose --env-file $EnvFile -f $ComposeFile logs -f"
  Write-Host ""
  Write-Host "Check server health:" -ForegroundColor Yellow
  Write-Host "  curl http://localhost:3000/api/v1/about"
  Write-Host ""
  Write-Host "Stop with:" -ForegroundColor Yellow
  Write-Host "  docker compose --env-file $EnvFile -f $ComposeFile down"

  # Wait for health check
  Write-Host ""
  Write-Host "Waiting for Judge0 server to become healthy..." -ForegroundColor Cyan
  $timeout = 120
  $elapsed = 0
  while ($elapsed -lt $timeout) {
    try {
      $response = Invoke-WebRequest -Uri "http://localhost:3000/api/v1/about" -UseBasicParsing -TimeoutSec 5
      if ($response.StatusCode -eq 200) {
        Write-Host "Judge0 server is ready!" -ForegroundColor Green
        Write-Host "About: $($response.Content)" -ForegroundColor Gray
        break
      }
    } catch {
      # not ready yet
    }
    $elapsed += 5
    Start-Sleep -Seconds 5
    Write-Host "  ... waiting ($elapsed seconds)" -ForegroundColor Gray
  }
  if ($elapsed -ge $timeout) {
    Write-Warning "Timed out waiting for Judge0 to become healthy. Check logs."
  }
} else {
  Write-Error "Failed to start Judge0 CE."
}
