import { Documentos } from "./administracion/documentos.model";

export class Suspensiones {
    idsuspension: number;
    tipo: number = 1;
    fecha: Date;
    numero: number;
    total: number;
    iddocumento_documentos: Documentos;
    numdoc: string;
    observa: string;
    usucrea: number = 1;
    feccrea: Date = new Date();
    usumodi: number;
    fecmodi: Date;
}
