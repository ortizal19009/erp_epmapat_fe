export interface Documento {
  id: string;
  entidad_id: string;
  tipo_doc_id: string;
  dependencia_emisora_id: string | null;
  asunto: string;
  referencia?: string | null;
  fecha_elaboracion?: string | null;
  estado: 'BORRADOR' | 'EN_REVISION' | 'EMITIDO';
}
