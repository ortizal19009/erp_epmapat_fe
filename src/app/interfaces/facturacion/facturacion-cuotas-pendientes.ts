export interface FacturacionCuotasPendientes {
  idfacturacion: number;
  feccrea: Date | string | null;
  cliente: string;
  descripcion: string;
  valorFacturacion: number;
  cuotas: number;
  planillasGeneradas: number;
  planillasPagadas: number;
  planillasPendientes: number;
  valorPlanillas: number;
  valorPendiente: number;
}
