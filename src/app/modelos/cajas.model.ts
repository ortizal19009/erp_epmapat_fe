import { Usuarios } from "./administracion/usuarios.model";
import { Ptoemision } from "./ptoemision";

export class Cajas {
   idcaja: number;
   descripcion: String;
   codigo: String;
   estado: number;
   idptoemision_ptoemision: Ptoemision;
   usucrea: number;
   feccrea: Date;
   usumodi: number;
   fecmodi: Date;
   idusuario_usuarios: Usuarios;
   ultimafact: String; 
}
