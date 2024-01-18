import { Abonados } from "./abonados";
import { Novedad } from "./novedad.model";
import { Rutasxemision } from "./rutasxemision.model";

export class Lecturas {

    idlectura: number;
    estado: number;
    fechaemision: Date;
    lecturaanterior: number;
    lecturaactual: number;
    lecturadigitada: number;
    mesesmulta: number;
    observaciones: String;
    idnovedad_novedades: Novedad;
    idemision: number;
    idabonado_abonados: Abonados
    idresponsable: number;  //Usuario al que se factura 
    idcategoria: number;    //Debería ser Categorias?
    idrutaxemision_rutasxemision: Rutasxemision;
    idfactura: number;      //Se crea cuando se cierra
    total1: number;         //Total con el Nuevo Pliego (Gradualidad: Un solo año )
    total31: number;        //Total con el Nuevo Pliego (1er año de 3)
    total32: number;        //Total con el Nuevo Pliego (2do año de 3)
}
