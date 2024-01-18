import { Usoitems } from "./usoitems.model";
import { Rubros } from "./rubros.model";

export class Catalogoitems {
   idcatalogoitems: number;
   descripcion: String;
   cantidad: number;
   facturable: number;
   estado: Boolean;
   idusoitems_usoitems: Usoitems;
   idrubro_rubros: Rubros;
   usucrea: number = 1;
   feccrea: Date;
   usumodi: number;
   fecmodi: Date;
}
