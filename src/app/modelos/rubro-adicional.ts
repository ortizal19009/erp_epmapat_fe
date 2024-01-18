import { Rubros } from "./rubros.model";
import { TpTramite } from "./tp-tramite";

export class RubroAdicional {
    idrubroadicional: number;
    valor: number;
    swiva: number;
    rubroprincipal: number;
    usucrea: number;
    feccrea: Date;
    usumodi: number;
    fecmodi: Date;
    idrubro_rubros: Rubros;
    idtptramite_tptramite: TpTramite;
}
