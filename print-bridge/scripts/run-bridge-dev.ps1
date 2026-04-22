param(
  [string]$Url = "http://localhost:8788"
)

$ErrorActionPreference = "Stop"

$projectDir = Split-Path $PSScriptRoot -Parent
$projectFile = Join-Path $projectDir "PrintBridge.csproj"

if (-not (Test-Path $projectFile)) {
  throw "No se encontro el proyecto en $projectFile"
}

$env:Bridge__Url = $Url
Write-Host "Iniciando puente local de desarrollo en $Url"
dotnet run --project $projectFile
