import { Emisiones } from "./emisiones.model";
import { Rutas } from "./rutas.model";

export class Rutasxemision {
    idrutaxemision: number;
    estado: number;
    usuariocierre: number;
    fechacierre: Date;
    usucrea: number = 1;
    feccrea: Date;
    idemision_emisiones: Emisiones;
    idruta_rutas: Rutas;
    m3: number;
}