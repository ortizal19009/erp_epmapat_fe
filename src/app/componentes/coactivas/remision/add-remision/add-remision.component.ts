import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { min } from 'rxjs';
import { ColoresService } from 'src/app/compartida/colores.service';
import { Abonados } from 'src/app/modelos/abonados';
import { Categoria } from 'src/app/modelos/categoria.model';
import { Clientes } from 'src/app/modelos/clientes';
import { Rutas } from 'src/app/modelos/rutas.model';
import { AbonadosService } from 'src/app/servicios/abonados.service';
import { ClientesService } from 'src/app/servicios/clientes.service';
import { FacturaService } from 'src/app/servicios/factura.service';
import { LoadingService } from 'src/app/servicios/loading.service';
import { RubroxfacService } from 'src/app/servicios/rubroxfac.service';

@Component({
  selector: 'app-add-remision',
  templateUrl: './add-remision.component.html',
  styleUrls: ['./add-remision.component.css'],
})
export class AddRemisionComponent implements OnInit {
  filtro: string;
  f_buscar: FormGroup;
  f_simular: FormGroup;
  today: Date = new Date();
  _abonado: Abonados = new Abonados();
  _cliente: Clientes = new Clientes();
  _categoria: Categoria = new Categoria();
  _ruta: Rutas = new Rutas();
  _facturas: any;
  _rubros: any;
  subtotal: number = 0;
  intereses: number = 0;
  total: number = 0;
  totalrubros: number = 0;
  modalTitle: string = 'Simular remisión';
  swdisable: Boolean = false;
  swdmodal: string = 'simular';
  tableSize: string = 'md';
  constructor(
    private fb: FormBuilder,
    private coloresService: ColoresService,
    private s_abonados: AbonadosService,
    private s_clientes: ClientesService,
    private s_facturas: FacturaService,
    private s_loading: LoadingService,
    private s_rubroxfac: RubroxfacService
  ) {}

  ngOnInit(): void {
    sessionStorage.setItem('ventana', '/cv-facturas');
    let coloresJSON = sessionStorage.getItem('/cv-facturas');
    if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
    else this.buscaColor();
    let d = this.today.toISOString().slice(0, 10);
    this.f_buscar = this.fb.group({
      cuenta: '',
      fechatope: '2024-12-09',
    });
    this.f_simular = this.fb.group({
      porcentaje: [20, Validators.required],
      cuotas: [1, Validators.required],
      inicial: 0,
      mensual: 0,
      final: 0,
    });
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
      const datos = await this.coloresService.setcolor(1, 'cv-facturas');
      const coloresJSON = JSON.stringify(datos);
      sessionStorage.setItem('/cv-facturas', coloresJSON);
      this.colocaColor(datos);
    } catch (error) {
      console.error(error);
    }
  }
  getFacturasByCuenta() {
    this.subtotal = 0;
    this.intereses = 0;
    this.total = 0;
    this.s_abonados.getById(+this.f_buscar.value.cuenta!).subscribe({
      next: (abonado: any) => {
        console.log(abonado);
        this._abonado = abonado;
        this._categoria = abonado.idcategoria_categorias;
        this._ruta = abonado.idruta_rutas;
        this.getCliente(abonado.idresponsable.idcliente);
      },
    });
  }
  getRubros(idcliente: number) {
    this.totalrubros = 0;
    this.s_rubroxfac
      .getRubrosForRemisiones(idcliente, this.f_buscar.value.fechatope)
      .then((rubros: any) => {
        console.log(rubros);
        this._rubros = rubros;
        rubros.forEach((i: any) => {
          this.totalrubros += i.sum;
        });
      });
  }
  getCliente(idcliente: any) {
    this._facturas = [];
    this._rubros = [];
    this.s_loading.showLoading();
    this.s_clientes.getListaById(idcliente).subscribe({
      next: (cliente: any) => {
        console.log(cliente);
        this._cliente = cliente;
        this.getFacturasForRemision(cliente.idcliente);
        this.getRubros(cliente.idcliente);
      },
    });
  }
  getFacturasForRemision(idcliente: any) {
    console.log(idcliente);
    this.s_facturas
      .getFacturasForRemision(idcliente, '2024-12-10')
      .then((item: any) => {
        let subtotal = 0;
        let total = 0;
        let sumIntereses = 0;
        console.log(item);
        item.forEach((i: any) => {
          console.log(i);
          subtotal += i.total;
          sumIntereses += i.intereses;
          total += i.total + i.intereses;
        });

        this._facturas = item;
        this.s_loading.hideLoading();
        this.subtotal = subtotal;
        this.intereses = sumIntereses;
        this.total = total;
      });
  }
  suma(total: number, interes: number) {
    return (total + interes).toFixed(2);
  }

  modal(option: string) {
    this.swdmodal = option;
    switch (option) {
      case 'simular':
        this.modalTitle = 'Simular remisión';
        this.tableSize = 'lg';
        break;
      case 'rubros':
        this.modalTitle = 'Detalle Rubros';
        this.tableSize = 'md';
        break;
    }
  }
  changeCuota(e: any) {
    console.log(e.target.value);
    let f = this.f_simular.value;
    let subtotal = this.subtotal;
    if (+e.target.value! > 1) {
      console.log('Mas de una cuota, hay que calcular el valor de los rubros');
      let inicial = (subtotal * +f.porcentaje!) / 100;
      let t = subtotal - inicial;
      this.f_simular.patchValue({
        inicial: inicial,
      });

      console.log(inicial, t);
    } else {
      console.log(
        'El valor de los rubros sigue normal sin cambios, hay que crear una sola factura '
      );
      this.f_simular.patchValue({
        inicial: 0,
        final: 0,
        mensual: this.subtotal,
      });
    }
  }
  aprobarRemision() {
    /* VALIDAR SI LAS CUOTAS SON MAYORES A 1 */
    /* SI SON MAYORES A 1 HAY QUE HACER EL CALCULO DE LOS VALORES */
    /* actualizar facturas antiguas para que esten cobradas y en estado de convenio */
    /*  */
  }
}
