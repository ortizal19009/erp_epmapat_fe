import { AutorizaService } from "../compartida/autoriza.service";

let authService: AutorizaService
export class Tpidentifica {
    idtpidentifica!: number;
    codigo?: string;
    nombre?: string;
    usucrea: number =1;
    feccrea!: Date;
    usumodi!: number;
    fecmodi!: Date;
}