export interface Dependencia {
  id: string;
  codigo: string;
  nombre: string;
  activo: boolean;
  padre_id?: string | null;
  dependencia_padre?: string | null;
}
