# Retenciones: error HTTP 400

Fecha de revisión: 2026-10-07. Pantalla: `http://192.168.0.88/#/retenciones`.

## Evidencia

El adjunto muestra un POST a `http://192.168.0.33:9096/api/v1/retenciones` con respuesta **400 Bad Request**. No incluye el cuerpo de la respuesta, por lo que no permite determinar el rechazo concreto.

Comprobaciones realizadas desde el equipo de desarrollo, sin emitir comprobantes:

- HEAD a `/api/v1/retenciones`: **405**, cabecera `Allow: POST`. El servicio y la ruta responden; HEAD no es un método soportado.
- OPTIONS con origen `http://192.168.0.88`, método POST y cabeceras `content-type,authorization`: **200**, `Access-Control-Allow-Origin: http://192.168.0.88`, métodos y cabeceras permitidos.
- GET a `/v3/api-docs`: responde. El contrato publicado para POST `/api/v1/retenciones` recibe un String XML con `Content-Type: application/xml` y declara el 400 como validación previa fallida o rechazo SRI.
- GET `/actuator/health`: **404**. Esa ruta de salud no está publicada; esto no demuestra que el servicio esté detenido.

Conclusión comprobada: el servicio HTTP está accesible desde este equipo y acepta el origen indicado en la preconsulta CORS. El 400 del navegador también demuestra que recibió una respuesta HTTP. **No se ha comprobado que todas las dependencias internas estén disponibles**, ni que un XML particular sea válido.

El controlador local equivalente, `microservicesEpmapa-T/sri-files/.../controllers/RetencionController.java`, devuelve 400 en estas etapas:

1. XML vacío.
2. Validación previa: `estado`, `errores[]`, `warnings[]`, `requestId`.
3. Firma: `error`, `detalle`, `requestId`.
4. Recepción SRI no satisfactoria: `error`, `detalle`, `requestId`.

Por tanto, tampoco se puede descartar un fallo interno de firma o comunicación SRI únicamente por existir una respuesta 400. El contrato publicado confirma el formato general; los detalles de cada etapa se contrastaron con el código local y podrían diferir si el binario desplegado fuese otra revisión.

## Corrección del frontend

El método `getSriErrorDetail` de la pantalla ignoraba `errores[]`. En un rechazo de validación podía terminar mostrando el mensaje HTTP genérico en lugar de los errores del XML.

Ahora:

- Se muestran `errores`, `errors`, `detalle`, `mensaje`, `message` y `error`, incluyendo mensajes estructurados y cuerpos JSON recibidos como texto.
- Se agrega el `requestId` del cuerpo o de `X-Request-Id` para buscar el evento en los logs.
- Se distinguen ausencia de respuesta (estado 0), respuestas HTTP de indisponibilidad y rechazo de validación.
- El error al procesar se muestra en un diálogo con botón Aceptar; no desaparece en el toast de dos segundos.
- Un 503 genérico ya no se clasifica automáticamente como un fallo de correo.

Archivos:

- `src/app/componentes/contabilidad/retenciones/retenciones/retenciones.component.ts`.
- `src/app/servicios/contabilidad/retenciones-sri-error.ts`.
- `src/app/servicios/contabilidad/retenciones-sri-error.spec.ts`.
- `tsconfig.retenciones-spec.json`.

No se cambió el contenido fiscal del XML, la dirección del servicio, los certificados ni el flujo de envío. No se reenviaron retenciones ni correos durante la revisión. La corrección está en el código local; **no fue desplegada en 192.168.0.88**.

## Validación

**8 pruebas aprobadas en ChromeHeadless**: listas de validación, detalle de firma/SRI, JSON como texto, distinción red/HTTP, servicios dependientes, deduplicación, referencia de cabecera y errores locales/HTML.

```powershell
npx ng test --configuration=rrhh --ts-config=tsconfig.retenciones-spec.json --watch=false --browsers=ChromeHeadless --include=src/app/servicios/contabilidad/retenciones-sri-error.spec.ts
npx tsc -p tsconfig.app.json --noEmit
```

Ambos comandos finalizaron correctamente. La configuración `rrhh` solo se reutiliza para ejecutar Karma sin scripts globales; el tsconfig y el filtro seleccionan exclusivamente las pruebas de este diagnóstico.

## Dato pendiente para corregir el rechazo original

Hace falta el cuerpo de **Network → solicitud POST retenciones → Response**, especialmente `estado`, `errores`, `detalle` y `requestId`. Puede recuperarse de la solicitud fallida ya registrada, sin volver a pulsar Procesar SRI. Con esa referencia se puede localizar el fallo de validación, certificado, firma o comunicación en los logs del servidor.

Hasta disponer de esa respuesta no se afirma que el rechazo original esté corregido ni se recomienda reenviar automáticamente el documento.
