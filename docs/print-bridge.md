# Puente de impresion local

Este proyecto puede imprimir a traves de un servicio local de Windows en lugar de QZ Tray.

La implementacion base vive en `print-bridge/`.

## Proposito

- Evitar certificados y confirmaciones del navegador.
- Mantener la impresora controlada por un servicio local.
- Permitir impresion silenciosa desde el frontend.

## Configuracion esperada

- URL por defecto en desarrollo: `http://localhost:8788`
- El frontend usa `PRINT_BRIDGE_URL` y `PRINT_BRIDGE_TOKEN` desde `environment.ts`.
- La configuracion de impresion se guarda por perfil:
  - `consumo`
  - `servicios`
  - `convenio`

## Endpoints

### `GET /health`

Respuesta esperada:

```json
{ "ok": true }
```

### `GET /printers`

Respuesta esperada:

```json
{ "printers": ["EPSON TM-T88V Receipt5"] }
```

### `GET /printers/default`

Respuesta esperada:

```json
{ "printer": "EPSON TM-T88V Receipt5" }
```

### `POST /print/pdf`

Payload esperado:

```json
{
  "jobName": "Factura 123",
  "printerName": "EPSON TM-T88V Receipt5",
  "copies": 2,
  "silent": true,
  "pdfScaleFactor": 1.15,
  "pdfPaperFormat": "ticket80",
  "pdfBase64": "JVBERi0xLjcKJc..."
}
```

- `pdfScaleFactor` controla el tamaño del PDF al imprimir.
- Valores cercanos a `1.00` conservan el tamaño original.
- Prueba entre `1.10` y `1.25` si el comprobante sale muy pequeño.
- `pdfPaperFormat` define el ancho del papel para la impresora.
- Usa `ticket80` para la Epson TM-T88V, `ticket58` para rollo angosto y `a4` solo si de verdad necesitas hoja completa.

### `POST /print/text`

Payload esperado:

```json
{
  "jobName": "Prueba de impresion",
  "printerName": "EPSON TM-T88V Receipt5",
  "copies": 1,
  "silent": true,
  "lines": [
    "\u001b@",
    "Hola"
  ]
}
```

## Seguridad

- El servicio debe escuchar solo en `localhost`.
- Si quieres reforzarlo, valida `Authorization: Bearer <token>`.
- El frontend ya envia el token si `PRINT_BRIDGE_TOKEN` tiene valor.

## Perfiles de impresion

- `consumo` y `servicios` usan por defecto `ticket80`.
- `convenio` usa por defecto `a4`.
- Cada perfil guarda su propia impresora, copias, escala y formato de papel.

## Flujo recomendado

1. Angular genera el PDF.
2. Angular llama al puente local.
3. El servicio imprime en la Epson configurada.
4. El navegador no muestra ventanas de confianza de QZ Tray.

## Publicacion

- La forma recomendada de desplegar es con `print-bridge/scripts/publish-bridge.ps1`.
- Ese script genera una publicacion normal en `publish`, lista para instalar como servicio en equipos que ya tengan el runtime compatible de .NET 10.

## Desarrollo

- El puente local de desarrollo puede levantarse con `print-bridge/scripts/run-bridge-dev.ps1`.
- Ese modo escucha en `http://localhost:8788` y evita depender del servicio de Windows ya instalado.
- El modo manual `print-bridge/scripts/run-bridge.ps1` tambien usa `http://localhost:8788` por
  defecto para no chocar con el servicio instalado en `8787`.

## Inicio automatico

- El instalador `print-bridge/scripts/install-service.ps1` deja el servicio con inicio automatico.
- Si el servicio ya existia, el mismo script vuelve a aplicar ese modo para que arranque con Windows.
