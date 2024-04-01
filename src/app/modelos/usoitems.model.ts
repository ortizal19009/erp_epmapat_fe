import { AutorizaService } from '../compartida/autoriza.service';
import { Modulos } from './modulos.model';
let authService: AutorizaService;
export class Usoitems {
  idusoitems: number;
  descripcion: String;
  estado: Boolean;
  idmodulo_modulos: Modulos;
  usucrea: number= 1 ;
  feccrea: Date;
  usumodi: number;
  fecmodi: Date;
}
