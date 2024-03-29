import { AutorizaService } from '../compartida/autoriza.service';

let authService: AutorizaService;
export class Emisiones {
  idemision: number;
  emision: String;
  estado: number = 1;
  observaciones: string;
  usuariocierre: number;
  fechacierre: Date;
  m3: number;
  usucrea: number = authService.idusuario;
  feccrea: Date;
  usumodi: number;
  fecmodi: Date;
}
