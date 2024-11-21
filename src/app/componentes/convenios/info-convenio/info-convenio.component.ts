import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { ConvenioService } from 'src/app/servicios/convenio.service';
import { CuotasService } from 'src/app/servicios/cuotas.service';
import { FacturaService } from 'src/app/servicios/factura.service';
import { FacxconvenioService } from 'src/app/servicios/facxconvenio.service';
import { RubroxfacService } from 'src/app/servicios/rubroxfac.service';
import { ConveniosReportsService } from '../convenios-reports.service';

@Component({
  selector: 'app-info-convenio',
  templateUrl: './info-convenio.component.html',
  styleUrls: ['./info-convenio.component.css'],
})
export class InfoConvenioComponent implements OnInit {
  convenio = {} as Convenio; //Interface para los datos del Convenio
  total1: number; //Total de las Facturas de las Cuotas
  total2: number; //Total de las Facturas del convenio
  dif1: boolean;
  dif2: boolean;
  elimdisabled: boolean = true;
  v_idfactura: number;
  totfac: number;
  _convenios: any;
  _facxconvenio: any;
  _cuotas: any;
  _rubroxfac: any;
  idconvenio: number;

  constructor(
    private convService: ConvenioService,
    private fxconvService: FacxconvenioService,
    private cuotaService: CuotasService,
    private facService: FacturaService,
    private rxfService: RubroxfacService,
    private router: Router,
    private s_report: ConveniosReportsService
  ) {}

  ngOnInit(): void {
    sessionStorage.setItem('ventana', '/convenios');
    let coloresJSON = sessionStorage.getItem('/convenios');
    if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));

    this.idconvenio = +sessionStorage.getItem('idconvenioToInfo')!;
    sessionStorage.removeItem('idconvenioToInfo');

    this.datosConvenio();
  }

  colocaColor(colores: any) {
    document.documentElement.style.setProperty('--bgcolor1', colores[0]);
    const cabecera = document.querySelector('.cabecera');
    if (cabecera) cabecera.classList.add('nuevoBG1');
    document.documentElement.style.setProperty('--bgcolor2', colores[1]);
    const detalle = document.querySelector('.detalle');
    if (detalle) detalle.classList.add('nuevoBG2');
  }

  datosConvenio() {
    this.convService.getById(this.idconvenio).subscribe({
      next: (datos) => {
        this._convenios = datos;
        this.convenio.idconvenio = datos.idconvenio;
        this.convenio.nroconvenio = datos.nroconvenio;
        this.convenio.nomcli = datos.idabonado.idcliente_clientes.nombre;
        this.convenio.referencia = datos.referencia;
        this.convenio.totalconvenio = datos.totalconvenio;
        this.convenio.cuotainicial = datos.cuotainicial;
        this.convenio.cuotafinal = datos.cuotafinal;
        this.convenio.cuenta = datos.idabonado.idabonado;
        this.convenio.feccrea = datos.feccrea; 
        this.cuotasxConvenio(this.idconvenio);
      },
      error: (err) => console.log(err.error),
    });
  }

  cuotasxConvenio(idconvenio: number) {
    this.cuotaService.getByIdconvenio(idconvenio).subscribe({
      next: (datos) => {
        this._cuotas = datos;
        // let idfactura = this._cuotas[0].idfactura.idfactura
        // this.nombreCliente(idfactura);
        this.totalCuotas();
      },
      error: (err) => console.error(err.error),
    });
  }

  totalCuotas() {
    this.total1 = 0;
    let i = 0;
    this._cuotas.forEach(() => {
      this.total1 += this._cuotas[i].idfactura.totaltarifa;
      i++;
    });
    this.total1 = Number(this.total1.toFixed(2));
    if (Number(this.convenio.totalconvenio.toFixed(2)) - this.total1 != 0) {
      this.dif1 = true;
    }
  }

  nombreClienteOld(idfactura: number) {
    this.facService.getById(idfactura).subscribe({
      next: (datos) => (this.convenio.nomcli = datos.idcliente.nombre),
      error: (err) => console.error(err.error),
    });
  }

  facxConvenio() {
    this.fxconvService.getFacByConvenio(this.idconvenio).subscribe({
      next: (datos) => {
        this._facxconvenio = datos;
        this.totalFacturas();
      },
      error: (err) => console.error(err.error),
    });
  }

  totalFacturas() {
    this.total2 = 0;
    let i = 0;
    this._facxconvenio.forEach(() => {
      this.total2 += this._facxconvenio[i].idfactura_facturas.totaltarifa;
      i++;
    });
    this.total2 = Number(this.total2.toFixed(2));
    if (Number(this.convenio.totalconvenio.toFixed(2)) - this.total2 != 0) {
      this.dif2 = true;
    }
  }

  regresar() {
    this.router.navigate(['/convenios']);
  }

  public modiConvenio(idconvenio: number) {
    this.router.navigate(['modiconvenio', idconvenio]);
  }

  confirmaEliminarConvenio() {
    let idc = localStorage.getItem('idconvenioToDelete');
    if (idc != null) {
      this.convService.deleteConvenio(+idc!).subscribe({
        next: (datos) => {},
        error: (err) => console.error(err.error),
      });
    }
  }

  getRubroxfac(idfactura: number) {
    this.v_idfactura = idfactura;
    this.rxfService.getByIdfactura(+idfactura!).subscribe({
      next: (detalle) => {
        this._rubroxfac = detalle;
        this.subtotal();
      },
      error: (err) => console.error(err.error),
    });
  }

  subtotal() {
    let suma12: number = 0;
    let suma0: number = 0;
    //this.valoriva = 0;
    let i = 0;
    this._rubroxfac.forEach(() => {
      if (this._rubroxfac[i].idrubro_rubros.swiva == 1) {
        suma12 +=
          this._rubroxfac[i].cantidad * this._rubroxfac[i].valorunitario;
      } else {
        if (this._rubroxfac[i].idrubro_rubros.esiva == 0) {
          suma0 +=
            this._rubroxfac[i].cantidad * this._rubroxfac[i].valorunitario;
        } else {
          //this.valoriva = this.rubroxfac[i].valorunitario;
        }
      }
      i++;
    });
    this.totfac = suma12 + suma0;
    //this.suma12 = suma12;
    //this.suma0 = suma0;
  }
  imprimirPdf(convenio: any) {
    this.s_report.impContratoConvenio(convenio, this._cuotas);
  }
}

interface Convenio {
  idconvenio: number;
  nroconvenio: number;
  referencia: String;
  nomcli: String;
  totalconvenio: number;
  cuotainicial: number;
  cuotafinal: number;
  cuenta: number;
  feccrea: Date; 
}
