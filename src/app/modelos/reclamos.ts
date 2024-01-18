import { TpReclamo } from "./tp-reclamo";
import { Modulos } from "./modulos.model";

export class Reclamos {
    idreclamo: number;
    observacion: String;
    referencia:number;
    fechaasignacion: Date;
    estado: number;
    referenciadireccion: String;
    piso: String;
    departamento : String;
    fechamaxcontesta : Date;
    fechacontesta : Date;
    contestacion : String; 
    fechaterminacion : Date;
    responsablereclamo : String; 
    modulo : String; 
    notificacion : String;
    estadonotificacion : number; 
    idtpreclamo_tpreclamo : TpReclamo;
    idmodulo_modulos: Modulos;
    usucrea: number;
    feccrea: Date;
    usumodi: number;
    fecmodi: Date;
}
