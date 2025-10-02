import { Beneficiarios } from "./beneficiarios.model";
import { Benextran } from "./benextran.model";
import { Transaci } from "./transaci.model";

export class Pagoscobros {

   idpagcob: number;
   inttra: Transaci;
   idbene: Beneficiarios;
   idbenxtra: Benextran;
   valor: number;
   intpre: number;
   codparreci: string;
   codcuereci: string;
   asierefe: number;

}
