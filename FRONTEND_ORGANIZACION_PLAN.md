# Plan de Organización Frontend (Fase 1)

## Objetivo
Organizar el frontend por dominios funcionales para identificar y mantener fácilmente:
- Comercialización
- Contabilidad
- RRHH
- Gestión Documental
- Administración Central (incluye Login)

## Estado actual (legacy)
- `src/app/componentes/*` contiene componentes mezclados por módulo.
- `src/app/servicios/*` concentra servicios de varios dominios.
- `src/app/modelos/*` concentra modelos globales.

## Estructura objetivo
```txt
src/app/
  core/
  shared/
  features/
    admin-central/
    comercializacion/
    contabilidad/
    rrhh/
    gestion-documental/
```

## Mapeo inicial sugerido

### Administración Central / Login
- Origen:
  - `componentes/administracion/**`
  - `servicios/administracion/**`
  - `compartida/autoriza.service.ts` (auth/login)
- Destino:
  - `features/admin-central/**`
  - `core/auth/**` (servicios de sesión/autorización)

### Comercialización
- Origen:
  - `componentes/clientes/**`, `nacionalidad/**`, `rutas/**`, `abonados/**`, etc.
  - `servicios/*` asociados a catálogos/comercialización.
- Destino:
  - `features/comercializacion/**`

### Contabilidad
- Origen:
  - `componentes/contabilidad/**`
  - servicios/modelos contables.
- Destino:
  - `features/contabilidad/**`

### RRHH
- Origen:
  - `componentes/rrhh/**`
- Destino:
  - `features/rrhh/**`

### Gestión Documental
- Origen:
  - `features/documentos/**`, `features/settings/**`, `features/case-files/**`
- Destino:
  - `features/gestion-documental/**` (o mantener submódulos actuales bajo esta carpeta)

## Estrategia de migración segura
1. Crear estructura por dominios (sin mover código aún).
2. Migrar imports a aliases (`@core`, `@shared`, `@features`, `@servicios`, `@modelos`).
3. Mover módulo por módulo con commits pequeños.
4. Verificar `ng build` en cada paso.
5. Eliminar rutas legacy cuando todo compile y navegue bien.

## Convenciones
- Componentes de pantalla: `features/<dominio>/pages/**`
- Componentes reutilizables del dominio: `features/<dominio>/components/**`
- Servicios del dominio: `features/<dominio>/services/**`
- Modelos del dominio: `features/<dominio>/models/**`
- Rutas por dominio: `features/<dominio>/<dominio>.routes.ts`
