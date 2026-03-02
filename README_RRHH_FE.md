# README_RRHH_FE.md

## Contexto
Esta rama (`feature/rrhh-microservices-integration`) implementa la primera versión funcional de frontend para Talento Humano (RRHH) consumiendo endpoints por gateway.

## Módulos / pantallas agregadas

### 1) Acciones TH
- Ruta: `/th-actions`
- Componente: `src/app/componentes/rrhh/th-actions`
- Funciones:
  - listar acciones por personal
  - crear acción TH
  - filtros por tipo/estado
  - paginación
  - badges de estado

### 2) Vacaciones y permisos (TH Leave)
- Ruta: `/th-leave`
- Componente: `src/app/componentes/rrhh/th-leave`
- Funciones:
  - crear balance anual
  - crear solicitud (VACACION/PERMISO/LICENCIA)
  - aprobar/rechazar solicitud
  - filtro por estado
  - paginación
  - preview de días solicitados
  - columnas de aprobador y fecha aprobación

## Servicios frontend nuevos
- `src/app/servicios/rrhh/th-actions.service.ts`
- `src/app/servicios/rrhh/th-leave.service.ts`

## Integraciones realizadas
- `app-routing.ts`:
  - `/th-actions`
  - `/th-leave`
- `app.module.ts`:
  - declaraciones de componentes TH
- `main-sidebar.component.html`:
  - submenús RRHH para Acciones TH y Vacaciones/Permisos

## Dependencia de backend
Se espera backend `msvc-rrhh` operativo con rutas:
- `/api/th-actions/**`
- `/api/th-leave/**`
- `/api/personal/**`

## Base URL
No se alteró enfoque global de environment. Se consume por gateway según configuración actual del proyecto.

## Build validado
- `npm run build -- --configuration development`

## Checklist rápido de prueba manual
1. Entrar al módulo superior **Talento Humano**.
2. Ver submenús en sidebar:
   - Personal
   - Acciones TH
   - Vacaciones y permisos
3. En `/th-actions`:
   - seleccionar personal
   - crear acción
   - validar filtros/paginación
4. En `/th-leave`:
   - crear balance
   - crear solicitud
   - aprobar/rechazar
   - validar cambio de estado y detalle aprobación
