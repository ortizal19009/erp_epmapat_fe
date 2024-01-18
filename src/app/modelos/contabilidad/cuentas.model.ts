import { Niveles } from "./niveles.model";

export class Cuentas {
	idcuenta: number;
	codcue: String;
	nomcue: String;
	gruecue: String;
	idnivel: Niveles;
	movcue: boolean;
	asodebe: String;
	asohaber: String;
	debito: number;
	credito: number;
	saldo: number;
	balance: number;
	intgrupo: number;
	sigef: boolean;
	tiptran: number;
	usucrea: number;
	feccrea: Date;
	usumodi: number;
	fecmodi: Date;
	grufluefec: number;
	resulcostos: number;
	balancostos: number;
}
