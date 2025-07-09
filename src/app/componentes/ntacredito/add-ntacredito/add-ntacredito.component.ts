import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { ColoresService } from 'src/app/compartida/colores.service';
import { Abonados } from 'src/app/modelos/abonados';
import { Clientes } from 'src/app/modelos/clientes';
import { Facturas } from 'src/app/modelos/facturas.model';
import { Ntacredito } from 'src/app/modelos/ntacredito';
import { AbonadosService } from 'src/app/servicios/abonados.service';
import { DocumentosService } from 'src/app/servicios/administracion/documentos.service';
import { FacturaService } from 'src/app/servicios/factura.service';
import { LoadingService } from 'src/app/servicios/loading.service';
import { NtacreditoService } from 'src/app/servicios/ntacredito.service';
import { RubroxfacService } from 'src/app/servicios/rubroxfac.service';

@Component({
  selector: 'app-add-ntacredito',
  templateUrl: './add-ntacredito.component.html',
  styleUrls: ['./add-ntacredito.component.css'],
})
export class AddNtacreditoComponent implements OnInit {
  f_ntacredito: FormGroup;
  filterTerm: string;
  _ntacreditos: any;
  _factura: Facturas = new Facturas();
  cliente: Clientes = new Clientes();
  resppago: Clientes = new Clientes();
  _cuenta: Abonados = new Abonados();
  date: Date = new Date();
  valorFactura: number = 0;
  _documentos: any;
  constructor(
    private fb: FormBuilder,
    private router: Router,
    private coloresService: ColoresService,
    private s_factura: FacturaService,
    private authService: AutorizaService,
    private s_rubroxfac: RubroxfacService,
    private loading: LoadingService,
    private s_abonado: AbonadosService,
    private s_ntacredito: NtacreditoService,
    private s_documento: DocumentosService
  ) { }

  ngOnInit(): void {
    sessionStorage.setItem('ventana', '/add-ntacredito');
    let coloresJSON = sessionStorage.getItem('/add-ntacredito');
    if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
    else this.buscaColor();
    this.f_ntacredito = this.fb.group({
      nrofactura: '',
      planilla: '',
      cliente: '',
      valor: '',
      observacion: '',
      idfactura: '',
      cuenta: '',
      iddocumento_documentos: '',
      refdocumento: '',
    });
    this.getAllDocumentos();
  }
  async buscaColor() {
    try {
      const datos = await this.coloresService.setcolor(1, 'add-ntacredito');
      const coloresJSON = JSON.stringify(datos);
      sessionStorage.setItem('/add-ntacredito', coloresJSON);
      this.colocaColor(datos);
    } catch (error) {
      console.error(error);
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
  getAllDocumentos() {
    this.s_documento.getListaDocumentos().subscribe({
      next: (datos: any) => {
        console.log(datos);
        this._documentos = datos;
        this.f_ntacredito.patchValue({
          iddocumento_documentos: datos[0],
        });
      },
      error: (e: any) => console.error(e),
    });
  }
  onSubmit() {
    let f = this.f_ntacredito.value;
    let ntacredito: Ntacredito = new Ntacredito();
    ntacredito.valor = f.valor;
    ntacredito.observacion = f.observacion;
    ntacredito.idcliente_clientes = this.resppago;
    ntacredito.feccrea = this.date;
    ntacredito.usucrea = this.authService.idusuario;
    ntacredito.devengado = 0;
    ntacredito.nrofactura = f.idfactura;
    ntacredito.idabonado_abonados = this._cuenta;
    ntacredito.iddocumento_documentos = f.iddocumento_documentos;
    ntacredito.refdocumento = f.refdocumento;

    this.s_ntacredito.saveNtacredito(ntacredito).subscribe({
      next: (datos: any) => {
        console.log(datos);
        this.router.navigate(['/ntacredito']);
      },
    });
  }
  detallesnotasnc(notacredito: any) { }
  clearInput(name: any) {
    this._factura = new Facturas();
    this.cliente = new Clientes();
    this.resppago = new Clientes();
    this.f_ntacredito.patchValue({
      clientes: '',
    });
    this.f_ntacredito.get(name)?.setValue(''); // Borra el valor del primer input
  }
  getPlanilla() {
    console.log("por aqui en getPlanilla()")
    let formulario = this.f_ntacredito.value;
    if (formulario.nrofactura != '' || formulario.planilla != '') {
      this.loading.showLoading();
      if (formulario.nrofactura != '') {
        this.s_factura.getByNrofactura(formulario.nrofactura).subscribe({
          next: (planilla: any) => {
            if (planilla.length == 1) {
              this._factura = planilla[0];
              this.cliente = planilla[0].idcliente;
              this.resppago = planilla[0].idcliente;
              this.buscarAbonado(planilla[0].idabonado);
              this.f_ntacredito.patchValue({
                cliente: planilla[0].idcliente.nombre,
                idfactura: planilla[0].idfactura,
                cuenta: planilla[0].idabonado,
              });
              this.getValorPlanilla(planilla[0].idfactura);
            }
          },
          error: (e: any) => console.error(e),
        });
      }
      if (formulario.planilla != '') {
        this.s_factura.getById(formulario.planilla).subscribe({
          next: (planilla: any) => {
            console.log(planilla);
            if (planilla.pagado == 1 && planilla.estado == 1) {

              this._factura = planilla;
              this.cliente = planilla.idcliente;
              this.resppago = planilla.idcliente;
              this.buscarAbonado(planilla.idabonado);
              this.f_ntacredito.patchValue({
                cliente: planilla.idcliente.nombre,
                idfactura: planilla.idfactura,
                nrofactura: planilla.nrofactura,
                cuenta: planilla.idabonado,
              });
              this.getValorPlanilla(planilla.idfactura);
            } else {
              alert("Nota de credito solo para facturas ya cobradas !!!");
              this.loading.hideLoading();
            }
          },
          error: (e: any) => console.error(e),
        });
      }
    }
  }
  getValorPlanilla(idfactura: any) {
    this.s_rubroxfac.getSumaValoresUnitarios(idfactura).then((valor: any) => {
      this.f_ntacredito.patchValue({ valor: valor.toFixed(2) });
      this.valorFactura = valor.toFixed(2);
      this.loading.hideLoading();
    });
  }
  buscarAbonado(cuenta: number) {
    this.s_abonado.getById(cuenta).subscribe({
      next: (cuenta: any) => {
        this._cuenta = cuenta;
      },
      error: (e: any) => console.error(e),
    });
  }

  setCliente(dato: any) {
    this.resppago = dato;
    this.f_ntacredito.patchValue({
      cliente: dato.nombre,
    });
  }
  setAbonado(dato: any) {
    this.resppago = dato.idresponsable;
    this._cuenta = dato;
    this.f_ntacredito.patchValue({
      cuenta: dato.idabonado,
      cliente: dato.idresponsable.nombre,
    });
  }
}
