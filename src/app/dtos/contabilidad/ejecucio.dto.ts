import { Asientos } from "@modelos/contabilidad/asientos.model";
import { Ejecucio } from "@modelos/contabilidad/ejecucio.model";
import { Partixcerti } from "@modelos/contabilidad/partixcerti.model";
import { Tramipresu } from "@modelos/contabilidad/tramipresu.model";

export interface EjecucioCreateDTO {
   tipeje: number;
   intpre: { intpre: number };
   codpar: String;
   fecha_eje: Date;
   modifi: number;
   prmiso: number;
   totdeven: number;
   devengado: number;
   cobpagado: number;
   concep: string;
   idrefo: number;
   idtrami: number | null;
   idasiento: number | null;
   inttra: number | null;
   idparxcer: number | null;
   idprmiso: number | null;
   idtrata: number;
   usucrea: number;
   feccrea: Date;
}

export interface EjecucioUpdateDTO {
   intpre?: { intpre: number };
   codpar?: String;
   modifi?: number;
   prmiso?: number;
   totdeven?: number;
   devengado?: number;
   cobpagado?: number;
   concep?: string;
   usumodi?: number;
   fecmodi?: Date;
}

export interface EjecucioVM extends Ejecucio {
  asiento?: Asientos;
  partixcerti?: Partixcerti;
  tramite?: Tramipresu
}

