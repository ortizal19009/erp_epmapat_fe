import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { ColoresService } from 'src/app/compartida/colores.service';
import { Clientes } from 'src/app/modelos/clientes';
import { Facturas } from 'src/app/modelos/facturas.model';
import { Ntacredito } from 'src/app/modelos/ntacredito';
import { FacturaService } from 'src/app/servicios/factura.service';
import { LoadingService } from 'src/app/servicios/loading.service';
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
  date: Date = new Date();
  valorFactura: number = 0
  constructor(
    private fb: FormBuilder,
    private router: Router,
    private coloresService: ColoresService,
    private s_factura: FacturaService,
    private authService: AutorizaService,
    private s_rubroxfac: RubroxfacService,
    private loading: LoadingService
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
    });
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
  onSubmit() {
    let f = this.f_ntacredito.value
    console.log(this.f_ntacredito.value)
    let ntacredito: Ntacredito = new Ntacredito();
    ntacredito.valor = f.valor
    ntacredito.observacion = f.observacion
    ntacredito.idcleinte_clientes = this.resppago;
    ntacredito.feccrea = this.date
    ntacredito.usucrea = this.authService.idusuario;
    ntacredito.devengado = 0;
    ntacredito.nrofactura = f.idfactura
    console.log(ntacredito)

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
    this.loading.showLoading();
    let formulario = this.f_ntacredito.value;
    if (formulario.nrofactura != '') {
      this.s_factura.getByNrofactura(formulario.nrofactura).subscribe({
        next: (planilla: any) => {
          console.log(planilla);
          if (planilla.length == 1) {
            this._factura = planilla[0];
            this.cliente = planilla[0].idcliente;
            this.resppago = planilla[0].idcliente;
            this.f_ntacredito.patchValue({
              cliente: planilla[0].idcliente.nombre,
              idfactura: planilla[0].idfactura
            });
            this.getValorPlanilla(planilla[0].idfactura)
          }
        },
        error: (e: any) => console.error(e),
      });
    }
    if (formulario.planilla != '') {
      this.s_factura.getById(formulario.planilla).subscribe({
        next: (planilla: any) => {
          console.log(planilla);
          this._factura = planilla;
          this.cliente = planilla.idcliente;
          this.resppago = planilla.idcliente;
          this.f_ntacredito.patchValue({
            cliente: planilla.idcliente.nombre,
            idfactura: planilla.idfactura,
            nrofactura: planilla.nrofactura
          });
          this.getValorPlanilla(planilla.idfactura)

        },
        error: (e: any) => console.error(e),
      });
    }
  }
  getValorPlanilla(idfactura: any) {
    this.s_rubroxfac.getSumaValoresUnitarios(idfactura).then((valor: any) => {
      this.f_ntacredito.patchValue({ valor: valor.toFixed(2) })
      this.valorFactura = valor.toFixed(2);
      this.loading.hideLoading();
    })
  }
  setCliente(dato: any) {
    console.log(dato)
    this.resppago = dato;
    this.f_ntacredito.patchValue({
      cliente: dato.nombre
    })
  }
}
