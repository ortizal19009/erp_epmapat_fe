import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { Benextran } from 'src/app/modelos/contabilidad/benextran.model';
import { BenextranService } from 'src/app/servicios/contabilidad/benextran.service';

@Component({
	selector: 'app-info-beneficiario',
	templateUrl: './info-beneficiario.component.html',
	styleUrls: ['./info-beneficiario.component.css']
})
export class InfoBeneficiarioComponent implements OnInit {

	beneficiarioToInfo: { idbene: number, nomben: string }
	formFechas: FormGroup;
	_movimi: any;
	idbene: number;
	sumanticipo: number;
	sumcxc: number;
	sumft: number;
	sumcxp: number;
	sumtotpagcob: number;
	sumsaldo: number;

	constructor(private router: Router, private fb: FormBuilder, private bxtService: BenextranService) { }

	ngOnInit(): void {
		sessionStorage.setItem('ventana', '/beneficiarios');
		let coloresJSON = sessionStorage.getItem('/beneficiarios');
		if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));

		let nomben: string = '';
		const beneficiarioJSON = sessionStorage.getItem('beneficiarioToInfo');
		if (beneficiarioJSON) {
			const beneficiario = JSON.parse(beneficiarioJSON);
			this.idbene = beneficiario.idbene;
			nomben = beneficiario.nomben;
		}

		//Fechas guardadas o actuales
		let swbuscar: boolean = false;
		let desde: string; let hasta: string;
		const movbenefiJSON = sessionStorage.getItem('fechasMovBenefi');
		if (movbenefiJSON) {
			swbuscar = true;
			const movbenefi = JSON.parse(movbenefiJSON);
			desde = movbenefi.desde
			hasta = movbenefi.hasta
		} else {
			const fechaActual = new Date();
			hasta = fechaActual.toISOString().slice(0, 10);
			let fechaRestada: Date = new Date();
			fechaRestada.setMonth(fechaActual.getMonth() - 1);
			desde = fechaRestada.toISOString().slice(0, 10);
		}
		this.formFechas = this.fb.group({
			nomben: nomben,
			desde: desde,
			hasta: hasta
		});
		if (swbuscar) this.buscar();
	}

	colocaColor(colores: any) {
		document.documentElement.style.setProperty('--bgcolor1', colores[0]);
		const cabecera = document.querySelector('.cabecera');
		if (cabecera) cabecera.classList.add('nuevoBG1')
		document.documentElement.style.setProperty('--bgcolor2', colores[1]);
		const detalle = document.querySelector('.detalle');
		if (detalle) detalle.classList.add('nuevoBG2');
	}

	buscar() {
		this.bxtService.getByIdbeneDesdeHasta(this.idbene, this.formFechas.value.desde, this.formFechas.value.hasta).subscribe({
			next: datos => {
				this._movimi = datos;
				this.total();
				//Guarda las fechas de búsqueda
				let desde = this.formFechas.value.desde;
				let hasta = this.formFechas.value.hasta;
				const fechasMovBenefi = { desde, hasta }
				const fechasMovBenefiJSON = JSON.stringify(fechasMovBenefi);
				sessionStorage.setItem('fechasMovBenefi', fechasMovBenefiJSON);
			},
			error: err => console.error(err.error)
		});
	}

	comprobante(tipcom: number, compro: number): string {
		switch (tipcom) {
			case 1:
				return 'I-' + compro.toString();
			case 2:
				return 'E-' + compro.toString();
			case 3:
				return 'DC-' + compro.toString();
			case 4:
				return 'DI-' + compro.toString();
			case 5:
				return 'DE-' + compro.toString();
			default:
				return '-' + compro.toString();
		}
	}

	total() {
		this.sumanticipo = 0;
		this.sumcxc = 0;
		this.sumft = 0;
		this.sumcxp = 0;
		this.sumtotpagcob = 0;
		this.sumsaldo = 0;
		let i = 0;
		this._movimi.forEach(() => {
			switch (this._movimi[i].inttra.tiptran) {
				case 2:
					this._movimi[i].anticipo = this._movimi[i].valor;
					this.sumanticipo = this.sumanticipo + this._movimi[i].valor;
					break;
				case 3:
					this._movimi[i].cxc = this._movimi[i].valor;
					this.sumcxc = this.sumcxc + this._movimi[i].valor;
					break;
				case 4:
					this._movimi[i].cxc = this._movimi[i].valor;
					this.sumcxc = this.sumcxc + this._movimi[i].valor;
					break;
				case 5:
					this._movimi[i].ft = this._movimi[i].valor;
					this.sumft = this.sumft + this._movimi[i].valor;
					break;
				case 6:
					this._movimi[i].cxp = this._movimi[i].valor;
					this.sumcxp = this.sumcxp + this._movimi[i].valor;
					break;
				case 7:
					this._movimi[i].cxp = this._movimi[i].valor;
					this.sumcxp = this.sumcxp + this._movimi[i].valor;
					break;
				default:

			}
			this._movimi[i].saldo = this._movimi[i].valor - this._movimi[i].totpagcob;
			this.sumtotpagcob = this.sumtotpagcob + this._movimi[i].totpagcob;
			this.sumsaldo = this.sumsaldo + this._movimi[i].saldo;
			i++;
		});
	}

	regresar() { this.router.navigate(['/beneficiarios']); }

	imprimir() {
		let movibene = {
			idbene: this.idbene,
			nomben: this.formFechas.value.nomben,
			desde: this.formFechas.value.desde,
			hasta: this.formFechas.value.hasta
		}
		const movibeneJSON = JSON.stringify( movibene );
		sessionStorage.setItem('movibeneToImpExp', movibeneJSON);
		this.router.navigate(['/imp-movibene']);
	}

	liquidaciones(event: any, movimi: Benextran){
		let movimientoToInfo: { idbenxtra: number, nomben: string }
		movimientoToInfo = {
			idbenxtra: movimi.idbenxtra,
			nomben: movimi.idbene.nomben
		};
		sessionStorage.setItem('movimientoToInfo', JSON.stringify(movimientoToInfo));

		this.router.navigate(['info-liquida']);
	}
}
