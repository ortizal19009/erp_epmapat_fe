import { Abonados } from "./abonados";
import { Documentos } from "./administracion/documentos.model";
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
    idcliente_clientes: Clientes;
    idabonado_abonados: Abonados;
    usucrea: number;
    feccrea: Date;
    usumodi: number;
    fecmodi: Date;
    iddocumento_documentos: Documentos; 
    refdocumento: String;
}
