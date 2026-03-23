export interface TransaciCreateDTO {
   idasiento: { idasiento: number };
   tiptran: number;
   orden: number;
   idcuenta: { idcuenta: number };
   codcue: string;
   intdoc: { intdoc: number };
   numdoc: string;
   debcre: number;
   valor: number;
   descri: String;
   intpre: number | null;
   idbene: { idbene: number };
   totbene: number;
   usucrea: number;
   feccrea: Date;
}

export interface TransaciUpdateDTO {
   orden?: number;
   idcuenta?: { idcuenta: number };
   codcue?: string;
   intdoc?: { intdoc: number };
   numdoc?: string;
   debcre?: number;
   valor?: number;
   descri?: String;
   idbene?: { idbene: number};
   totbene?: number;
   usumodi?: number;
   fecmodi?: Date;
}