import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import jsPDF from 'jspdf';
import { firstValueFrom } from 'rxjs';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { ColoresService } from 'src/app/compartida/colores.service';
import { JasperReportService } from 'src/app/servicios/jasper-report.service';
import { LoadingService } from 'src/app/servicios/loading.service';
import { NtacreditoService } from 'src/app/servicios/ntacredito.service';
import { PdfService } from 'src/app/servicios/pdf.service';

type SortColumn = 'cuenta' | 'cliente' | 'planilla' | 'identificacion' | 'valor' | 'devengado' | 'saldo';
type SortDirection = 'asc' | 'desc';

@Component({
  selector: 'app-ntacredito',
  template: `
<div class="content mt-1 pt-1 pl-0">
    <div class="container-fluid">
        <div class="row m-0 px-0 py-1 justify-content-start cabecera sombra border">
            <div class="col-sm-2">
                <h5 class="m-0 font-weight-bold description"><i class="fa fa-sticky-note" aria-hidden="true"></i>
                    Notas de creditos</h5>
            </div>
            <div class="col-sm-6">
                <div class="container-fluid">
                    <form [formGroup]="f_bntacredito" class="formGroup" (ngSubmit)="onSubmit()">
                        <div class="row" hidden>
                            <div class="col-sm-3">
                                <select name="" id="selecTipoBusqueda" class="form-control form-control-sm"
                                    formControlName="selecTipoBusqueda">
                                    <option value="1">Cuenta</option>
                                    <option value="2">Nombre</option>
                                    <option value="3">Identificacion</option>
                                </select>
                            </div>
                            <div class="col-sm-5">
                                <div class="container">
                                    <input type="text" placeholder="Buscar" class="form-control form-control-sm"
                                        autofocus id="buscarAbonado" formControlName="buscarAbonado" />
                                </div>
                            </div>
                            <div class="col-sm-3">
                                <button class="btn btn-primary btn-sm">
                                    <i class="fa fa-search" style="font-size:24pxi"></i> Buscar
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
            <div class="col-sm-2">
                <input type="text" class="form-control mx-0 form-control-sm text-center" placeholder="Filtrar..."
                    [(ngModel)]="filterTerm" (ngModelChange)="onFilterChange()" />
            </div>
            <div class="btn-group ml-auto mt-0">
                <button type="button" class="bg-transparent border-0 dropdown-toggle text-white" data-toggle="dropdown"
                    aria-expanded="false"> <i class="bi-menu-button-wide text-white"></i>
                </button>
                <div class="dropdown-menu dropdown-menu-right bg-dark roboto">
                    <button class="dropdown-item" [routerLink]="['/add-ntacredito']" type="button">
                        <i class="bi-file-earmark-plus"></i>&nbsp; Nuevo</button>
                    <button class="dropdown-item" type="button" data-toggle="modal" data-target="#imprimir">
                        <i class="bi bi-printer"></i>&nbsp; Imprimir</button>
                    <button class="dropdown-item" type="button" data-toggle="modal" data-target="#exportar"><i
                            class="bi-file-earmark-arrow-up"></i>&nbsp; Exportar</button>
                </div>
            </div>
        </div>
    </div>
</div>
<div class="container-fluid mt-2">
    <div class="card mb-0">
        <div class="card-body table-responsive  center-form card-size">
            <table class="table table-hover text-nowrap table-striped table-bordered table-sm sombra">
                <thead class="cabecera">
                    <tr class="text-center ">
                        <th class="col-sm-1">N°</th>
                        <th class="sortable" (click)="toggleSort('cuenta')" style="cursor:pointer; user-select:none;">
                            Cuenta {{ getSortIndicator('cuenta') }}
                        </th>
                        <th class="sortable" (click)="toggleSort('cliente')" style="cursor:pointer; user-select:none;">
                            Cliente {{ getSortIndicator('cliente') }}
                        </th>
                        <th class="sortable" (click)="toggleSort('planilla')" style="cursor:pointer; user-select:none;">
                            Planilla {{ getSortIndicator('planilla') }}
                        </th>
                        <th class="sortable" (click)="toggleSort('identificacion')" style="cursor:pointer; user-select:none;">
                            Identificacion {{ getSortIndicator('identificacion') }}
                        </th>
                        <th class="sortable" (click)="toggleSort('valor')" style="cursor:pointer; user-select:none;">
                            Valor {{ getSortIndicator('valor') }}
                        </th>
                        <th class="sortable" (click)="toggleSort('devengado')" style="cursor:pointer; user-select:none;">
                            Devengado {{ getSortIndicator('devengado') }}
                        </th>
                        <th class="sortable" (click)="toggleSort('saldo')" style="cursor:pointer; user-select:none;">
                            Saldo {{ getSortIndicator('saldo') }}
                        </th>
                        <th></th>
                    </tr>
                </thead>
                <tbody class="detalle">
                    <tr *ngFor="let ntacredito of notasCreditosVisibles; let i = index ">
                        <td class="col-sm-1 text-center">{{i+1 + (page * size)}}</td>
                        <td class="text-center">{{ntacredito.idabonado_abonados.idabonado}}</td>
                        <td class="description">{{ntacredito.idcliente_clientes.nombre}}</td>
                        <td class="text-center">{{ntacredito.nrofactura}}</td>
                        <td class="col-sm-1 text-right">{{ntacredito.idcliente_clientes.cedula}}</td>
                        <td class="text-right">{{ntacredito.valor}}</td>
                        <td class="text-right">{{ntacredito.devengado}}</td>
                        <td class="text-right">{{(ntacredito.valor - ntacredito.devengado).toFixed(2)}}</td>
                        <td class="text-center">
                            <div class="btn-group py-0">
                                <button type="button" class="btn btn-warning btn-badged dropdown-toggle py-0"
                                    data-toggle="dropdown" aria-expanded="false">
                                </button>
                                <div class="dropdown-menu dropdown-menu-right popLista">
                                    <button class="dropdown-item" type="button" data-toggle="modal" data-target="#pdf"
                                        (click)="impDocumento(ntacredito.idntacredito)">
                                        <i class="bi bi-file-minus"></i>&nbsp; Imp Doc</button>
                                    <button class="dropdown-item" disabled type="button"
                                        [routerLink]="['/modi-pingresos',ntacredito.idntacredito]">
                                        <i class="bi bi-pencil"></i>&nbsp; Transferir</button>
                                </div>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
        <div class="card-footer">
            <nav aria-label="Page navigation example">
                <ul class="pagination justify-content-end">
                    <li class="page-item">
                        <button class="btn btn-sm btn-primary" (click)="onPreviousPage()" [disabled]="page === 0"> <span
                                aria-hidden="true">&laquo;</span>
                        </button>
                    </li>
                    <li class="page-item" *ngFor="let p of pages">
                        <button class="btn btn-sm btn-outline-primary" (click)="onGoToPage(p)"
                            [class.active]="p === page">
                            {{ p + 1 }}
                        </button>
                    </li>
                    <li class="page-item">
                        <button class="btn btn-sm btn-primary" (click)="onNextPage()"
                            [disabled]="page >= totalPagesVisibles - 1"> <span
                                aria-hidden="true">&raquo;</span>
                        </button>
                    </li>
                </ul>
            </nav>
        </div>
    </div>

    <div class="modal fade" id="pdf" data-backdrop="static" data-keyboard="false" tabindex="-1"
        aria-labelledby="pdfLabel" aria-hidden="true">
        <div class="modal-dialog modal-xl">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="pdfLabel">Vista de reporte</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="modal-body">
                    <iframe id="pdfViewer" width="100%" height="600px"></iframe>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-success" data-dismiss="modal">Cancelar</button>
                </div>
            </div>
        </div>
    </div>
  `,
  styleUrls: ['./ntacredito.component.css'],
})
export class NtacreditoComponent implements OnInit {
  f_bntacredito: FormGroup;
  filterTerm = '';
  _ntacreditos: any;
  _ntacreditosAll: any[] = [];
  sortColumn: SortColumn = 'cuenta';
  sortDirection: SortDirection = 'asc';
  /* variables para hacer la paginacion */
  page: number = 0;
  size: number = 10;
  _cuentasPageables?: any;
  totalPages: number = 0;
  pages: number[] = [];
  maxPagesToShow: number = 5;
  totalElements: number = 0;
  cargandoTodos = false;

