import { Documentos } from "../administracion/documentos.model";
import { Asientos } from "./asientos.model";
import { Beneficiarios } from "./beneficiarios.model";
import { Cuentas } from "./cuentas.model";

export class Transaci {
	
   idtransa: number;
	orden: number;
	codcue: String;
	valor: number;
	debcre: number;
	descri: String;
	numdoc: String;
	tiptran: number;
	totbene: number;
	swconcili: Boolean;
	mesconcili: number;
	idasiento: Asientos;
	idcuenta: Cuentas;
	idbene: Beneficiarios;
	iddocumento: Documentos;
	idpresupue: number;
	codpartr: String;
	codcueiog: String;
	debeiog: number;
	haberiog: number;
	asierefe: number;
	usucrea: number;
	feccrea: Date;
	usumodi: number;
	fecmodi: Date;

}
