# Prompt Para Backend RRHH

Usa este prompt como base para pedir la implementación del backend del módulo de Talento Humano en Java Spring Boot.

## Objetivo
Construir el backend completo para el módulo de RRHH del ERP, alineado con la UI ya diseñada en frontend Angular. El backend debe permitir administración, consulta, filtros, indicadores y almacenamiento histórico para estas secciones:

1. Administración de Personal
2. Reclutamiento y Selección
3. Desarrollo y Capacitación
4. Compensación y Beneficios
5. Bienestar y Cultura
6. Cumplimiento y Normativa

## Contexto funcional
El frontend ya tiene estas pantallas:

- `th-dashboard`
- `personal`
- `th-leave`
- `th-files`
- `th-actions`
- `th-audit`
- `th-vacancies`
- `th-candidates`
- `th-interviews`
- `th-onboarding`
- `th-training`
- `th-performance`
- `th-career`
- `th-mentoring`
- `th-payroll`
- `th-benefits`
- `th-incentives`
- `th-climate`
- `th-wellbeing`
- `th-conflicts`

## Requisitos técnicos
- Usar `Spring Boot`
- Arquitectura por capas:
  - `controller`
  - `service`
  - `repository`
  - `entity`
  - `dto`
- Validaciones con `javax.validation` o `jakarta.validation`
- Manejo de errores consistente con `ResponseEntity`
- Paginación y filtros en endpoints de listado
- Soporte para auditoría básica:
  - `created_at`
  - `updated_at`
  - `created_by`
  - `updated_by`
- Preparar entidades con relaciones correctas y claves foráneas
- Usar nombres claros y consistentes
- Si aplica, usar `UUID` en procesos transaccionales y `Long` en catálogos

## Lo que necesito que construyas

### 1. Administración de Personal
Implementar endpoints para:
- listado de empleados
- detalle de empleado
- creación
- edición
- cambio de estado laboral
- contratos vigentes
- historial laboral
- documentos del expediente
- vacaciones, permisos y ausentismo

Sugerencia de endpoints:
- `GET /api/v1/rrhh/employees`
- `GET /api/v1/rrhh/employees/{id}`
- `POST /api/v1/rrhh/employees`
- `PUT /api/v1/rrhh/employees/{id}`
- `PATCH /api/v1/rrhh/employees/{id}/status`
- `GET /api/v1/rrhh/employees/{id}/contracts`
- `GET /api/v1/rrhh/employees/{id}/files`
- `GET /api/v1/rrhh/employees/{id}/leaves`
- `GET /api/v1/rrhh/employees/{id}/actions`

Filtros requeridos:
- área
- dependencia
- tipo de contrato
- estado
- fecha ingreso

### 2. Reclutamiento y Selección
Implementar endpoints para:
- vacantes
- candidatos
- entrevistas
- pruebas
- onboarding

Sugerencia:
- `GET /api/v1/rrhh/vacancies`
- `POST /api/v1/rrhh/vacancies`
- `PUT /api/v1/rrhh/vacancies/{id}`
- `GET /api/v1/rrhh/candidates`
- `POST /api/v1/rrhh/candidates`
- `PUT /api/v1/rrhh/candidates/{id}`
- `GET /api/v1/rrhh/interviews`
- `POST /api/v1/rrhh/interviews`
- `PUT /api/v1/rrhh/interviews/{id}`
- `GET /api/v1/rrhh/onboarding`
- `POST /api/v1/rrhh/onboarding`
- `PUT /api/v1/rrhh/onboarding/{id}`

Filtros:
- vacante
- área
- etapa
- estado
- fecha

### 3. Desarrollo y Capacitación
Implementar:
- planes de formación
- eventos de capacitación
- evaluaciones de desempeño
- planes de carrera
- mentoría/coaching

Sugerencia:
- `GET /api/v1/rrhh/trainings`
- `POST /api/v1/rrhh/trainings`
- `GET /api/v1/rrhh/performance-reviews`
- `POST /api/v1/rrhh/performance-reviews`
- `GET /api/v1/rrhh/career-plans`
- `POST /api/v1/rrhh/career-plans`
- `GET /api/v1/rrhh/mentoring`
- `POST /api/v1/rrhh/mentoring`

