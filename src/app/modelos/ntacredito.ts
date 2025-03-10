import { Clientes } from "./clientes";

export class Ntacredito {
    idntacredito: number;
    estado: number;
    observacion: string;
    valor: number;
    devengado: number;
    idtransfernota: number;
    razontransferencia: string;
    nrofactura: string;
    usuarioeliminacion: number;
    fechaeliminacion: Date;
    razoneliminacion: string;
    idcleinte_clientes: Clientes;
    usucrea: number;
    feccrea: Date;
    usumodi: number;
    fecmodi: Date;
}
