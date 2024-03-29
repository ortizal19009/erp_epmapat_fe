import { AutorizaService } from "../compartida/autoriza.service";

let authService: AutorizaService
export class Tpidentifica {
    idtpidentifica!: number;
    codigo?: string;
    nombre?: string;
    usucrea: number = authService.idusuario;
    feccrea!: Date;
    usumodi!: number;
    fecmodi!: Date;
}