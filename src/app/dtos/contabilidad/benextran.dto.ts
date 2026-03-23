export interface BenextranCreateDTO {
   inttra: { inttra: number };
   idbene: { idbene: number };
   intdoc: { intdoc: number };
   numdoc: String;
   valor: number;
   totpagcob: number;
   pagocobro: number;
}

export interface BenextranUpdateDTO {
   idbene?: { idbene: number };
   intdoc?: { intdoc: number };
   numdoc?: String;
   valor?: number;
   totpagcob?: number;
   intpre?: number;
   codparreci?: string;
   codcuereci?: string;
   asierefe?: number;
}
