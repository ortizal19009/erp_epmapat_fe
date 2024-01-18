import { Ifinan } from "../ifinan.model";
import { Gruposbene } from "./gruposbene.model";

export class Beneficiarios {

  idbene: number;
  codben: string;
  nomben: string;
  tpidben: string;
  rucben: string;
  ciben: string;
  tlfben: string;
  dirben: string;
  mailben: string;
  tpcueben: number;
  cuebanben: string;
  foto: string;
  idgrupo: Gruposbene;
  idifinan: Ifinan;
  swconsufin: number;
  usucrea: string;
  feccrea: Date;
  usumodi: string;
  fecmodi: Date;

}

