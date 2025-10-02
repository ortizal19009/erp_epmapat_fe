import { Convenios } from "./convenios.model";
import { Facturas } from "./facturas.model";

export class Cuotas {
   idcuota: number;
   nrocuota: number;
   idfactura: Facturas;
   idconvenio_convenios: Convenios;
   usucrea: number;
   feccrea: Date;
}
