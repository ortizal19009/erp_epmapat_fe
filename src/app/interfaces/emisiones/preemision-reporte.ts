export interface PreemisionCuenta {
  cuenta: number;
  abonado: string;
  categoria: string;
  anterior: number;
  actual: number;
  m3: number;
  valor: number;
  observacion: string;
}

export interface PreemisionRuta {
  idruta: number | null;
  codigo: string;
  ruta: string;
  cuentas: number;
  m3: number;
  valor: number;
  detalle: PreemisionCuenta[];
}

export interface PreemisionReporte {
  idemision: number;
  emision: string;
  cuentas: number;
  m3: number;
  valor: number;
  consumosNegativos: number;
  rutas: PreemisionRuta[];
}
