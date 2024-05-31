import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { ColoresService } from 'src/app/compartida/colores.service';
import { Facturas } from 'src/app/modelos/facturas.model';
import { FacturaService } from 'src/app/servicios/factura.service';
import { LecturasService } from 'src/app/servicios/lecturas.service';
import { RecaudacionReportsService } from '../../recaudacion/recaudacion-reports.service';

@Component({
  selector: 'app-facturas',
  templateUrl: './facturas.component.html',
  styleUrls: ['./facturas.component.css'],
})
export class FacturasComponent implements OnInit {
  formBuscar: FormGroup;
  _facturas: any;
  filtro: string;
  campo: number = 0; //0:Ninguno, 1:Planilla,  2:Abonado
  swbusca: boolean;
  swbuscando: boolean;
  txtbuscar: string = 'Buscar';
  today: number = Date.now();
  date: Date = new Date();

  constructor(
    private facServicio: FacturaService,
    private router: Router,
    private fb: FormBuilder,
    public authService: AutorizaService,
    private coloresService: ColoresService,
    private lecService: LecturasService,
    private s_pdfRecaudacion: RecaudacionReportsService
  ) {}

  ngOnInit(): void {
    sessionStorage.setItem('ventana', '/facturas');
    let coloresJSON = sessionStorage.getItem('/facturas');
    if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
    else this.buscaColor();

    const fecha = new Date();
    const año = fecha.getFullYear();
    this.formBuscar = this.fb.group({
      idfactura: '',
      idabonado: '',
      fechaDesde: año + '-01-01',
      fechaHasta: año + '-12-31',
    });
    // { updateOn: "blur" });

    if (sessionStorage.getItem('idfacturaPlanillas') != null) {
      this.formBuscar.controls['idfactura'].setValue(
        sessionStorage.getItem('idfacturaPlanillas')
      );
      this.campo = 1;
      this.buscar();
    }
    if (sessionStorage.getItem('idabonadoPlanillas') != null) {
      this.formBuscar.patchValue({
        idabonado: sessionStorage.getItem('idabonadoPlanillas'),
        fechaDesde: sessionStorage.getItem('fechaDesdePlanillas'),
        fechaHasta: sessionStorage.getItem('fechaHastaPlanillas'),
      });
      this.campo = 2;
      this.buscar();
    }
  }

  colocaColor(colores: any) {
    document.documentElement.style.setProperty('--bgcolor1', colores[0]);
    const cabecera = document.querySelector('.cabecera');
    if (cabecera) cabecera.classList.add('nuevoBG1');
    document.documentElement.style.setProperty('--bgcolor2', colores[1]);
    const detalle = document.querySelector('.detalle');
    if (detalle) detalle.classList.add('nuevoBG2');
  }

  async buscaColor() {
    try {
      const datos = await this.coloresService.setcolor(
        this.authService.idusuario,
        'facturas'
      );
      const coloresJSON = JSON.stringify(datos);
      sessionStorage.setItem('/facturas', coloresJSON);
      this.colocaColor(datos);
    } catch (error) {
      console.error(error);
    }
  }

  changeIdfactura() {
    this.formBuscar.controls['idabonado'].setValue('');
    if (!this.formBuscar.value.idfactura) this.campo = 0;
    else {
      this.campo = 1;
      this._facturas = null;
    }
  }

  changeIdabonado() {
    this.formBuscar.controls['idfactura'].setValue('');
    if (!this.formBuscar.value.idabonado) this.campo = 0;
    else {
      this.campo = 2;
      this._facturas = null;
    }
  }

  buscar() {
    if (this.campo == 1) {
      let idfactura = this.formBuscar.value.idfactura;
      sessionStorage.setItem('idfacturaPlanillas', idfactura.toString());
      sessionStorage.removeItem('idabonadoPlanillas');
      if (idfactura) {
        this.facServicio.getPlanilla(idfactura).subscribe({
          next: (datos) => {
            this._facturas = datos;
            this.swbusca = true;
            this.swbuscando = false;
          },
          error: (err) => console.error(err.error),
        });
      }
    }
    if (this.campo == 2) {
      this.swbuscando = true;
      this.txtbuscar = 'Buscando';
      let idabonado = this.formBuscar.value.idabonado;
      sessionStorage.setItem('idabonadoPlanillas', idabonado.toString());
      sessionStorage.removeItem('idfacturaPlanillas');
      sessionStorage.setItem(
        'fechaDesdePlanillas',
        this.formBuscar.value.fechaDesde.toString()
      );
      sessionStorage.setItem(
        'fechaHastaPlanillas',
        this.formBuscar.value.fechaHasta.toString()
      );
      if (idabonado) {
        this.facServicio
          .getPorabonado(
            idabonado,
            this.formBuscar.value.fechaDesde,
            this.formBuscar.value.fechaHasta
          )
          .subscribe({
            next: (datos) => {
              this.swbusca = true;
              this._facturas = datos;
              this.swbuscando = false;
              this.txtbuscar = 'Buscar';
            },
            error: (err) => console.error(err.error),
          });
      }
    }
  }

  public infoOld(facturas: Facturas) {
    sessionStorage.setItem('idfacturaToInfo', facturas.idfactura.toString());
    this.router.navigate(['info-planilla']);
  }

  info(event: any, idfactura: number) {
    const tagName = event.target.tagName;
    if (tagName === 'TD') {
      sessionStorage.setItem('idfacturaToInfo', idfactura.toString());
      this.router.navigate(['info-planilla']);
    }
  }

  recalcular(idfactura: number) {
    sessionStorage.setItem('idfacturaToRecal', idfactura.toString());
    this.router.navigate(['recal-factura']);
  }
  impComprobante(datos: any) {
    let lectura: any;
    this.facServicio.getById(datos.idfactura).subscribe({
      next: (d_factura: any) => {
        let modulo: number = d_factura.idmodulo.idmodulo;
        if (modulo === 3 || modulo === 4) {
          this.lecService.getOnefactura(d_factura.idfactura).subscribe({
            next: (datos: any) => {
              lectura = datos;
              if (datos != null) {
                this.s_pdfRecaudacion.comprobantePago(lectura, d_factura);
              } else {
                this.s_pdfRecaudacion.comprobantePago(null, d_factura);
              }
            },
            error: (e) => console.error(e),
          });
        } else {
          this.s_pdfRecaudacion.comprobantePago(null, d_factura);
        }
      },
      error: (e) => console.error(e),
    });
  }
}
