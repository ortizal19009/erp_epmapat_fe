# Notificacion de deudas pendientes: cuenta 12589

Revision de solo lectura, 2026-11-10.

| Entorno | Rubros activos | Interes temporal registrado | Total |
| --- | ---: | ---: | ---: |
| Local (localhost, application-local.properties) | 138.43 | 0.00 | 138.43 |
| Produccion (application-prod.properties) | 158.68 | 1.06 | 159.74 |

Local: planilla 3066204 con valor; 3085139 no tiene rubros y su tarifa es cero.
Produccion: 3066204 = 138.43 + 1.06; 3085139 = 20.25 + 0.00.
Los importes de interes son los registrados en tmpinteresxfac al consultar;
no se ejecuto recalculo masivo ni se modificaron facturas.

Problemas encontrados en impNotificacion:
- forEach(async) iniciaba los intereses sin esperarlos.
- Tabla por planillas y tabla por rubros se obtenian de consultas con filtros distintos.
- Acumulacion en numeros flotantes podia diferir de la suma de lineas impresas.

Correccion: esperar cada interes y los detalles; construir ambas tablas desde
las mismas planillas, omitir rubros inactivos, deduplicar planillas y acumular
centavos redondeados por rubro. Mantiene el origen del interes temporal.
En caso de fallo no genera una notificacion incompleta y libera el indicador.
Para adjuntos se usa datauristring, que no redirige la pagina como datauri.

Verificacion: TypeScript correcto y 3 pruebas ChromeHeadless aprobadas.
Comando:
ng test --configuration=aguatramite --ts-config=tsconfig.notificacion-deuda-spec.json --watch=false --browsers=ChromeHeadless --include=src/app/componentes/abonados/detalles-abonado/detalles-abonado.component.spec.ts

Cambios solo en frontend, pendientes de publicar en el servidor.
