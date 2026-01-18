import { Abonados } from "./abonados";
import { Emisiones } from "./emisiones.model";
import { Rubros } from "./rubros.model";

export class Recargosxcuenta {
  idrecartoxcuenta: number;
  idabonado_abonados: Abonados;
  tipo: number;
  idemision_emisiones: Emisiones;
  idrubro_rubros: Rubros;
  observacion: String;
  usucrea: number;
  feccrea: Date;
  usumodi: number;
  fecmodi: Date;
  usuresp: number;
  fecha:Date;
}
