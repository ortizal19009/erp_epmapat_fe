import { Abonados } from "./abonados";

export class Convenios {
    idconvenio: number;
    nroautorizacion: String;
    referencia: String;
    estado: number;
    nroconvenio: number;
    totalconvenio: number;
    cuotas: number;
    cuotainicial: number;
    pagomensual: number;
    cuotafinal: number;
    observaciones: String;
    usuarioeliminacion: number;
    fechaeliminacion: Date;
    razoneliminacion: String;
    usucrea: number;
    feccrea: Date;
    usumodi: number;
    fecmodi: Date;
    idabonado: Abonados;
}
