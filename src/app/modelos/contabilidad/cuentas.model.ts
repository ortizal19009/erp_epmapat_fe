import { Niveles } from "./niveles.model";

export class Cuentas {
	idcuenta: number;
	codcue: String;
	nomcue: String;
	grucue: String;
	nivcue: number;
	movcue: number;
	asodebe: String;
	asohaber: String;
	debito: number;
	credito: number;
	saldo: number;
	balance: number;
	intgrupo: number;
	sigef: number;
	tiptran: number;
	usucrea: number;
	feccrea: Date;
	usumodi: number;
	fecmodi: Date;
	grufluefec: number;
	resulcostos: number;
	balancostos: number;
	idnivel: Niveles
}
