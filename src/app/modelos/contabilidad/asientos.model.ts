import { Documentos } from "../administracion/documentos.model";
import { Beneficiarios } from "./beneficiarios.model";

export class Asientos {
  idasiento: number;
  asiento: number;
  fecha: Date;
  tipasi: number;
  tipcom: number;
  compro: number;
  numcue: number;
  totdeb: number;
  totcre: number;
  glosa: String;
  numdoc: String;
  numdocban: String;
  cerrado: Boolean;
  swretencion: Boolean;
  totalspi: number;
  iddocumento: Documentos;
  idbene: Beneficiarios;
  idcueban: number;
  usucrea: number;
  feccrea: Date;
  usumodi: number;
  fecmodi: Date;
}
