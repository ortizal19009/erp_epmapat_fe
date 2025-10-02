import { AutorizaService } from '../compartida/autoriza.service';

let authService: AutorizaService;
export class Ubicacionm {
  idubicacionm!: number;
  descripcion?: string;
  usucrea: number = 1;
  feccrea!: Date;
  usumodi!: number;
  fecmodi!: Date;
}
