import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { BenextranService } from 'src/app/servicios/contabilidad/benextran.service';
import { PagoscobrosService } from 'src/app/servicios/contabilidad/pagoscobros.service';

@Component({
	selector: 'app-info-liquida',
	templateUrl: './info-liquida.component.html',
	styleUrls: ['./info-liquida.component.css']
})
export class InfoLiquidaComponent implements OnInit {

	formMovimiento: FormGroup;
	_liquida: any;
	idbenxtra: number;
	sumvalor: number;

	constructor(private router: Router, private fb: FormBuilder, private bxtService: BenextranService,
		private pagoscobroService: PagoscobrosService) { }

	ngOnInit(): void {
		sessionStorage.setItem('ventana', '/beneficiarios');
		let coloresJSON = sessionStorage.getItem('/beneficiarios');
		if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));

		let nomben: string = '';
		const movimientoJSON = sessionStorage.getItem('movimientoToInfo');
		if (movimientoJSON) {
			const movimiento = JSON.parse(movimientoJSON);
			this.idbenxtra = movimiento.idbenxtra;
			nomben = movimiento.nomben;
		}

		this.formMovimiento = this.fb.group({
			nomben: nomben,
			tiptran: '',
			valor: '',
			fecha: ''
		});
		this.buscar();
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
		this.bxtService.getById(this.idbenxtra).subscribe({
			next: resp => {
				let tiptran = funTiptran(resp.inttra.tiptran)
				this.formMovimiento.patchValue({
					tiptran: tiptran,
					valor: formatNumber(resp.valor),
					fecha: resp.inttra.idasiento.fecha
				});
				this.liquida();
			},
			error: err => console.error(err.error)
		});
	}

	regresar() { this.router.navigate(['/info-beneficiario']); }

	liquida() {
		this.pagoscobroService.getByIdbenxtra(this.idbenxtra).subscribe({
			next: datos => {
				this._liquida = datos;
				this.total();
			},
			error: err => console.error(err.error)
		});
	}

	total() {
		this.sumvalor = 0;
		let saldo = this.formMovimiento.value.valor;
		this._liquida.forEach((liquida: any) => {
			this.sumvalor = this.sumvalor + liquida.valor;
			liquida.saldo = saldo - this.sumvalor;
		});
	}

	imprimir() {
		let liquida = {
			idbenxtra: this.idbenxtra,
			nomben: this.formMovimiento.value.nomben,
			tiptran: this.formMovimiento.value.tiptran,
			valor: this.formMovimiento.value.valor,
			fecha: this.formMovimiento.value.fecha
		}
		const liquidaJSON = JSON.stringify(liquida);
		sessionStorage.setItem('liquidaToImpExp', liquidaJSON);
		this.router.navigate(['/imp-liquida']);
	}

	comprobante(tipcom: number, compro: number): string {
		if (tipcom == 1) return 'I-' + compro.toString();
		if (tipcom == 2) return 'E-' + compro.toString();
		if (tipcom == 3) return 'DC-' + compro.toString();
		if (tipcom == 4) return 'DI-' + compro.toString();
		if (tipcom == 5) return 'DE-' + compro.toString();
		return '';
	}

}

function formatNumber(num: number) {
	return num.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
}

function funTiptran(tp: number) {
	if (tp == 2) return 'Anticipo';
	if (tp == 3 || tp == 4) return 'CxC';
	if (tp == 5) return 'F.T';
	if (tp == 6 || tp == 7) return 'CxP';
	return '';
}