  constructor(
    private coloresService: ColoresService,
    private s_ntacredito: NtacreditoService,
    private fb: FormBuilder,
    private s_jrService: JasperReportService,
    private authService: AutorizaService,
    private s_loading: LoadingService
  ) {}

  ngOnInit(): void {
    sessionStorage.setItem('ventana', '/ntacredito');
    let coloresJSON = sessionStorage.getItem('/ntacredito');
    if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
    else this.buscaColor();
    this.f_bntacredito = this.fb.group({
      selecTipoBusqueda: 1,
      buscarAbonado: '',
    });
    this.getAllNotasCreditos(this.page, this.size);
  }

  async buscaColor() {
    try {
      const datos = await this.coloresService.setcolor(1, 'ntacredito');
      const coloresJSON = JSON.stringify(datos);
      sessionStorage.setItem('/ntacredito', coloresJSON);
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

  onSubmit() {}

  detallesnotasnc(notacredito: any) {}

  getAllNotasCreditos(page: number, size: number) {
    this.s_ntacredito.getAllPageable(page, size).subscribe({
      next: (datos: any) => {
        this._ntacreditos = datos.content ?? [];
        this.size = datos.size ?? size;
        this.page = datos.pageable?.pageNumber ?? page;
        this.totalPages = datos.totalPages ?? 0;
        this.totalElements = datos.totalElements ?? 0;
        this.updatePages();
      },
      error: (e: any) => console.error(e),
    });
  }

  get filteringActive(): boolean {
    return !!this.filterTerm?.trim();
  }

  get filteredNotasCreditos(): any[] {
    const term = (this.filterTerm || '').trim().toLowerCase();
    const source = this.filteringActive ? this._ntacreditosAll : this._ntacreditos;

    if (!term) {
      return source ?? [];
    }

    return (source ?? []).filter((ntacredito: any) =>
      this.matchesFilter(ntacredito, term),
    );
  }

  get orderedNotasCreditos(): any[] {
    return [...(this.filteredNotasCreditos ?? [])].sort((a: any, b: any) =>
      this.compareNotasCreditos(a, b),
    );
  }

  get notasCreditosVisibles(): any[] {
    if (!this.filteringActive) {
      return this.orderedNotasCreditos;
    }

    const start = this.page * this.size;
    return this.orderedNotasCreditos.slice(start, start + this.size);
  }

  get totalPagesVisibles(): number {
    if (!this.filteringActive) {
      return this.totalPages;
    }

    const totalFiltrados = this.filteredNotasCreditos.length;
    return totalFiltrados > 0 ? Math.ceil(totalFiltrados / this.size) : 0;
  }

  async onFilterChange(): Promise<void> {
    this.page = 0;

    if (this.filteringActive) {
      await this.cargarTodasLasNotasCreditos();
    } else {
      this._ntacreditosAll = [];
      this.getAllNotasCreditos(0, this.size);
    }

    this.updatePages();
  }

  toggleSort(column: SortColumn): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
  }

  getSortIndicator(column: SortColumn): string {
    if (this.sortColumn !== column) {
      return '';
    }
    return this.sortDirection === 'asc' ? '▲' : '▼';
  }

  private compareNotasCreditos(a: any, b: any): number {
    const va = this.getSortValue(a, this.sortColumn);
    const vb = this.getSortValue(b, this.sortColumn);
    const result = this.compareValues(va, vb);
    return this.sortDirection === 'asc' ? result : -result;
  }

  private compareValues(a: any, b: any): number {
    if (a == null && b == null) return 0;
    if (a == null) return -1;
    if (b == null) return 1;

    if (typeof a === 'number' && typeof b === 'number') {
      return a - b;
    }

    return String(a).localeCompare(String(b), 'es', { sensitivity: 'base' });
  }

  private getSortValue(ntacredito: any, column: SortColumn): string | number {
    const cuenta = Number(ntacredito?.idabonado_abonados?.idabonado ?? 0);
    const cliente = String(ntacredito?.idcliente_clientes?.nombre ?? '');
    const planilla = String(ntacredito?.nrofactura ?? '');
    const identificacion = String(ntacredito?.idcliente_clientes?.cedula ?? '');
    const valor = Number(ntacredito?.valor ?? 0);
    const devengado = Number(ntacredito?.devengado ?? 0);
    const saldo = Number((ntacredito?.valor ?? 0) - (ntacredito?.devengado ?? 0));

    switch (column) {
      case 'cuenta':
        return cuenta;
      case 'cliente':
        return cliente;
      case 'planilla':
        return planilla;
      case 'identificacion':
        return identificacion;
      case 'valor':
        return valor;
      case 'devengado':
        return devengado;
      case 'saldo':
        return saldo;
      default:
        return '';
    }
  }

  private async cargarTodasLasNotasCreditos(): Promise<void> {
    if (this.cargandoTodos) {
      return;
    }

    this.cargandoTodos = true;
    this.s_loading.showLoading();

    try {
      const primeraPagina: any = await firstValueFrom(
        this.s_ntacredito.getAllPageable(0, this.size),
      );

      const totalPages = primeraPagina.totalPages ?? 1;
      const size = primeraPagina.size ?? this.size;
      const contentInicial = primeraPagina.content ?? [];

      const requests: Promise<any>[] = [];
      for (let p = 1; p < totalPages; p++) {
        requests.push(firstValueFrom(this.s_ntacredito.getAllPageable(p, size)));
      }

      const restantes = await Promise.all(requests);
      this._ntacreditosAll = [
        ...contentInicial,
        ...restantes.flatMap((resp: any) => resp.content ?? []),
      ];

      this.totalElements = this._ntacreditosAll.length;
      this.totalPages = Math.max(1, Math.ceil(this.totalElements / this.size));
    } catch (e) {
      console.error(e);
      this._ntacreditosAll = [];
    } finally {
      this.cargandoTodos = false;
      this.s_loading.hideLoading();
    }
  }

  /* Inicio de configuracion de paginacion */
  onPreviousPage(): void {
    if (this.page > 0) {
      if (this.filteringActive) {
        this.page--;
        this.updatePages();
      } else {
        this.getAllNotasCreditos(this.page - 1, this.size);
      }
    }
  }

  onNextPage(): void {
    if (this.page < this.totalPagesVisibles - 1) {
      if (this.filteringActive) {
        this.page++;
        this.updatePages();
      } else {
        this.getAllNotasCreditos(this.page + 1, this.size);
      }
    }
  }

  onGoToPage(page: number): void {
    if (page >= 0 && page < this.totalPagesVisibles) {
      if (this.filteringActive) {
        this.page = page;
        this.updatePages();
      } else {
        this.getAllNotasCreditos(page, this.size);
      }
    }
  }

  updatePages(): void {
    if (this.totalPagesVisibles <= 0) {
      this.pages = [];
      return;
    }

    const halfRange = Math.floor(this.maxPagesToShow / 2);
    let startPage = Math.max(this.page - halfRange, 0);
    let endPage = Math.min(this.page + halfRange, this.totalPagesVisibles - 1);

    if (this.page <= halfRange) {
      endPage = Math.min(this.maxPagesToShow - 1, this.totalPagesVisibles - 1);
    } else if (this.page + halfRange >= this.totalPagesVisibles) {
      startPage = Math.max(this.totalPagesVisibles - this.maxPagesToShow, 0);
    }

    this.pages = Array.from(
      { length: endPage - startPage + 1 },
      (_, i) => startPage + i
    );
  }
  /* Fin de configuracion de paginacion */

  private matchesFilter(ntacredito: any, term: string): boolean {
    const cuenta = String(ntacredito?.idabonado_abonados?.idabonado ?? '').toLowerCase();
    const cliente = String(ntacredito?.idcliente_clientes?.nombre ?? '').toLowerCase();
    const cedula = String(ntacredito?.idcliente_clientes?.cedula ?? '').toLowerCase();
    const planilla = String(ntacredito?.nrofactura ?? '').toLowerCase();
    const valor = String(ntacredito?.valor ?? '').toLowerCase();
    const devengado = String(ntacredito?.devengado ?? '').toLowerCase();
    const saldo = String((ntacredito?.valor ?? 0) - (ntacredito?.devengado ?? 0)).toLowerCase();

    return (
      cuenta.includes(term) ||
      cliente.includes(term) ||
      cedula.includes(term) ||
      planilla.includes(term) ||
      valor.includes(term) ||
      devengado.includes(term) ||
      saldo.includes(term)
    );
  }

  async impDocumento(idntacredito: number) {
    this.s_loading.showLoading();
    let body: any = {
      reportName: 'NtaCreditoIndividual',
      parameters: {
        idntacredito: idntacredito,
        idusuario: this.authService.idusuario,
      },
      extencion: '.pdf',
    };
    let reporte = await this.s_jrService.getReporte(body);
    setTimeout(() => {
      const file = new Blob([reporte], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(file);
      const pdfViewer = document.getElementById('pdfViewer') as HTMLIFrameElement;
      if (pdfViewer) {
        pdfViewer.src = fileURL;
      }
    }, 1000);
    this.s_loading.hideLoading();
  }
}
