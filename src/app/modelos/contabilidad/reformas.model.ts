import { Documentos } from "../administracion/documentos.model";

export class Reformas { 
  idrefo: number;
  numero: number;
  fecha: Date;
  tipo: string;
  valor: number;
  concepto: string;
  numdoc: string;
  intdoc: Documentos;
  usucrea: number;
  feccrea: Date;
  usumodi: number;
  fecmodi: Date;
}
