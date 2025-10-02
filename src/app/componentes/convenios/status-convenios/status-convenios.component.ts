import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { ColoresService } from 'src/app/compartida/colores.service';
import { ConvenioService } from 'src/app/servicios/convenio.service';
import { LoadingService } from 'src/app/servicios/loading.service';

@Component({
  selector: 'app-status-convenios',
  templateUrl: './status-convenios.component.html',
  styleUrls: ['./status-convenios.component.css'],
})
export class StatusConveniosComponent implements OnInit {
  formBuscar: FormGroup;
  swbuscando: boolean = false;
  filtro: string;
  swdesdehasta: boolean = false;
  _convenios: any;

  /* variables para hacer la paginación  */
  page: number = 0;
  size: number = 10;
  _cuentasPageables?: any;
  totalPages: number = 0; // Total de páginas
  pages: number[] = []; // Lista de números de página
  maxPagesToShow: number = 5; // Máximo número de botones a mostrar

  constructor(
    private convService: ConvenioService,
    private router: Router,
    private fb: FormBuilder,
    public authService: AutorizaService,
    private coloresService: ColoresService,
    private s_loading: LoadingService
  ) {}

  ngOnInit(): void {
    sessionStorage.setItem('ventana', '/estados-convenios');
    let coloresJSON = sessionStorage.getItem('/estados-convenios');
    if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
    else this.buscaColor();

    this.formBuscar = this.fb.group({
      desde: ['1'],
      hasta: ['50'],
    });
    this.getConvenios(this.page, this.size);
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
        'estados-convenios'
      );
      const coloresJSON = JSON.stringify(datos);
      sessionStorage.setItem('/estados-convenios', coloresJSON);
      this.colocaColor(datos);
    } catch (error) {
      console.error(error);
    }
  }

  nuevo() {}
  imprimir() {}
  listainicial() {}
  info(event: any, idconvenio: number) {
    const tagName = event.target.tagName;
    if (tagName === 'TD') {
      sessionStorage.setItem('idconvenioToInfo', idconvenio.toString());
      this.router.navigate(['info-convenio']);
    }
  }
  changeDesdeHasta() {
    this.page = 0;
    this.getConvenios(this.page, this.size);
  }
  buscaConvenios() {
    this.page = 0;
    this.getConvenios(this.page, this.size);
  }
  modiConvenio(idconvenio: number) {}

  getConvenios(page: number, size: number) {
    this.s_loading.showLoading();
    this.convService
      .getByPendientesPagos(
        this.formBuscar.value.desde,
        this.formBuscar.value.hasta,
        page,
        size
      )
      .subscribe({
        next: (datos: any) => {
          this.size = datos.size;
          this.page = datos.pageable.pageNumber;
          this.totalPages = datos.totalPages;
          this._convenios = datos.content;
          this.updatePages();
          this.s_loading.hideLoading();
        },
        error: (e: any) => console.error(e),
      });
  }
  /* Inicio de configuracion de paginacion */
  onPreviousPage(): void {
    if (this.page > 0) {
      this.getConvenios(this.page - 1, this.size);
    }
  }
  onNextPage(): void {
    if (this.page <= this.totalPages - 1) {
      this.getConvenios(this.page + 1, this.size);
    }
  }
  onGoToPage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.getConvenios(page, this.size);
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
