param(
  [string]$Configuration = "Release",
  [string]$Runtime = "win-x64",
  [string]$OutputDir = ".\publish"
)

$ErrorActionPreference = "Stop"

$projectDir = Split-Path $PSScriptRoot -Parent
$projectFile = Join-Path $projectDir "PrintBridge.csproj"
$serviceName = "PrintBridge"

if (-not (Test-Path $projectFile)) {
  throw "No se encontro el proyecto en $projectFile"
}

if (Get-Service -Name $serviceName -ErrorAction SilentlyContinue) {
  $service = Get-Service -Name $serviceName
  $wasRunning = $service.Status -eq 'Running'

  if ($wasRunning) {
    Write-Host "Deteniendo el servicio $serviceName antes de publicar..."
    Stop-Service -Name $serviceName -Force
    Start-Sleep -Seconds 2
  }
}
else {
  $wasRunning = $false
}

Write-Host "Publicando puente en $OutputDir"
dotnet publish $projectFile -c $Configuration -r $Runtime -o $OutputDir

if ($wasRunning) {
  Write-Host "Reiniciando el servicio $serviceName..."
  Start-Service -Name $serviceName
}
