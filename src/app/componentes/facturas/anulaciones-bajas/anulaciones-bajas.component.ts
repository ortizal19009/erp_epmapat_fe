import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { RecaudacionReportsService } from '../../recaudacion/recaudacion-reports.service';
import { LecturasService } from 'src/app/servicios/lecturas.service';
import { ColoresService } from 'src/app/compartida/colores.service';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { Router } from '@angular/router';
import { FacturaService } from 'src/app/servicios/factura.service';
import { Clientes } from 'src/app/modelos/clientes';
import { AbonadosService } from 'src/app/servicios/abonados.service';
import { Abonados } from 'src/app/modelos/abonados';
import { Facturas } from 'src/app/modelos/facturas.model';

@Component({
  selector: 'app-anulaciones-bajas',
  templateUrl: './anulaciones-bajas.component.html',
  styleUrls: ['./anulaciones-bajas.component.css'],
})
export class AnulacionesBajasComponent implements OnInit {
  formBuscar: FormGroup;
  f_factura: FormGroup;
  today: number = Date.now();
  campo: number = 0; //0:Ninguno, 1:Planilla,  2:Abonado
  date: Date = new Date();
  swbuscando: boolean;
  swbusca: boolean;
  filtro: string;
  mfiltrar: string;
  txtbuscar: string = 'Buscar';
  _facturas: any;
  _fAnuladas: any;
  _fEliminadas: any;
  c_limit: number = 10;
  txttitulo: string = 'Anulación';
  swtitulo: boolean = true; 
  //detalles factura
  _rubrosxfac: any;
  totfac: number;
  idfactura: number = 0;
  /* buscar cliente */
  _cliente: Clientes = new Clientes();
  nombreCliente: String;
  option = '0';
  /* SELECCIONAR FACTURA */
  _factura: Facturas = new Facturas();

  constructor(
    private facServicio: FacturaService,
    private router: Router,
    private fb: FormBuilder,
    public authService: AutorizaService,
    private coloresService: ColoresService,
    private lecService: LecturasService,
    private s_pdfRecaudacion: RecaudacionReportsService,
    private s_abonados: AbonadosService
  ) { }

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
    this.f_factura = this.fb.group({
      fechaanulacion: '',
      usuarioanulacion: '',
      razonanulacion: '',
      fechaeliminacion: '',
      usuarioeliminacion: '',
      razoneliminacion: '',
    })
    if (sessionStorage.getItem('idplanillas') != null) {
      this.formBuscar.controls['idfactura'].setValue(
        sessionStorage.getItem('idplanillas')
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
    if (this.formBuscar.value.idfactura != '') {
      this.getFacCobrada();
    }
    if (this.formBuscar.value.idabonado != '') {
      /*       console.log('IMPRIMIR ABONADOS');
      if (this.option === '0') {
        console.log('Anulaciones');
      }
      if (this.option === '1') {
        console.log('Eliminados');
      } */
      this.getClienteByAbonado();
    }
    if (this.formBuscar.value.idabonado === '' && this.formBuscar.value.idfactura === '') {
      if (this.option === '0') {
        this.getFacCobradas();
      }
      if (this.option === '1') {
        this.getFacSinCobro();
      }
    }
  }
  changeIdfactura() {
    this.formBuscar.controls['idabonado'].setValue('');
    if (!this.formBuscar.value.idfactura) this.campo = 0;
    else {
      this.campo = 1;
      this._facturas = null;
      this._cliente = new Clientes();
    }
  }

  changeIdabonado() {
    this.formBuscar.controls['idfactura'].setValue('');
    if (!this.formBuscar.value.idabonado) this.campo = 0;
    else {
      this.campo = 2;
      this._facturas = null;
      this._cliente = new Clientes();
    }
  }
  changeCliente() {
    /*   this.formBuscar.controls['idfactura'].setValue('');
      if (!this.formBuscar.value.idabonado) this.campo = 0;
      else {
        this.campo = 2;
        this._facturas = null;
        this._cliente = new Clientes();
      } */
  }
  changeTitulo(e: any) {
    this.option = e.target.value;
    if (e.target.value === '0') {
      this.txttitulo = 'Anulación';
      this.swtitulo = true; 
    }
    
    if (e.target.value === '1') {
      this.txttitulo = 'Eliminación';
      this.swtitulo = false; 
      //this.option = '1';
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
        this._fEliminadas = datos;
      },
      error: (e) => console.error(e),
    });
  }
  setCliente(e: any) {
    this.formBuscar.patchValue({
      idfactura: '',
      idabonado: ''
    });
    this.campo = 1;
    this._cliente = e;
    /*    this.f_tramites.patchValue({
      idcliente_clientes: e,
    }); */
  }
  getFacCobradas() {
    this.facServicio.findCobradas(this._cliente.idcliente).subscribe({
      next: (datos: any) => {
        this._facturas = datos;
      },
      error: (e) => {
        console.error(e);
      },
    });
  }
  getFacSinCobro() {
    this.facServicio.getSinCobro(this._cliente.idcliente).subscribe({
      next: (datos: any) => {
        this._facturas = datos;
      },
      error: (e) => console.error(e),
    });
  }
  getFacCobrada() {
    this.facServicio.getById(this.formBuscar.value.idfactura).subscribe({
      next: (datos: any) => {
        if (this.option === '0') {
          if (datos.fechaanulacion === null && datos.fechaeliminacion === null && datos.pagado === 1) {
            this._facturas = [datos];
          }
        }
        if (this.option === '1') {
          if (datos.fechaanulacion === null && datos.fechaeliminacion === null && datos.pagado === 0) {
            this._facturas = [datos];
          }
        }
      },
      error: (e) => console.error(e),
    });
  }
  getClienteByAbonado() {
    this.s_abonados.getByIdabonado(this.formBuscar.value.idabonado).subscribe({
      next: (datos: any) => {
        this._cliente = datos[0].idcliente_clientes;
        if (this.option === '0') {
          this.getFacCobradas();
        }
        if (this.option === '1') {
          this.getFacSinCobro();
        }
      },
      error: (e) => console.error(e),
    });
  }
  setFactura(factura: any) {
    console.log(factura)
    this._factura = factura;
  }
  actualizar(){


  }
}
