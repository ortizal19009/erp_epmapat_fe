import { Cargos } from './cargos';
import { Contemergencia } from './contemergencia';
import { Tpcontratos } from './tpcontratos';

export class Personal {
  idpersonal: number;
  nombres: string;
  apellidos: string;
  identificacion: string;
  email: string;
  celular: string;
  direccion: string;
  idcontemergencia_contemergencias: Contemergencia;
  idcargo_cargos: Cargos;
  idtpcontrato_tpcontratos: Tpcontratos;
  usucrea: number;
  feccrea: Date;
  usumodi: number;
  fecmodi: Date;
  estado: boolean;
  codigo: string;
  fecnacimiento: Date;
  sufijo: string;
  tituloprofesional: string;
  fecinicio: Date;
  fecfin: Date;
  nomfirma: string;
}
