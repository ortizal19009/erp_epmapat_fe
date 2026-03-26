export const HELP_CONTENT: Record<string, { title: string; purpose: string; legal: string[]; instructions: string[]; warnings?: string[]; level?: 'CRITICO'|'ALTO'|'MEDIO'; roles?: string[] }> = {
  documents: {
    roles: ['ADMIN/SUPERVISOR: control y aprobación', 'RESPONSABLE/RECEPCIÓN: gestión operativa', 'CONSULTA: solo lectura'],
    title: 'Documentos',
    level: 'CRITICO',
    purpose: 'Registro y gestión de documentos entrantes/salientes con trazabilidad institucional.',
    legal: ['COA', 'Ley Orgánica del Sistema Nacional de Archivos'],
    instructions: ['Completar asunto, origen, tipo y destinatarios.', 'Usar plazos cuando requiere respuesta.', 'Mantener archivo principal y anexos versionados.'],
    warnings: ['Metadatos incompletos debilitan la trazabilidad y validez administrativa.']
  },
  inbox: {
    title: 'Bandeja de derivaciones',
    level: 'ALTO',
    purpose: 'Seguimiento de sumillas y tareas derivadas a usuarios/dependencias.',
    legal: ['COA (trámite y actuaciones)'],
    instructions: ['Filtrar por usuario/dependencia.', 'Marcar leído y gestionar respuesta dentro de plazo.']
  },
  alerts: {
    title: 'Alertas',
    level: 'ALTO',
    purpose: 'Control de vencimientos y avisos operativos de plazos documentales.',
    legal: ['COA', 'Gestión documental interna'],
    instructions: ['Revisar pendientes diariamente.', 'Usar export CSV para seguimiento y auditoría.']
  },
  dashboard: {
    title: 'Dashboard Ejecutivo',
    level: 'MEDIO',
    purpose: 'Visualización de KPIs, SLA y estado del flujo documental.',
    legal: ['EGSI (monitoreo)', 'Control interno institucional'],
    instructions: ['Filtrar por fechas para análisis de tendencia.', 'Revisar top de vencidos para gestión priorizada.']
  },
  usuarios: {
    roles: ['ADMIN: cambio de roles/estado', 'SUPERVISOR: gestión controlada', 'RESPONSABLE/RECEPCIÓN/CONSULTA: sin privilegios de administración'],
    title: 'Administración de Usuarios',
    level: 'CRITICO',
    purpose: 'Gestión de roles y estado de usuarios con auditoría administrativa.',
    legal: ['EGSI', 'LOPDP (acceso por necesidad)'],
    instructions: ['Asignar rol mínimo necesario.', 'Registrar cambios de rol/estado vía módulo administrativo.'],
    warnings: [
      'Asignar privilegios excesivos puede generar acceso indebido a información pública/Reservada.',
      'Cambios sin auditoría exponen a observaciones de control interno y responsabilidad administrativa.'
    ]
  },
  settings_system: {
    title: 'Configuración del Sistema',
    level: 'ALTO',
    purpose: 'Parámetros institucionales (SLA, canal de alertas, política de trabajo).',
    legal: ['Gobernanza TI institucional'],
    instructions: ['Actualizar parámetros por entidad.', 'Evitar cambios sin aprobación administrativa.']
  },
  ccd: {
    roles: ['ADMIN/SUPERVISOR: creación y actualización CCD', 'RESPONSABLE: consulta', 'CONSULTA: lectura'],
    title: 'CCD (Series/Subseries)',
    level: 'CRITICO',
    purpose: 'Clasificación documental base para organización archivística.',
    legal: ['Ley Orgánica del Sistema Nacional de Archivos', 'Normativa técnica del Archivo Nacional'],
    instructions: [
      'Crear series y subseries con codificación única institucional.',
      'Evitar registrar documentos fuera del CCD aprobado.',
      'Mantener consistencia entre serie, subserie y tipo documental.'
    ],
    warnings: [
      'Sin CCD formal, se compromete la organización archivística y la retención legal.',
      'Clasificación inconsistente dificulta auditorías y transferencias documentales.'
    ]
  },
  trd: {
    roles: ['ADMIN/SUPERVISOR: definición de retención/disposición', 'RESPONSABLE: consulta de reglas', 'CONSULTA: lectura'],
    title: 'TRD (Retención)',
    level: 'CRITICO',
    purpose: 'Definición de plazos archivísticos y disposición final documental.',
    legal: ['Ley de Archivos', 'COA', 'Normativa archivística institucional'],
    instructions: [
      'Definir años activos y semiactivos por serie/subserie.',
      'Seleccionar disposición final con fundamento legal explícito.',
      'Revisar periódicamente reglas TRD para actualización normativa.'
    ],
    warnings: [
      'Retención incorrecta puede generar eliminación indebida o conservación ilegal.',
      'Falta de base legal en disposición final expone a observaciones de auditoría.'
    ]
  },
  case_files: {
    roles: ['ADMIN/SUPERVISOR: apertura/cierre y control', 'RESPONSABLE/RECEPCIÓN: incorporación de actuaciones', 'CONSULTA: lectura del expediente'],
    title: 'Expedientes electrónicos (enfoque jurídico)',
    level: 'CRITICO',
    purpose: 'Consolidar actuaciones administrativas en una unidad documental formal, con secuencia, trazabilidad, cierre jurídico e integridad verificable.',
    legal: [
      'Código Orgánico Administrativo (COA): formación, impulso y cierre de actuaciones administrativas',
      'Ley Orgánica del Sistema Nacional de Archivos: organización, conservación y custodia documental',
      'Normativa técnica archivística: orden e integridad del expediente',
      'Principios de seguridad institucional: integridad, autenticidad, trazabilidad y no alteración post-cierre'
    ],
    instructions: [
      '1) Crear expediente con código único y título representativo del trámite.',
      '2) Vincular documentos en orden cronológico/funcional (folio automático).',
      '3) Verificar que cada actuación tenga responsable y estado trazable.',
      '4) Cerrar expediente únicamente cuando el trámite esté concluido.',
      '5) Tras cierre, no incorporar nuevas actuaciones; gestionar reapertura solo mediante acto administrativo autorizado.',
      '6) Validar sello de cierre (hash) como evidencia de integridad del índice.',
      'Roles: ADMIN/SUPERVISOR = apertura/cierre y control; RESPONSABLE/RECEPCIÓN = incorporación en expediente abierto; CONSULTA = solo lectura.'
    ],
    warnings: [
      'Riesgo de nulidad o impugnación de actuaciones si se rompe la secuencia documental.',
      'Riesgo de observaciones de auditoría por alteraciones post-cierre o falta de custodia.',
      'Riesgo probatorio si no se preserva integridad del índice y evidencia de cierre.'
    ]
  },
  document_detail: {
    roles: ['ADMIN/SUPERVISOR: control total', 'RESPONSABLE: respuesta y gestión', 'RECEPCIÓN: derivación/lectura', 'CONSULTA: lectura'],
    title: 'Detalle de Documento',
    level: 'ALTO',
    purpose: 'Operación completa del trámite: derivar, responder, archivos, timeline.',
    legal: ['COA', 'Trazabilidad administrativa', 'Ley de Archivos'],
    instructions: [
      'Usar derivación múltiple cuando exista pluralidad de áreas responsables.',
      'Registrar respuesta con evidencia documental y responsable identificado.',
      'Verificar clasificación CCD/TRD antes de cerrar actuaciones.'
    ],
    warnings: [
      'Cambios fuera de flujo pueden afectar integridad del expediente.',
      'Respuestas sin soporte afectan trazabilidad y defensa administrativa.'
    ]
  },
  document_form: {
    title: 'Formulario de Documento',
    level: 'CRITICO',
    purpose: 'Creación/edición de documento institucional.',
    legal: ['COA', 'Ley de Archivos', 'LOPDP (cuando incluya datos personales)'],
    instructions: ['Completar metadatos obligatorios.', 'Asignar serie/subserie y regla TRD válidas.', 'Cargar archivo principal cuando exista soporte digital.'],
    warnings: ['Crear documentos sin metadatos obligatorios afecta cumplimiento archivístico y legal.']
  }
};
