import { Clientes } from "./clientes";
import { Facturas } from "./facturas.model";
import { TpCertifica } from "./tp-certifica";

export class Certificaciones {
    idcertificacion: number;
    numero: number;
    anio: number;
    referenciadocumento: String;
    idtpcertifica_tpcertifica: TpCertifica;
    idfactura_facturas: Facturas;
    idcliente_clientes: Clientes;
    usucrea: number;
    feccrea: Date;
    usumodi: number;
    fecmodi: Date;
}
