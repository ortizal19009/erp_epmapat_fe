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

  constructor(
    private convService: ConvenioService,
    private fxconvService: FacxconvenioService,
    private cuotaService: CuotasService,
    private facService: FacturaService,
    private rxfService: RubroxfacService,
    private router: Router,
    private s_conveniosReports: ConveniosReportsService
  ) {}

  ngOnInit(): void {
    this.datosConvenio();
  }

  datosConvenio() {
    let idconvenio = sessionStorage.getItem('idconvenioToInfo');
    this.convService.getById(+idconvenio!).subscribe(
      (datos) => {
        this._convenios = datos;
        this.convenio.idconvenio = datos.idconvenio;
        this.convenio.nroconvenio = datos.nroconvenio;
        this.convenio.referencia = datos.referencia;
        this.convenio.totalconvenio = datos.totalconvenio;
        this.convenio.cuotainicial = datos.cuotainicial;
        this.convenio.cuotafinal = datos.cuotafinal;
      },
      (error) => console.log(error)
    );
    this.cuotasxConvenio(+idconvenio!);
  }

  cuotasxConvenio(idconvenio: number) {
    this.cuotaService.getByIdconvenio(idconvenio).subscribe(
      (datos) => {
        this._cuotas = datos;
        let idfactura = this._cuotas[0].idfactura.idfactura;
        this.nombreCliente(idfactura);
        this.totalCuotas();
        //         if (this._cuotas[0].idfactura.nrofactura.length > 3) { this.elimdisabled = false; }
      },
      (error) => console.log(error)
    );
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

  nombreCliente(idfactura: number) {
    this.facService.getById(idfactura).subscribe(
      (datos) => {
        this.convenio.nomcli = datos.idcliente.nombre;
      },
      (error) => console.log(error)
    );
  }

  facxConvenio() {
    let idconvenio = sessionStorage.getItem('idconvenioToInfo');
    this.fxconvService.getFacByConvenio(+idconvenio!).subscribe(
      (datos) => {
        this._facxconvenio = datos;
        this.totalFacturas();
      },
      (error) => console.log(error)
    );
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
  imprimir() {
    console.log(this.convenio);
    console.log(this._convenios);
    console.log(this._cuotas);
    let datos: any = [];
    datos = { ...this.convenio, ...this._convenios};

    this.s_conveniosReports.impContratoConvenio(datos, this._cuotas);
  }

  public modiConvenio(idconvenio: number) {
    this.router.navigate(['modiconvenio', idconvenio]);
  }

  confirmaEliminarConvenio() {
    let idc = localStorage.getItem('idconvenioToDelete');
    if (idc != null) {
      this.convService.deleteConvenio(+idc!).subscribe(
        (datos) => {},
        (error) => console.log(error)
      );
    }
  }

  getRubroxfac(idfactura: number) {
    this.v_idfactura = idfactura;
    this.rxfService.getByIdfactura(+idfactura!).subscribe(
      (detalle) => {
        this._rubroxfac = detalle;
        this.subtotal();
      },
      (error) => console.log(error)
    );
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
}

interface Convenio {
  idconvenio: number;
  nroconvenio: number;
  referencia: String;
  nomcli: String;
  totalconvenio: number;
  cuotainicial: number;
  cuotafinal: number;
}
