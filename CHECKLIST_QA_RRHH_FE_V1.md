# CHECKLIST_QA_RRHH_FE_V1.md

Fecha: 2026-03-02
Rama: feature/rrhh-microservices-integration

## 1. Navegación
- [ ] Sidebar muestra "Personal", "Acciones TH", "Vacaciones y permisos"
- [ ] Ruta `/personal` carga sin errores
- [ ] Ruta `/th-actions` carga sin errores
- [ ] Ruta `/th-leave` carga sin errores

## 2. TH Actions
- [ ] Carga selector de personal
- [ ] Consulta acciones por persona
- [ ] Crea acción válida (INGRESO/MOVIMIENTO/etc.)
- [ ] Valida fecha de vigencia obligatoria
- [ ] Filtros por tipo y estado funcionan
- [ ] Paginación funciona

## 3. TH Leave
- [ ] Carga balances por persona
- [ ] Crea balance anual
- [ ] Crea solicitud (VACACION/PERMISO/LICENCIA)
- [ ] Aprobación cambia estado a APROBADA
- [ ] Rechazo cambia estado a RECHAZADA
- [ ] Botones aprobar/rechazar solo activos en SOLICITADA
- [ ] Filtro por estado funciona
- [ ] Paginación funciona

## 4. Integración backend
- [ ] Endpoints consumidos por gateway (8080)
- [ ] Manejo de errores visible en UI
- [ ] No errores de CORS

## 5. Build
- [ ] `npm run build -- --configuration development` OK

## 6. Cierre
- [ ] Demo funcional con usuario
- [ ] Ajustes UX finales (si aplica)
- [ ] Listo para merge a rama principal
