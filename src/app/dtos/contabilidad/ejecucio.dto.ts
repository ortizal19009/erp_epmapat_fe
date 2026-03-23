export interface EjecucioCreateDTO {
   codpar: String;
   fecha_eje: Date;
   tipeje: number;
   modifi: number;
   prmiso: number;
   totdeven: number;
   devengado: number;
   cobpagado: number;
   concep: string;
   usucrea: number;
   feccrea: Date;
   idasiento: number;
   inttra: number;
   intpre: { intpre: number };
   idrefo: number;
   idtrata: number;
}