### 4. Compensación y Beneficios
Implementar:
- nómina resumida
- componentes de nómina
- beneficios
- incentivos/reconocimientos

Sugerencia:
- `GET /api/v1/rrhh/payrolls`
- `GET /api/v1/rrhh/payrolls/{id}`
- `POST /api/v1/rrhh/payrolls`
- `GET /api/v1/rrhh/benefits`
- `POST /api/v1/rrhh/benefits`
- `GET /api/v1/rrhh/incentives`
- `POST /api/v1/rrhh/incentives`

### 5. Bienestar y Cultura
Implementar:
- encuestas de clima
- resultados de clima
- programas de bienestar
- conflictos y mediación

Sugerencia:
- `GET /api/v1/rrhh/climate-surveys`
- `POST /api/v1/rrhh/climate-surveys`
- `GET /api/v1/rrhh/climate-results`
- `GET /api/v1/rrhh/wellbeing-programs`
- `POST /api/v1/rrhh/wellbeing-programs`
- `GET /api/v1/rrhh/conflicts`
- `POST /api/v1/rrhh/conflicts`
- `PUT /api/v1/rrhh/conflicts/{id}`

### 6. Cumplimiento y Normativa
Implementar:
- auditorías
- políticas internas
- capacitaciones de seguridad
- reportes legales

Sugerencia:
- `GET /api/v1/rrhh/audits`
- `POST /api/v1/rrhh/audits`
- `GET /api/v1/rrhh/policies`
- `POST /api/v1/rrhh/policies`
- `GET /api/v1/rrhh/safety-trainings`
- `POST /api/v1/rrhh/safety-trainings`

## Dashboard
Implementar un endpoint ejecutivo para consolidar KPIs del dashboard de TH.

Endpoint sugerido:
- `GET /api/v1/rrhh/dashboard`

Debe devolver al menos:
- empleados activos
- altas recientes
- bajas recientes
- rotación
- ausentismo
- vacantes abiertas
- tiempo promedio de contratación
- costo por contratación
- evaluaciones promedio
- horas de capacitación
- porcentaje capacitado
- costo de nómina mensual
- horas extra
- beneficios activos
- satisfacción laboral
- participación en bienestar
- conflictos reportados/resueltos

Opcional:
- permitir filtros por:
  - área
  - tipo de contrato
  - fecha desde/hasta
  - dependencia

## DTOs recomendados
Crear DTOs específicos por módulo:
- `EmployeeRequest`, `EmployeeResponse`
- `VacancyRequest`, `VacancyResponse`
- `CandidateRequest`, `CandidateResponse`
- `InterviewRequest`, `InterviewResponse`
- `OnboardingRequest`, `OnboardingResponse`
- `TrainingPlanRequest`, `TrainingPlanResponse`
- `PerformanceReviewRequest`, `PerformanceReviewResponse`
- `CareerPlanRequest`, `CareerPlanResponse`
- `MentoringRequest`, `MentoringResponse`
- `PayrollRequest`, `PayrollResponse`
- `BenefitRequest`, `BenefitResponse`
- `IncentiveRequest`, `IncentiveResponse`
- `ClimateSurveyRequest`, `ClimateSurveyResponse`
- `WellbeingProgramRequest`, `WellbeingProgramResponse`
- `ConflictCaseRequest`, `ConflictCaseResponse`
- `AuditRequest`, `AuditResponse`
- `DashboardResponse`

## Reglas de negocio mínimas
- un empleado puede tener múltiples contratos históricos, pero solo uno vigente
- un candidato puede estar asociado a una vacante
- una vacante puede tener múltiples candidatos
- una evaluación de desempeño pertenece a un empleado y un período
- un plan de carrera puede tener hitos y estado
- una nómina puede tener detalle por rubro
- un conflicto debe tener estado y responsable
- una auditoría debe guardar tipo, hallazgos y plan de acción

## Entregables esperados
- entidades JPA
- repositorios
- servicios
- controladores REST
- DTOs
- validaciones
- manejo de errores
- endpoints documentados
- scripts SQL de creación o migraciones

## Criterio de implementación
Primero implementa el modelo de datos y los endpoints CRUD/listado. Después agrega el endpoint consolidado de dashboard con métricas agregadas.
