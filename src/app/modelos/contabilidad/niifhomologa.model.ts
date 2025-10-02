import { Cuentas } from "./cuentas.model";
import { Niifcuentas } from "./niifcuentas.model";

export class Niifhomologa {
   idhomologa: number;
   codcueniif: string;
   codcue: string;
   idniifcue: Niifcuentas;
   idcuenta: Cuentas;
}
