export interface DocumentoListItem {
  id: string;
  flujo: 'INGRESO' | 'SALIDA';
  origen: 'INTERNO' | 'EXTERNO';
  estado: string;
  prioridad: string;
  confidencialidad: string;

  tipo_doc_id: string;
  tipo_codigo: string;
  tipo_nombre: string;

  dependencia_emisora_id?: string | null;
  dep_codigo?: string | null;
  dep_nombre?: string | null;

  numero_oficial?: string | null;
  fecha_elaboracion?: string;
  fecha_emision?: string | null;

  remitente_externo?: string | null;
  asunto: string;
  referencia?: string | null;
}
