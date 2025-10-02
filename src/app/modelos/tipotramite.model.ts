import { AutorizaService } from '../compartida/autoriza.service';

let authService: AutorizaService;
export class Tipotramite {
  idtipotramite: number;
  descripcion: String;
  facturable: number;
  estado: number = 1;
  usucrea: number ;
  feccrea: Date;
  usumodi: number;
  fecmodi: Date;
}
