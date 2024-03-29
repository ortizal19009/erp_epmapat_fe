import { AutorizaService } from '../compartida/autoriza.service';

let authService: AutorizaService;
export class Ubicacionm {
  idubicacionm!: number;
  descripcion?: string;
  usucrea: number = authService.idusuario;
  feccrea!: Date;
  usumodi!: number;
  fecmodi!: Date;
}
