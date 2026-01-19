export interface ValidacionError {
  idabonado: number;
  tipo: 1 | 2;
  motivo:
    | 'EMISION_CERRADA'
    | 'YA_EXISTE_TIPO1_EN_EMISION'
    | 'YA_EXISTE_TIPO1_EN_MES'
    | 'YA_EXISTE_TIPO2_EN_ANIO';
  detalle?: string;
}
