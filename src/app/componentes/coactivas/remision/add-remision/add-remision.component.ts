import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ColoresService } from 'src/app/compartida/colores.service';
import { Abonados } from 'src/app/modelos/abonados';
import { Categoria } from 'src/app/modelos/categoria.model';
import { Clientes } from 'src/app/modelos/clientes';
import { Rutas } from 'src/app/modelos/rutas.model';
import { AbonadosService } from 'src/app/servicios/abonados.service';
import { ClientesService } from 'src/app/servicios/clientes.service';
import { FacturaService } from 'src/app/servicios/factura.service';
import { LoadingService } from 'src/app/servicios/loading.service';

@Component({
  selector: 'app-add-remision',
  templateUrl: './add-remision.component.html',
  styleUrls: ['./add-remision.component.css'],
})
export class AddRemisionComponent implements OnInit {
  filtro: string;
  f_buscar: FormGroup;
  today: Date = new Date();
  _abonado: Abonados = new Abonados();
  _cliente: Clientes = new Clientes();
  _categoria: Categoria = new Categoria();
  _ruta: Rutas = new Rutas();
  _facturas: any;

  constructor(
    private fb: FormBuilder,
    private coloresService: ColoresService,
    private s_abonados: AbonadosService,
    private s_clientes: ClientesService,
    private s_facturas: FacturaService,
    private s_loading: LoadingService
  ) {}

  ngOnInit(): void {
    sessionStorage.setItem('ventana', '/cv-facturas');
    let coloresJSON = sessionStorage.getItem('/cv-facturas');
    if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
    else this.buscaColor();
    let d = this.today.toISOString().slice(0, 10);
    this.f_buscar = this.fb.group({
      cuenta: '',
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
  getCliente(idcliente: any) {
    this.s_loading.showLoading();
    this.s_clientes.getListaById(idcliente).subscribe({
      next: (cliente: any) => {
        console.log(cliente);
        this._cliente = cliente;
        this.getFacturasForRemision(cliente.idcliente);
      },
    });
  }
  getFacturasForRemision(idcliente: any) {
    console.log(idcliente);
    this.s_facturas
      .getFacturasForRemision(idcliente, '2024-12-10')
      .then((item: any) => {
        console.log(item);
        this._facturas = item;
        this.s_loading.hideLoading();
      });
  }
  suma(total: number, interes: number) {
    return (total + interes).toFixed(2);
  }
}
