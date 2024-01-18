import { Nacionalidad } from "./nacionalidad";
import { PersoneriaJuridica } from "./personeria-juridica";

export class Clientes {
    idcliente: number;
    cedula: String;
    nombre: String;
    direccion: String;
    telefono: String;
    fechanacimiento: Date;
    idtpidentifica_tpidentifica: number;
    discapacitado: number;
    porcdiscapacidad: number;
    porcexonera: number;
    estado: number;
    email: String;
    usucrea: number;
    idnacionalidad_nacionalidad: Nacionalidad;
    feccrea: Date;
    usumodi: number;
    fecmodi: Date;
    idpjuridica_personeriajuridica: PersoneriaJuridica;
}
