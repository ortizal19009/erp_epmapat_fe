import { Facturas } from '../facturas.model';
import { Remision } from './remision';

export class Facxremi {
  idfacxremi: number;
  idfactura_facturas: Facturas;
  idremision_remisiones: Remision;
  cuota: number;
  tipfactura: number;
}
