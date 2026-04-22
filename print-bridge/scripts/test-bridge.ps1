param(
  [string]$BaseUrl = "http://localhost:8787"
)

$ErrorActionPreference = "Stop"

function Invoke-JsonGet {
  param([string]$Path)
  $uri = ($BaseUrl.TrimEnd('/') + $Path)
  try {
    Invoke-RestMethod -Method Get -Uri $uri
  } catch {
    $serviceName = "PrintBridge"
    $service = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
    if ($service) {
      throw "No se pudo conectar con el puente local en $uri. El servicio $serviceName existe pero no responde. Estado actual: $($service.Status)."
    }

    throw "No se pudo conectar con el puente local en $uri. Verifica que el servicio este iniciado o usa .\scripts\run-bridge.ps1 para levantarlo en modo prueba."
  }
}

Write-Host "Probando puente en $BaseUrl"

$health = Invoke-JsonGet "/health"
Write-Host "Health:" ($health | ConvertTo-Json -Compress)

$printers = Invoke-JsonGet "/printers"
Write-Host "Printers:" ($printers | ConvertTo-Json -Compress)

$default = Invoke-JsonGet "/printers/default"
Write-Host "Default:" ($default | ConvertTo-Json -Compress)

if ($printers.printers -and $printers.printers.Count -gt 0) {
  $body = @{
    jobName = "Prueba puente local"
    printerName = $printers.printers[0]
    copies = 1
    silent = $true
    lines = @("PRUEBA DE IMPRESION", "FECHA: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')")
  } | ConvertTo-Json -Depth 4

  $uri = ($BaseUrl.TrimEnd('/') + "/print/text")
  $result = Invoke-RestMethod -Method Post -Uri $uri -ContentType "application/json" -Body $body
  Write-Host "Print text:" ($result | ConvertTo-Json -Compress)
} else {
  Write-Host "No hay impresoras disponibles para probar la impresion."
}
