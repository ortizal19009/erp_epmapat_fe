param(
  [string]$PublishDir = "",
  [string]$ExeName = "PrintBridge.exe",
  [string]$Url = "http://localhost:8788"
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

if (-not (Test-Path $exePath)) {
  throw "No se encontro $ExeName en $resolvedPublishDir. Ejecuta primero dotnet publish."
}

$env:Bridge__Url = $Url
Write-Host "Iniciando puente local desde $exePath en $Url"
Start-Process -FilePath $exePath -WorkingDirectory $resolvedPublishDir
