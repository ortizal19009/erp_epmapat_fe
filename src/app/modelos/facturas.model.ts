import { Abonados } from './abonados';
import { Clientes } from './clientes';
import { Modulos } from './modulos.model';

export class Facturas {
  idfactura: number;
  idmodulo: Modulos;
  idcliente: Clientes;
  idabonado: number; //Probar con Abonados;
  nrofactura: String;
  porcexoneracion: number;
  razonexonera: String;
  totaltarifa: number;
  pagado: number;
  usuariocobro: number;
  fechacobro: Date;
  estado: number;
  usuarioanulacion: number;
  razonanulacion: String;
  usuarioeliminacion: number;
  fechaeliminacion: Date;
  razoneliminacion: String;
  conveniopago: number;
  fechaconvenio: Date;
  estadoconvenio: number;
  formapago: number;
  reformapago: String;
  horacobro: String;
  usuariotransferencia: number;
  fechatransferencia: Date;
  usucrea: number;
  feccrea: Date;
  usumodi: number;
  fecmodi: Date;
  valorbase: number;
  interescobrado: number;
  swiva: number;
}
