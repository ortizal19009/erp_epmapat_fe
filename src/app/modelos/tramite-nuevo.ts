// import { AguaTramite } from './agua-tramite';
// import { Categoria } from './categoria';

import { Aguatramite } from "./aguatramite.model";
import { Categoria } from "./categoria.model";

export class TramiteNuevo {
  idtramitenuevo: number;
  direccion: String;
  nrocasa: String;
  nrodepar: String;
  referencia: String;
  barrio: String;
  tipopredio: number;
  presentacedula: number = 0;
  presentaescritura: number = 0;
  solicitaagua: number = 1;
  solicitaalcantarillado: number = 1;
  aprobadoagua: number;
  aprobadoalcantarillado: number;
  fechainspeccion: Date;
  medidorempresa: number = 0;
  medidormarca: String;
  medidornumero: String;
  medidornroesferas: number;
  tuberiaprincipal: String;
  tipovia: number;
  codmedidor: number;
  codmedidorvecino: number;
  secuencia: number;
  inspector: String;
  areaconstruccion: number;
  notificado: String;
  fechanotificacion: Date;
  observaciones: String='';
  estado: number;
  fechafinalizacion: Date;
  medidordiametro: number;
  idcategoria_categorias: Categoria ;
  idaguatramite_aguatramite: Aguatramite;
  usucrea: number;
  feccrea: Date;
  usumodi: number;
  fecmodi: Date;
}
