import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ColoresService } from 'src/app/compartida/colores.service';
import { ImpTransaciComponent } from 'src/app/componentes/contabilidad/transaci/imp-transaci/imp-transaci.component';
import { ClientesService } from 'src/app/servicios/clientes.service';
import { FacturaService } from 'src/app/servicios/factura.service';
import { LoadingService } from 'src/app/servicios/loading.service';

@Component({
  selector: 'app-cv-facturas',
  templateUrl: './cv-facturas.component.html',
  styleUrls: ['./cv-facturas.component.css'],
})
export class CvFacturasComponent implements OnInit {
  f_buscar: FormGroup;
  filtro: string;
  _facturas: any;
  today: Date = new Date();
  nomCliente: string = '';
  total: number = 0;
  _clientes: any;
  swfacturas: boolean = true;
  idplanilla: number = 0;
  /* variables para hacer la paginación  */
  page: number = 0;
  size: number = 20;
  _cuentasPageables?: any;
  totalPages: number = 0; // Total de páginas
  pages: number[] = []; // Lista de números de página
  maxPagesToShow: number = 5; // Máximo número de botones a mostrar
  totalElements: number = 0;
  constructor(
    private coloresService: ColoresService,
    private fb: FormBuilder,
    private s_facturas: FacturaService,
    private s_clientes: ClientesService,
    private s_loading: LoadingService
  ) { }

  ngOnInit(): void {
    sessionStorage.setItem('ventana', '/cv-facturas');
    let coloresJSON = sessionStorage.getItem('/cv-facturas');
    if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
    else this.buscaColor();
    let d = this.today.toISOString().slice(0, 10);
    this.f_buscar = this.fb.group({
      sDate: d,
      filtro: '',
      nombre: ''
    });
    //this.getCarteraOfFacturas(d);
    this.getCarteraOfClientes(d, this.page, this.size);
  }
  onChangeDate() { this.page = 0; this.getCarteraOfClientes(this.f_buscar.value.sDate, this.page, this.size) }

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

  getCarteraOfClientes(date: any, page: number, size: number) {
    this.s_loading.showLoading();
    this.s_clientes.CVOfClientes(date, this.f_buscar.value.nombre, page, size).then((items: any) => {
      this._clientes = items.content
      this.size = items.size;
      this.page = items.pageable.pageNumber;
      this.totalPages = items.totalPages;
      this.totalElements = items.totalElements;
      this.updatePages();
      this.s_loading.hideLoading();
    }).catch((error: any) => console.error(error))
  }
  getDetallePlanilla(idplanilla: number) {
    this.s_loading.showLoading()
    this.idplanilla = idplanilla;
    this.swfacturas = false;
    this.s_loading.hideLoading();

  }

  getFacturasByCliente(idcliente: number) {
    this.s_loading.showLoading()

    this.total = 0;
    this.s_facturas.getSinCobro(idcliente).subscribe({
      next: (datos: any) => {
        datos.length > 0 ? this.nomCliente = datos[0].idcliente.nombre : this.nomCliente = '';
        this._facturas = datos;
        datos.forEach((item: any) => {
          this.total += item.totaltarifa;
        })
        this.s_loading.hideLoading();
      }
    })
  }


  /* Inicio de configuracion de paginacion */
  onPreviousPage(): void {
    if (this.page > 0) {
      const rawDate = new Date(this.f_buscar.value.sDate);
      const formattedDate = rawDate.toISOString().split('T')[0]; // "2025-07-17"
      this.getCarteraOfClientes(formattedDate, this.page - 1, this.size);
    }
  }
  onNextPage(): void {
    if (this.page <= this.totalPages - 1) {
      const rawDate = new Date(this.f_buscar.value.sDate);
      const formattedDate = rawDate.toISOString().split('T')[0]; // "2025-07-17"
      this.getCarteraOfClientes(formattedDate, this.page + 1, this.size);
    }
  }
  onGoToPage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      const rawDate = new Date(this.f_buscar.value.sDate);
      const formattedDate = rawDate.toISOString().split('T')[0]; // "2025-07-17"
      this.getCarteraOfClientes(formattedDate, page, this.size);
    }
  }

  updatePages(): void {
    const halfRange = Math.floor(this.maxPagesToShow / 2);
    let startPage = Math.max(this.page - halfRange, 0);
    let endPage = Math.min(this.page + halfRange, this.totalPages - 1);
    // Ajusta el rango si estás al principio o al final
    if (this.page <= halfRange) {
      endPage = Math.min(this.maxPagesToShow - 1, this.totalPages - 1);
    } else if (this.page + halfRange >= this.totalPages) {
      startPage = Math.max(this.totalPages - this.maxPagesToShow, 0);
    }
    // Genera los números de las páginas visibles
    this.pages = Array.from(
      { length: endPage - startPage + 1 },
      (_, i) => startPage + i
    );
  }
}
