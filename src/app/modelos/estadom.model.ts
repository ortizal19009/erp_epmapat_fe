import { AutorizaService } from '../compartida/autoriza.service';

let authService: AutorizaService;
export class Estadom {
  idestadom!: number;
  descripcion!: string;
  usucrea: number = authService.idusuario;
}
