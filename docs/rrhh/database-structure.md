# Estructura De Tablas Sugerida Para RRHH

Este documento define la estructura mínima recomendada para soportar el frontend actual del módulo de Talento Humano.

## Convenciones
- PK numérica: `BIGINT`
- Fechas: `TIMESTAMP` o `DATE`
- Estados: `VARCHAR(30)` o catálogos si prefieres normalización
- Todas las tablas principales deberían incluir:
  - `created_at`
  - `updated_at`
  - `created_by`
  - `updated_by`
  - `active`

## 1. rrhh_employees
Tabla principal de colaboradores.

Campos sugeridos:
- `id`
- `employee_code`
- `identification`
- `first_name`
- `last_name`
- `birth_date`
- `email`
- `phone`
- `address`
- `hire_date`
- `termination_date`
- `employment_status`
- `contract_type`
- `position`
- `area_id`
- `dependency_id`
- `salary_base`
- `active`
- auditoría

## 2. rrhh_employee_contracts
Histórico de contratos.

Campos:
- `id`
- `employee_id`
- `contract_number`
- `contract_type`
- `start_date`
- `end_date`
- `salary`
- `workday_type`
- `status`
- `observations`
- `is_current`
- auditoría

## 3. rrhh_employee_files
Expediente / hoja de vida / documentos legales.

Campos:
- `id`
- `employee_id`
- `file_type`
- `title`
- `description`
- `file_path`
- `mime_type`
- `issue_date`
- `expiration_date`
- `status`
- auditoría

Tipos sugeridos:
- `CV`
- `CONTRACT`
- `ANNEX`
- `CERTIFICATE`
- `PERMIT`
- `EVALUATION`
- `OTHER`

## 4. rrhh_leave_requests
Vacaciones, permisos, ausencias.

Campos:
- `id`
- `employee_id`
- `leave_type`
- `start_date`
- `end_date`
- `days_requested`
- `days_approved`
- `reason`
- `status`
- `approved_by`
- `approved_at`
- auditoría

Estados sugeridos:
- `SOLICITADA`
- `APROBADA`
- `RECHAZADA`
- `CANCELADA`

## 5. rrhh_leave_balances
Saldo acumulado de vacaciones/permisos por empleado.

Campos:
- `id`
- `employee_id`
- `period_year`
- `leave_type`
- `days_earned`
- `days_used`
- `days_available`
- auditoría

## 6. rrhh_actions
Acciones de personal y movimientos administrativos.

Campos:
- `id`
- `employee_id`
- `action_type`
- `action_date`
- `description`
- `document_number`
- `status`
- auditoría

Ejemplos:
- `PROMOTION`
- `TRANSFER`
- `SANCTION`
- `SALARY_CHANGE`
- `CONTRACT_RENEWAL`

## 7. rrhh_vacancies
Vacantes y posiciones abiertas.

Campos:
- `id`
- `code`
- `title`
- `position`
- `area_id`
- `dependency_id`
- `vacancy_count`
- `priority`
- `status`
- `published_at`
- `closed_at`
- `salary_range_min`
- `salary_range_max`
- `description`
- `requirements`
- auditoría

## 8. rrhh_candidates
Candidatos.

Campos:
- `id`
- `vacancy_id`
- `first_name`
- `last_name`
- `identification`
- `email`
- `phone`
- `source`
- `cv_path`
- `current_stage`
- `score`
- `status`
- auditoría

## 9. rrhh_candidate_stages
Histórico del pipeline del candidato.

Campos:
- `id`
- `candidate_id`
- `stage`
- `stage_date`
- `result`
- `comments`
- `responsible_user_id`
- auditoría

Etapas sugeridas:
- `POSTULADO`
- `PRESELECCION`
- `ENTREVISTA`
- `PRUEBA`
- `FINALISTA`
- `SELECCIONADO`
- `DESCARTADO`

## 10. rrhh_interviews
Entrevistas y pruebas.

