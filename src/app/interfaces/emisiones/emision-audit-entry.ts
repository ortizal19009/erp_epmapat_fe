export interface EmisionAuditEntry {
  entidad: string;
  idregistro: number;
  accion: string;
  detalle: string;
  usuario: number;
  fecha: string;
}

export interface EmisionAuditSnapshot {
  emision: any;
  rutas: any[];
  lecturas: any[];
  facturas: any[];
}
