import { Facturacion } from "./facturacion.model";
import { Facturas } from "./facturas.model";

export class Liquidafac {
   idliquidafac: number;
   cuota: number;
   valor: number;
   usuarioeliminacion: number;
   fechaeliminacion: Date;
   razoneliminacion: String;
   estado: number;
   observacion: String;
   idfacturacion_facturacion: Facturacion;
   idfactura_facturas: Facturas;
   usucrea: number;
   feccrea: Date;
}
