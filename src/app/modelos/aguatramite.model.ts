import { AutorizaService } from "../compartida/autoriza.service";
import { Clientes } from "./clientes";
// import { Facturas } from "./facturas.model";
import { Tipotramite } from "./tipotramite.model";
let authService: AutorizaService

export class Aguatramite {
   idaguatramite: number;
   codmedidor: String;
   comentario: String;
   estado: number = 1;
   sistema: number;
   fechaterminacion: Date;
   observacion: String;
   idcliente_clientes: Clientes;
   idfactura_facturas: number;
   idtipotramite_tipotramite: Tipotramite;
   usucrea: number ;
   feccrea: Date;
   usumodi: number;
   fecmodi: Date;
}
