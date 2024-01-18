import { Facturacion } from "./facturacion.model";
import { Catalogoitems } from "./catalogoitems.model";

export class Itemxfact {
   iditemxfact: number;
   cantidad: number;
   valorunitario: number;
   idfacturacion_facturacion: Facturacion;
   idcatalogoitems_catalogoitems: Catalogoitems;
}
