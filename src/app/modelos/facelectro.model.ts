import { Cajas } from "./cajas.model";
import { Facturas } from "./facturas.model";

export class Facelectro {

   idfacelectro: number;
   codigonumerico: String;
   digitoverificador: String;
   nombrexml: String;
   estado: number;
   claveacceso: String;
   swenviada: number;
   identificacion: String;
   nombre: String;
   direccion: String;
   telefono: String;
   concepto: String;
   base0: number;
   baseimponiva: number;
   iva12: number;
   iva0: number;
   total: number;
   numautorizacion: String;
   mensaje: String;
   tpidentifica: String;
   idfactura_facturas: Facturas;
   idcaja_cajas: number;
   usucrea: number;
   feccrea: Date;
   impuesto: number;
   impuestoretener: number;
   porciva: number;
   nrofac: String;
}