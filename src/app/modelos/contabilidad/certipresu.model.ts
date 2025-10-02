import { Documentos } from "../administracion/documentos.model";
import { Beneficiarios } from "./beneficiarios.model";

export class Certipresu {
	idcerti: number;
	tipo: number;
	numero: number;
	fecha: Date;
	valor: number;
	descripcion: String;
	numdoc: String;
	usucrea: number;
	feccrea: Date;
	usumodi: number;
	fecmodi: Date;
	idbene: Beneficiarios;
	idbeneres: Beneficiarios;
	intdoc: Documentos;
}
