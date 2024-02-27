import { Usuarios } from './administracion/usuarios.model';
import { Cajas } from './cajas.model';

export class Recaudaxcaja {
  idrecaudaxcaja: number;
  estado: number;
  facinicio: number;
  facfin: number;
  fechainiciolabor: Date;
  fechafinlabor: Date;
  horarioinicio: Date;
  hoorafin: Date;
  idcaja_cajas: Cajas;
  idusuario_usuarios: Usuarios;
}
