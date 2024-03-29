import { AutorizaService } from '../compartida/autoriza.service';

let authService: AutorizaService;
export class Tipopago {
  idtipopago!: number;
  descripcion!: string;
  usucrea: number = authService.idusuario;
}
