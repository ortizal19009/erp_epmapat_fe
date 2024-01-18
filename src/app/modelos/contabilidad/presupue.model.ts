import { Clasificador } from "../clasificador.model";

export class Presupue {
  idpresupue: number;
  tippar: number;
  codpar: String;
  codigo: String;
  nompar: String;
  inicia: number;
  totmod: number;
  totcerti: number;
  totmisos: number;
  totdeven: number;
  funcion: String;
  idestrfunc: number;
  codacti: String;
  intcla: Clasificador;
  codpart: String;
  swpluri: boolean;
  usucrea: number;
  feccrea: Date;
  usumodi: number;
  fecmodi: Date;
}
