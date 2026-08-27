import { Facturas } from './facturas.model';

export class Condmultaintereses {
  idcondmultainteres: number;
  idfactura_facturas: Facturas;
  totalinteres: number;
  totalmultas: number;
  usucrea: number;
  feccrea: Date;
  razonExoneracion: String;
  razoncondonacion?: String;
  estado?: string;
  usuarioCreador?: string;
  idusaprueba?: number | null;
  usuarioAprueba?: string | null;
  fecaprobacion?: Date | null;
  observacionAprobacion?: string | null;
  idfactura?: number;
  nrofactura?: string;
  idcliente?: number;
  abonado?: string;
  cuenta?: number;
  fechaFactura?: Date;
}
