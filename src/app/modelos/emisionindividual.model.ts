import { Emisiones } from "./emisiones.model";
import { Lecturas } from "./lecturas.model";

export class EmisionIndividual {
  idemisionindividual: number;
  idemision: Emisiones;
  idlecturanueva: Lecturas;
  idlecturaanterior: Lecturas;
}
