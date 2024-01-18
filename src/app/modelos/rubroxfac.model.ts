import { Facturas } from "./facturas.model";
import { Rubros } from "./rubros.model";

export class Rubroxfac {

    idrubroxfac: number;
    cantidad: number;
    valorunitario: number;
    estado: number;
    idfactura_facturas: Facturas;
    idrubro_rubros: Rubros;
    
}
