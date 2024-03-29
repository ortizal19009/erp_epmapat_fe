import { Usoitems } from './usoitems.model';
import { Rubros } from './rubros.model';
import { AutorizaService } from '../compartida/autoriza.service';
let authService: AutorizaService;
export class Catalogoitems {
  idcatalogoitems: number;
  descripcion: String;
  cantidad: number;
  facturable: number;
  estado: Boolean;
  idusoitems_usoitems: Usoitems;
  idrubro_rubros: Rubros;
  usucrea: number = authService.idusuario;
  feccrea: Date;
  usumodi: number;
  fecmodi: Date;
}
