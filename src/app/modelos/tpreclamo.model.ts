import { AutorizaService } from '../compartida/autoriza.service';

let authService: AutorizaService;
export class Tpreclamo {
  idtpreclamo!: number;
  descripcion?: string;
  usucrea: number = 1;
  feccrea!: Date;
  usumodi!: number;
  fecmodi!: Date;
}
