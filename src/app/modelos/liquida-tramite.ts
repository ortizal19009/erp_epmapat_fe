import { Facturas } from "./facturas.model";
import { Tramites } from "./ctramites";

export class LiquidaTramite {
    idliquidatrami: number;
    cuota: number;
    valor: number;
    usuarioeliminacion: number;
    fechaeliminacion: Date;
    razoneliminacion: String;
    estado: number;
    observacion: String;
    idtramite_tramites: Tramites;
    idfactura_facturas: Facturas;
    usucrea: number;
    feccrea: Date;
}
