import { Facturas } from "./facturas.model";
import { Tramites1 } from "./tramites1";

export class LiquidaTramite1 {
    idliquidatramite: number;
    cuota: number;
    valor: number;
    usuarioeliminacion: number;
    fechaeliminacion: Date;
    razoneliminacion: String;
    estado: number;
    observacion: String;
    idtramite_tramites1: Tramites1;
    idfactura_facturas: Facturas;
    usucrea: number;
    feccrea: Date;
}
