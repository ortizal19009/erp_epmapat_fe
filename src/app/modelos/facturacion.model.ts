import { AutorizaService } from "../compartida/autoriza.service";
import { Clientes } from "./clientes";
let authService: AutorizaService
export class Facturacion {
    idfacturacion: number;
    estado: number;
    descripcion: String;
    formapago: number;
    idcliente_clientes: Clientes;
    total: number;
    cuotas: number;
    usucrea: number = 1
    feccrea: Date;
    usumodi: number;
    fecmodi: Date;
}
