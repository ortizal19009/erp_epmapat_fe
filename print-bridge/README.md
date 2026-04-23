# PrintBridge

Servicio local de Windows para imprimir PDF y texto desde el frontend sin QZ Tray.

## Endpoints

- `GET /health`
- `GET /printers`
- `GET /printers/default`
- `POST /print/pdf`
- `POST /print/text`

## Requisitos

- Windows
- .NET 10 SDK
- Una impresora instalada en el equipo

## Ejecucion local

```powershell
dotnet restore
dotnet run
```

Por defecto escucha en `http://localhost:8788` cuando se ejecuta con `dotnet run`.

## Modo de desarrollo rapido

Si no quieres tocar el servicio de Windows instalado, puedes levantar una instancia de desarrollo en `http://localhost:8788` con:

```powershell
.\scripts\run-bridge-dev.ps1
```

Si el puerto ya esta ocupado, el script muestra el proceso activo y no intenta abrir otra instancia.

Si el puerto ya esta ocupado y quieres reiniciar el proceso, usa:

```powershell
.\scripts\run-bridge-dev.ps1 -ForceRestart
```

Ese modo es ideal para el frontend en desarrollo, porque evita bloquear el archivo del servicio instalado en `8787`.

## Publicacion como servicio

1. Publica el proyecto con `.\scripts\publish-bridge.ps1`.
2. Copia el contenido publicado a una carpeta fija.
3. Abre PowerShell como administrador.
4. Ejecuta `.\scripts\install-service.ps1 -PublishDir .\publish`.
5. Mantenerlo escuchando solo en `localhost`.

El instalador deja el servicio con inicio automatico. Si el servicio ya existia, vuelve a marcarlo para que arranque con Windows.

Si el servicio ya estaba corriendo, `publish-bridge.ps1` lo detiene, publica y lo vuelve a iniciar.

Antes de ejecutar `install-service.ps1`, asegurate de que exista la carpeta publicada, por ejemplo `.\publish`.

## Puertos usados

- `8787` para el servicio de Windows.
- `8788` para desarrollo con `dotnet run`.

## Escala del PDF

- El puente acepta `pdfScaleFactor` al imprimir PDFs.
- `1.00` es el tamaño normal.
- Prueba `1.10` o `1.20` si el comprobante sale muy pequeno.

## Formato de papel

- El puente acepta `pdfPaperFormat` al imprimir PDFs.
- `ticket80` es el recomendado para la Epson TM-T88V.
- `ticket58` sirve para rollo angosto.
- `a4` deja el PDF como hoja completa.

## Perfiles de impresion

- `consumo`, `servicios` y `convenio` usan por defecto `ticket80`.
- Cada perfil guarda su propia impresora, copias, escala y formato de papel.

## Modo de prueba sin servicio

Si no quieres instalar el servicio todavia, puedes levantar el puente en una consola normal con:

```powershell
.\scripts\run-bridge.ps1 -PublishDir .\publish
```

Ese comando usa `http://localhost:8788` por defecto y valida que el puerto no este ocupado antes de arrancar.
Si ya esta en uso, te mostrara el proceso que lo esta usando.

## Scripts utiles

- `scripts/publish-bridge.ps1`: publica el puente en `publish`.
- `scripts/install-service.ps1`: registra e inicia el servicio a partir de una carpeta publicada.
- `scripts/run-bridge.ps1`: ejecuta el puente directamente desde la carpeta publicada, sin instalar servicio.
- `scripts/test-bridge.ps1`: verifica `health`, lista impresoras y lanza una prueba de texto.

## Seguridad

- Si defines `Bridge:Token`, el frontend debe enviar `Authorization: Bearer <token>`.
- El servicio debe correr solo en la maquina local.
