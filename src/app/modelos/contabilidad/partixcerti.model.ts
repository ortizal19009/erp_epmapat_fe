import { Certipresu } from './certipresu.model';
import { Presupue } from './presupue.model';

export class Partixcerti {
  idparxcer: number;
  descripcion: String;
  valor: number;
  saldo: number;
  totprmisos: number;
  usucrea: number;
  feccrea: Date;
  usumodi: number;
  fecmodi: Date;
  idejecucion: number;
  intpre: Presupue;
  idcerti: Certipresu;
  idparxcer_: number;
}
