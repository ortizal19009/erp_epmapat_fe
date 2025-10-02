import { Clientes } from "./clientes";
import { TpTramite } from "./tp-tramite";

export class Tramites {
    idtramite: number;
    estado: number;
    total: number;
    descripcion: String;
    cuotas: number;
    validohasta: Date;
    idtptramite_tptramite: TpTramite;
    idcliente_clientes: Clientes;
    usucrea: number;
    feccrea: Date;
    usumodi: number;
    fecmodi: Date;
}
