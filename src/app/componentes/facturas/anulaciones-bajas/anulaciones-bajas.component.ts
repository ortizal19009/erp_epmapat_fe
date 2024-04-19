import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { RecaudacionReportsService } from '../../recaudacion/recaudacion-reports.service';
import { LecturasService } from 'src/app/servicios/lecturas.service';
import { ColoresService } from 'src/app/compartida/colores.service';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { Router } from '@angular/router';
import { FacturaService } from 'src/app/servicios/factura.service';

@Component({
  selector: 'app-anulaciones-bajas',
  templateUrl: './anulaciones-bajas.component.html',
  styleUrls: ['./anulaciones-bajas.component.css'],
})
export class AnulacionesBajasComponent implements OnInit {
  formBuscar: FormGroup;
  today: number = Date.now();
  campo: number = 0; //0:Ninguno, 1:Planilla,  2:Abonado
  date: Date = new Date();
  swbuscando: boolean;
  swbusca: boolean;
  filtro: string;
  txtbuscar: string = 'Buscar';
  _facturas: any;
  _fAnuladas: any;
  _fEliminadas: any;
  c_limit: number = 10;
  txttitulo: string = 'Anulación';
  //detalles factura
  _rubrosxfac: any;
  totfac: number;
  idfactura: number = 0;

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
    sessionStorage.setItem('ventana', '/anulaciones-bajas');
    let coloresJSON = sessionStorage.getItem('/anulaciones-bajas');
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
    this.getAllFacAnuladas(this.c_limit);
    this.getAllFacEliminadas(this.c_limit);
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
  buscar() {
    console.log(this.formBuscar.value);
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

  getAllFacAnuladas(limit: number) {
    this.facServicio.findAnulaciones(limit).subscribe({
      next: (datos: any) => {
        this._fAnuladas = datos;
      },
      error: (e) => console.error(e),
    });
  }
  getAllFacEliminadas(limit: number) {
    this.facServicio.findEliminadas(limit).subscribe({
      next: (datos: any) => {
        console.log(datos);
        this._fEliminadas = datos;
      },
      error: (e) => console.error(e),
    });
  }
}
