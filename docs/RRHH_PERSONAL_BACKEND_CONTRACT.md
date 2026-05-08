# RRHH Personal - Contrato Backend Spring Boot

## Endpoints recomendados

Base: `/api/personal`

| Metodo | Ruta | Uso |
| --- | --- | --- |
| `GET` | `/api/personal` | Listado pageable con filtros dinamicos |
| `GET` | `/api/personal/{id}` | Dashboard/ficha de empleado |
| `POST` | `/api/personal` | Crear empleado |
| `PUT` | `/api/personal/{id}` | Editar empleado |
| `PATCH` | `/api/personal/{id}/estado` | Activar/desactivar con soft delete |
| `POST` | `/api/personal/{id}/usuario` | Crear usuario del sistema |
| `POST` | `/api/personal/{id}/usuario/reset-password` | Resetear password |
| `GET` | `/api/personal/{id}/expediente` | Descargar expediente |

## Query pageable

El frontend ya envia estos parametros:

```text
page, size, sort, direction, q, nombres, apellidos, identificacion, email,
celular, cargo, departamento, direccion, estadoLaboral, tipoContrato,
usuarioSistema, fechaIngresoDesde, fechaIngresoHasta, area, sucursal
```

Respuesta sugerida:

```json
{
  "content": [],
  "totalElements": 0,
  "totalPages": 0,
  "number": 0,
  "size": 10
}
```

## Arquitectura Spring Boot

- `PersonalController`: endpoints REST, `Pageable`, validacion de DTOs.
- `PersonalService`: reglas de negocio, duplicados, auditoria, soft delete.
- `PersonalSpecification`: filtros con CriteriaBuilder.
- `PersonalRepository extends JpaRepository<Personal, Long>, JpaSpecificationExecutor<Personal>`.
- DTOs:
  - `PersonalSearchDTO`
  - `PersonalListItemDTO`
  - `PersonalDetailDTO`
  - `PersonalCreateUpdateDTO`
  - `PersonalAuditDTO`

## Validaciones backend

- `@NotBlank`: nombres, apellidos, direccion.
- `@Email`: correo.
- cedula ecuatoriana con `ConstraintValidator`.
- correo e identificacion unicos con indice parcial sobre registros activos.
- edad minima configurable con propiedad `rrhh.personal.edad-minima`.
- auditoria con usuario, IP, fecha y diff JSON para cambios sensibles.

## Seguridad

- `RRHH`: CRUD completo sobre personal.
- `SUPERVISOR`: lectura de su equipo y aprobaciones.
- `ADMINISTRADOR`: administracion total y usuarios.
- `EMPLEADO`: solo su perfil y documentos permitidos.

Implementar con `@PreAuthorize` por endpoint y filtros de alcance en `Specification`.