Campos:
- `id`
- `candidate_id`
- `vacancy_id`
- `interview_type`
- `scheduled_at`
- `interviewer`
- `result`
- `score`
- `comments`
- `status`
- auditoría

## 11. rrhh_onboarding
Proceso de inducción e integración.

Campos:
- `id`
- `employee_id`
- `vacancy_id`
- `start_date`
- `end_date`
- `mentor_employee_id`
- `status`
- `progress_pct`
- `comments`
- auditoría

## 12. rrhh_onboarding_tasks
Checklist detallado del onboarding.

Campos:
- `id`
- `onboarding_id`
- `task_name`
- `task_type`
- `due_date`
- `completed`
- `completed_at`
- `responsible_user_id`
- auditoría

## 13. rrhh_training_plans
Planes y programas de formación.

Campos:
- `id`
- `code`
- `title`
- `training_type`
- `provider`
- `area_id`
- `start_date`
- `end_date`
- `hours`
- `cost`
- `status`
- `description`
- auditoría

## 14. rrhh_training_participants
Participantes por capacitación.

Campos:
- `id`
- `training_plan_id`
- `employee_id`
- `attendance_status`
- `score`
- `approved`
- `certificate_path`
- auditoría

## 15. rrhh_performance_reviews
Evaluaciones de desempeño.

Campos:
- `id`
- `employee_id`
- `period`
- `area_id`
- `reviewer_id`
- `score`
- `result_level`
- `strengths`
- `improvements`
- `status`
- `review_date`
- auditoría

## 16. rrhh_career_plans
Planes de carrera y sucesión.

Campos:
- `id`
- `employee_id`
- `target_position`
- `career_level`
- `succession_role`
- `potential_level`
- `status`
- `start_date`
- `target_date`
- auditoría

## 17. rrhh_mentoring_sessions
Mentoría y coaching.

Campos:
- `id`
- `mentor_employee_id`
- `mentee_employee_id`
- `program_type`
- `session_date`
- `topic`
- `progress_pct`
- `notes`
- `status`
- auditoría

## 18. rrhh_payroll_headers
Cabecera de nómina por período.

Campos:
- `id`
- `period_year`
- `period_month`
- `area_id`
- `status`
- `total_amount`
- `total_overtime`
- `total_bonus`
- auditoría

## 19. rrhh_payroll_details
Detalle de nómina por empleado.

Campos:
- `id`
- `payroll_header_id`
- `employee_id`
- `base_salary`
- `overtime_amount`
- `bonus_amount`
- `deduction_amount`
- `net_amount`
- auditoría

## 20. rrhh_benefits
Beneficios institucionales.

Campos:
- `id`
- `code`
- `benefit_type`
- `name`
- `description`
- `provider`
- `monthly_cost`
- `status`
- auditoría

## 21. rrhh_employee_benefits
Asignación de beneficios por empleado.

Campos:
- `id`
- `employee_id`
- `benefit_id`
- `start_date`
- `end_date`
- `status`
- auditoría

## 22. rrhh_incentives
Incentivos, bonos y reconocimientos.

Campos:
- `id`
- `employee_id`
- `area_id`
- `incentive_type`
- `title`
- `amount`
- `granted_date`
- `reason`
- `status`
- auditoría

## 23. rrhh_climate_surveys
Encuestas de clima.

Campos:
- `id`
- `code`
- `title`
- `period`
- `start_date`
- `end_date`
- `status`
- auditoría

## 24. rrhh_climate_responses
Respuestas o resultados consolidados de clima.

Campos:
- `id`
- `survey_id`
- `employee_id`
- `area_id`
- `dimension`
- `score`
- `comment`
- auditoría

## 25. rrhh_wellbeing_programs
Programas de bienestar.

Campos:
- `id`
- `code`
- `name`
- `program_type`
- `start_date`
- `end_date`
- `provider`
- `cost`
- `status`
- auditoría

## 26. rrhh_wellbeing_participants
Participación del personal en programas de bienestar.

Campos:
- `id`
- `wellbeing_program_id`
- `employee_id`
- `participation_status`
- `feedback_score`
- `comments`
- auditoría

