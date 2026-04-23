param(
  [string]$PublishDir = "",
  [string]$ExeName = "PrintBridge.exe",
  [string]$Url = "http://localhost:8788",
  [switch]$ForceRestart
)

$ErrorActionPreference = "Stop"

function Resolve-PublishDir {
  param([string]$Candidate)

  if ([string]::IsNullOrWhiteSpace($Candidate)) {
    $Candidate = "publish"
  }

  $paths = New-Object System.Collections.Generic.List[string]
  $paths.Add($Candidate)
  $paths.Add((Join-Path $PSScriptRoot $Candidate))
  $paths.Add((Join-Path (Split-Path $PSScriptRoot -Parent) $Candidate))

  foreach ($path in $paths) {
    $resolved = [System.IO.Path]::GetFullPath($path)
    if (Test-Path $resolved) {
      return $resolved
    }
  }

  throw "No existe el directorio de publicacion: $Candidate"
}

$resolvedPublishDir = Resolve-PublishDir -Candidate $PublishDir
$exePath = Join-Path $resolvedPublishDir $ExeName

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
    Write-Host "Si quieres reiniciar el puente, ejecuta:"
    Write-Host ".\scripts\run-bridge.ps1 -ForceRestart"
    return
  }
}

if (-not (Test-Path $exePath)) {
  throw "No se encontro $ExeName en $resolvedPublishDir. Ejecuta primero dotnet publish."
}

$env:Bridge__Url = $Url
Write-Host "Iniciando puente local desde $exePath en $Url"
Start-Process -FilePath $exePath -WorkingDirectory $resolvedPublishDir
