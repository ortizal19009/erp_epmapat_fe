import { Clasificador } from "../clasificador.model";

export class Presupue {
  
  ejecCompromiso?: number;
  ejecDevengado?: number;
  ejecCobpagado?: number;
  codificado?: number;
  compromiso?: number | null;
  devengado?: number | null;
  cobpagado?: number | null;
  saldoCompromiso?: number | null;
  saldoDevengado?: number | null;
  saldoCobpagado?: number | null;
  intpre: number;
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
  intest: number;
  codacti: String;
  intcla: Clasificador;
  codpart: String;
  swpluri: number;
  usucrea: number;
  feccrea: Date;
  usumodi: number;
  fecmodi: Date;
}
