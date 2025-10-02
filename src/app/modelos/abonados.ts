import { Categoria } from "./categoria.model";
import { Clientes } from "./clientes";
import { Estadom } from "./estadom.model";
import { Rutas } from "./rutas.model";
import { Tipopago } from "./tipopago.model";
import { Ubicacionm } from "./ubicacionm.model";

export class Abonados {
    idabonado: number;
    nromedidor: String;
    lecturainicial: number;
    estado: number;
    fechainstalacion: Date;
    marca: String;
    secuencia: number;
    direccionubicacion: String;
    localizacion: String;
    observacion: String;
    departamento: String;
    piso: String;
    idresponsable: Clientes;
    idcategoria_categorias: Categoria;
    idruta_rutas: Rutas;
    idcliente_clientes: Clientes;
    idubicacionm_ubicacionm: Ubicacionm;
    idtipopago_tipopago: Tipopago;
    idestadom_estadom: Estadom;
    medidorprincipal: number;
    usucrea: number;
    feccrea: Date;
    usumodi: number;
    fecmodi: Date;
    adultomayor: Boolean; 
    municipio: Boolean;
    swalcantarillado: Boolean;
    promedio: number;
    geolocalizacion: string;
}
