import { Facturas } from "./facturas.model";
import { Recaudacion } from "./recaudacion.model";

export class Facxrecauda {
   
    idfacxrecauda: number;
    idrecaudacion: Recaudacion;
    idfactura: Facturas;
    estado: number;
    fechaeliminacion: Date;
    usuarioeliminacion: number
 
 }