## 27. rrhh_conflict_cases
Conflictos y mediación.

Campos:
- `id`
- `case_code`
- `reported_by_employee_id`
- `involved_employee_id`
- `area_id`
- `conflict_type`
- `report_date`
- `resolution_date`
- `status`
- `summary`
- `resolution_notes`
- `responsible_user_id`
- auditoría

## 28. rrhh_audits
Cumplimiento, auditorías y reportes legales.

Campos:
- `id`
- `audit_code`
- `audit_type`
- `area_id`
- `scheduled_date`
- `executed_date`
- `status`
- `findings`
- `action_plan`
- `responsible_user_id`
- auditoría

## 29. Catálogos recomendados
Si quieres más normalización, separa:
- `rrhh_areas`
- `rrhh_dependencies`
- `rrhh_positions`
- `rrhh_contract_types`
- `rrhh_leave_types`
- `rrhh_benefit_types`
- `rrhh_training_types`
- `rrhh_conflict_types`
- `rrhh_audit_types`

## Relaciones mínimas
- `rrhh_employees.area_id -> rrhh_areas.id`
- `rrhh_employees.dependency_id -> dependencias o tabla propia`
- `rrhh_employee_contracts.employee_id -> rrhh_employees.id`
- `rrhh_employee_files.employee_id -> rrhh_employees.id`
- `rrhh_leave_requests.employee_id -> rrhh_employees.id`
- `rrhh_leave_balances.employee_id -> rrhh_employees.id`
- `rrhh_actions.employee_id -> rrhh_employees.id`
- `rrhh_candidates.vacancy_id -> rrhh_vacancies.id`
- `rrhh_candidate_stages.candidate_id -> rrhh_candidates.id`
- `rrhh_interviews.candidate_id -> rrhh_candidates.id`
- `rrhh_onboarding.employee_id -> rrhh_employees.id`
- `rrhh_training_participants.training_plan_id -> rrhh_training_plans.id`
- `rrhh_training_participants.employee_id -> rrhh_employees.id`
- `rrhh_performance_reviews.employee_id -> rrhh_employees.id`
- `rrhh_career_plans.employee_id -> rrhh_employees.id`
- `rrhh_mentoring_sessions.mentor_employee_id -> rrhh_employees.id`
- `rrhh_mentoring_sessions.mentee_employee_id -> rrhh_employees.id`
- `rrhh_payroll_details.payroll_header_id -> rrhh_payroll_headers.id`
- `rrhh_payroll_details.employee_id -> rrhh_employees.id`
- `rrhh_employee_benefits.employee_id -> rrhh_employees.id`
- `rrhh_employee_benefits.benefit_id -> rrhh_benefits.id`
- `rrhh_incentives.employee_id -> rrhh_employees.id`
- `rrhh_climate_responses.survey_id -> rrhh_climate_surveys.id`
- `rrhh_climate_responses.employee_id -> rrhh_employees.id`
- `rrhh_wellbeing_participants.wellbeing_program_id -> rrhh_wellbeing_programs.id`
- `rrhh_wellbeing_participants.employee_id -> rrhh_employees.id`
- `rrhh_conflict_cases.reported_by_employee_id -> rrhh_employees.id`
- `rrhh_conflict_cases.involved_employee_id -> rrhh_employees.id`

## Tablas críticas para empezar primero
Si quieres una primera fase mínima funcional, empieza con:
- `rrhh_employees`
- `rrhh_employee_contracts`
- `rrhh_employee_files`
- `rrhh_leave_requests`
- `rrhh_leave_balances`
- `rrhh_actions`
- `rrhh_vacancies`
- `rrhh_candidates`
- `rrhh_interviews`
- `rrhh_training_plans`
- `rrhh_performance_reviews`
- `rrhh_payroll_headers`
- `rrhh_payroll_details`
- `rrhh_benefits`
- `rrhh_incentives`
- `rrhh_climate_surveys`
- `rrhh_wellbeing_programs`
- `rrhh_conflict_cases`
- `rrhh_audits`
