import { Abonados } from "./abonados";
import { Clientes } from "./clientes";

export class Tramites1 {
    idtramite:number;
    valor: number;
    descripcion:String;
    idcliente_clientes:Clientes;
    idabonado_abonados:Abonados;
    fecha:Date;
    validohasta:Date;
    usucrea: number;
    feccrea: Date;
    usumodi: number;
    fecmodi: Date;
}
