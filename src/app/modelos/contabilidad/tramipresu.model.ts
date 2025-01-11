import { Documentos } from "../administracion/documentos.model";
import { Beneficiarios } from "./beneficiarios.model";

export class Tramipresu {
	idtrami: number;
	numero: number; 
	fecha: Date; 
	numdoc: String; 
	fecdoc: Date; 
	totmiso: number; 
	descri: String; 
	usucrea: number; 
	feccrea: Date; 
	usumodi: number; 
	fecmodi: Date; 
	swreinte: number; 
	idbene: Beneficiarios; 
	intdoc: Documentos;
}
