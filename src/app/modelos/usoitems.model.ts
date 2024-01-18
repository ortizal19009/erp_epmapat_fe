import { Modulos } from "./modulos.model";

export class Usoitems{
   idusoitems: number;
   descripcion: String;
   estado: Boolean;
   idmodulo_modulos: Modulos;
   usucrea: number = 1;
   feccrea: Date;
   usumodi: number;
   fecmodi: Date;
}