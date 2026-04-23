param(
  [string]$Url = "http://localhost:8788",
  [switch]$ForceRestart
)

$ErrorActionPreference = "Stop"

$projectDir = Split-Path $PSScriptRoot -Parent
$projectFile = Join-Path $projectDir "PrintBridge.csproj"

if (-not (Test-Path $projectFile)) {
  throw "No se encontro el proyecto en $projectFile"
}

$parsedUrl = [Uri]$Url
$port = $parsedUrl.Port
$existing = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Where-Object {
  $_.State -eq 'Listen'
}

if ($existing) {
  $processIds = $existing | Select-Object -ExpandProperty OwningProcess -Unique
  $processInfo = foreach ($processId in $processIds) {
    Get-Process -Id $processId -ErrorAction SilentlyContinue | Select-Object Id, ProcessName, Path
  }

  if ($ForceRestart) {
    foreach ($processId in $processIds) {
      Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Seconds 1
  } else {
    Write-Host "El puerto $port ya esta en uso por:"
    $processInfo | Format-Table -AutoSize | Out-Host
    Write-Host ""
    Write-Host "Si quieres reiniciar el puente de desarrollo, ejecuta:"
    Write-Host ".\scripts\run-bridge-dev.ps1 -ForceRestart"
    return
  }
}

$env:Bridge__Url = $Url
Write-Host "Iniciando puente local de desarrollo en $Url"
dotnet run --project $projectFile
