export interface SriEmitidoRow {
  comprobante: string;
  serie_comprobante: string;
  clave_acceso: string;
  fecha_autorizacion: string;
  fecha_emision: string;
  valor_sin_impuestos: number;
  iva: number;
  importe_total: number;

  // extra
  raw?: string;
  valido?: boolean;
  error?: string;

  // enriquecidos desde ERP
  encontrada?: boolean;
  idfactura?: number | null;
  fechacobro?: string | null;

  // control de proceso
  estadoProceso?: 'PENDIENTE' | 'NO_ENCONTRADA' | 'ENCONTRADA' | 'SALTADA' | 'ACTUALIZADA' | 'ERROR';
  msg?: string;
}
