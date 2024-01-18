import { Documentos } from "../administracion/documentos.model";
import { Beneficiarios } from "./beneficiarios.model";

export class Tramipresu {
	idtrami: number;
	numero: number; 
	fecha: Date; 
	numdoc: String; 
	fecdoc: Date; 
	totmiso: number; 
	descripcion: String; 
	usucrea: number; 
	feccrea: Date; 
	usumodi: number; 
	fecmodi: Date; 
	swreinte: Boolean; 
	idbene: Beneficiarios; 
	iddocumento: Documentos;
}
