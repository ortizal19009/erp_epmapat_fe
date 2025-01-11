import { Documentos } from "../administracion/documentos.model";
import { Beneficiarios } from "./beneficiarios.model";
import { Transaci } from "./transaci.model";

export class Benextran {

   idbenxtra: number;
   inttra: Transaci;
   idbene: Beneficiarios;
   intdoc: Documentos;
   numdoc: string;
   valor: number;
   totpagcob: number;
   pagocobro: number;
   intpre: number;
   codparreci: string;
   codcuereci: string;
   asierefe: number;

}
