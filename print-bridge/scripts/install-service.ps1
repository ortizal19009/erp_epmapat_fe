param(
  [string]$PublishDir = "",
  [string]$ServiceName = "PrintBridge",
  [string]$ExeName = "PrintBridge.exe",
  [string]$Url = "http://localhost:8787"
)

$ErrorActionPreference = "Stop"

function Test-IsAdministrator {
  $identity = [System.Security.Principal.WindowsIdentity]::GetCurrent()
  $principal = New-Object System.Security.Principal.WindowsPrincipal($identity)
  return $principal.IsInRole([System.Security.Principal.WindowsBuiltInRole]::Administrator)
}

if (-not (Test-IsAdministrator)) {
  throw "Ejecuta PowerShell como administrador para instalar o iniciar el servicio $ServiceName."
}

if ([string]::IsNullOrWhiteSpace($PublishDir)) {
  $PublishDir = Join-Path $PSScriptRoot "publish"
}

function Resolve-PublishDir {
  param([string]$Candidate)

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
if (-not (Test-Path $resolvedPublishDir)) {
  throw "No existe el directorio de publicacion: $resolvedPublishDir"
}

$exePath = Join-Path $resolvedPublishDir $ExeName
if (-not (Test-Path $exePath)) {
  throw "No se encontro $ExeName en $resolvedPublishDir. Ejecuta primero dotnet publish."
}

if (Get-Service -Name $ServiceName -ErrorAction SilentlyContinue) {
  Write-Host "El servicio $ServiceName ya existe. Se intentara iniciarlo."
  Set-Service -Name $ServiceName -StartupType Automatic
  Start-Service -Name $ServiceName
  Write-Host "Servicio $ServiceName iniciado."
  exit 0
}

New-Service -Name $ServiceName `
  -BinaryPathName "`"$exePath`"" `
  -DisplayName $ServiceName `
  -Description "Servicio local de impresion para ERP EPMAPAT" `
  -StartupType Automatic | Out-Null

sc.exe failure $ServiceName reset= 86400 actions= restart/5000/restart/5000/restart/5000 | Out-Host
Start-Service -Name $ServiceName

Write-Host "Servicio $ServiceName creado y arrancado."
