import { AutorizaService } from '../compartida/autoriza.service';
import { Documentos } from './administracion/documentos.model';
import { Facturas } from './facturas.model';
let authService: AutorizaService;
export class Suspensiones {
  idsuspension: number;
  tipo: number = 1;
  idsuspension_origen?: Suspensiones;
  idfactura_facturas?: Facturas;
  factura?: number;
  fecha: Date;
  numero: number;
  total: number;
  iddocumento_documentos: Documentos;
  numdoc: string;
  observa: string;
  usucrea: number = 1;
  feccrea: Date = new Date();
  usumodi: number;
  fecmodi: Date;
}
