import { Abonados } from "../abonados";
import { Documentos } from "../administracion/documentos.model";
import { Clientes } from "../clientes";

export class Remision {
  idremision: number;
  idcliente_clientes: Clientes;
  idabonado_abonados: Abonados;
  cuotas: number; 
  fectopedeuda: Date; 
  fectopepago: Date; 
  totcapital: number; 
  totintereses: number; 
  swconvenio : Boolean; 
  usucrea: number; 
  feccrea: Date; 
  usumodi: number; 
  fecmodi: Date; 
  iddocumento_documentos: Documentos; 
  detalledocumento: string; 
  idconvenio: number; 
}
