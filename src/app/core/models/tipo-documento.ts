export interface TipoDocumento {
  id: string;
  codigo: string;
  nombre: string;
  activo: boolean;
  flujo: 'INGRESO' | 'SALIDA';
}
