import { AutorizaService } from '../compartida/autoriza.service';
import { Documentos } from './administracion/documentos.model';
let authService: AutorizaService;
export class Suspensiones {
  idsuspension: number;
  tipo: number = 1;
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
