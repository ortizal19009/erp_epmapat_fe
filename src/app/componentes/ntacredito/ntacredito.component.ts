import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { NotaReporte, pdfNotas, excelNotas } from './notas-credito-reportes';
import { firstValueFrom } from 'rxjs';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { ColoresService } from 'src/app/compartida/colores.service';
import { JasperReportService } from 'src/app/servicios/jasper-report.service';
import { LoadingService } from 'src/app/servicios/loading.service';
import { NtacreditoService } from 'src/app/servicios/ntacredito.service';


type SortColumn = 'cuenta' | 'cliente' | 'planilla' | 'identificacion' | 'valor' | 'devengado' | 'saldo';
type SortDirection = 'asc' | 'desc';
type EstadoFiltro = 'todos' | 'con-saldo' | 'agotadas' | 'pagadas-total';

@Component({
  selector: 'app-ntacredito',
  templateUrl: './ntacredito.component.html',
  styleUrls: ['./ntacredito.component.css'],
})
export class NtacreditoComponent implements OnInit, OnDestroy {
  f_bntacredito: FormGroup;
  filterTerm = '';
  estadoFiltro: EstadoFiltro = 'todos';
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
  fechaDesde='';fechaHasta='';campoFiltro='todos';errorListado='';cargandoPagina=false;
  private filtroTimer:ReturnType<typeof setTimeout>|undefined;
  private cargaCompleta:Promise<void>|null=null;
  cargandoTodos = false;
  exportando = false;
  mensajeReporte = '';

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
      const datos = await this.coloresService.setcolor(this.authService.idusuario, 'ntacredito');
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
    this.cargandoPagina=true;this.errorListado='';
    this.s_ntacredito.getAllPageable(page, size).subscribe({
      next: (datos: any) => {
        this.cargandoPagina=false;this._ntacreditos = datos.content ?? [];
        this.size = datos.size ?? size;
        this.page = datos.pageable?.pageNumber ?? page;
        this.totalPages = datos.totalPages ?? 0;
        this.totalElements = datos.totalElements ?? 0;
        this.updatePages();
      },
      error: (e: any) => {this.cargandoPagina=false;this.errorListado='No se pudieron cargar las notas. Intente nuevamente.';console.error(e);},
    });
  }

  get filteringActive(): boolean {
    return !!this.filterTerm?.trim() || this.estadoFiltro !== 'todos' || !!this.fechaDesde || !!this.fechaHasta;
  }

  get filteredNotasCreditos(): any[] {
    const term = (this.filterTerm || '').trim().toLowerCase();
    const source = this.filteringActive ? this._ntacreditosAll : this._ntacreditos;

    return (source ?? []).filter((ntacredito: any) =>
      this.matchesEstadoFiltro(ntacredito) && this.matchesFilter(ntacredito, term) && this.matchesFechas(ntacredito,this.fechaDesde,this.fechaHasta),
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
    if(this.filtroTimer)clearTimeout(this.filtroTimer);
    this.errorListado='';
    if(this.fechaDesde&&this.fechaHasta&&this.fechaDesde>this.fechaHasta){this.errorListado='La fecha desde no puede ser mayor que hasta.';return;}
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

  getSortIconClean(column: SortColumn): string {
    if (this.sortColumn !== column) {
      return '';
    }
    return this.sortDirection === 'asc' ? 'bi-sort-up' : 'bi-sort-down';
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
    const saldo = this.getSaldo(ntacredito);

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
    if(this.cargaCompleta)return this.cargaCompleta;
    this.cargaCompleta=(async()=>{
      this.cargandoTodos=true;
      try{
        const notas:any[]=[];let pagina=0,paginas=1;
        do{const r:any=await firstValueFrom(this.s_ntacredito.getAllPageable(pagina,200));notas.push(...(r.content??[]));paginas=r.totalPages??1;pagina++;}while(pagina<paginas);
        this._ntacreditosAll=notas;
      }catch(e){this.errorListado='No se pudieron cargar todas las notas para filtrar. Intente nuevamente.';this._ntacreditosAll=[];console.error(e);}
      finally{this.cargandoTodos=false;}
    })();
    try{await this.cargaCompleta;}finally{this.cargaCompleta=null;}
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

  private matchesFilter(ntacredito: any, term: string, campo=this.campoFiltro): boolean {
    if (!term) {
      return true;
    }

    const cuenta = String(ntacredito?.idabonado_abonados?.idabonado ?? '').toLowerCase();
    const cliente = String(ntacredito?.idcliente_clientes?.nombre ?? '').toLowerCase();
    const cedula = String(ntacredito?.idcliente_clientes?.cedula ?? '').toLowerCase();
    const planilla = String(ntacredito?.nrofactura ?? '').toLowerCase();
    const valor = String(ntacredito?.valor ?? '').toLowerCase();
    const devengado = String(ntacredito?.devengado ?? '').toLowerCase();
    const saldo = String(this.getSaldo(ntacredito)).toLowerCase();

    const campos:Record<string,string>={cuenta,cliente,identificacion:cedula,planilla};
    if(campo!=='todos')return (campos[campo]??'').includes(term);

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

  ngOnDestroy(){if(this.filtroTimer)clearTimeout(this.filtroTimer);}
  programarFiltro(){if(this.filtroTimer)clearTimeout(this.filtroTimer);this.filtroTimer=setTimeout(()=>void this.onFilterChange(),300);}
  limpiarFiltros(){this.filterTerm='';this.estadoFiltro='todos';this.fechaDesde='';this.fechaHasta='';this.campoFiltro='todos';void this.onFilterChange();}
  cambiarTamanio(tamanio:number){this.size=tamanio;this.page=0;if(this.filteringActive)this.updatePages();else this.getAllNotasCreditos(0,tamanio);}
  get cantidadResultados(){return this.filteringActive?this.filteredNotasCreditos.length:this.totalElements;}
  get finVisible(){return Math.min((this.page+1)*this.size,this.cantidadResultados);}
  get alcanceResumen(){return this.filteringActive?'Todos los resultados filtrados':'P\u00e1gina actual';}
  get resumenVista(){const filas=this.filteredNotasCreditos;const suma=(campo:string)=>filas.reduce((n,f)=>n+Math.round(Number(campo==='saldo'?this.getSaldo(f):f[campo]??0)*100),0)/100;return {valor:suma('valor'),devengado:suma('devengado'),saldo:suma('saldo')};}
  private matchesFechas(n:any,desde:string,hasta:string){const fecha=String(n.feccrea??'').slice(0,10);return (!desde||fecha>=desde)&&(!hasta||(!!fecha&&fecha<=hasta));}

  getSaldo(ntacredito: any): number {
    const valor = Number(ntacredito?.valor ?? 0);
    const devengado = Number(ntacredito?.devengado ?? 0);
    return Number(ntacredito?.saldoDisponible ?? +(valor - devengado).toFixed(2));
  }

  getEstadoNotaCredito(ntacredito: any): string {
    const saldo = this.getSaldo(ntacredito);
    return saldo > 0 ? 'Con saldo a favor' : 'Pagada totalmente';
  }

  private matchesEstadoFiltro(ntacredito: any, estado: EstadoFiltro = this.estadoFiltro): boolean {
    const saldo = this.getSaldo(ntacredito);

    switch (estado) {
      case 'con-saldo':
        return saldo > 0;
      case 'agotadas':
        return saldo <= 0;
      case 'pagadas-total':
        return saldo <= 0;
      case 'todos':
      default:
        return true;
    }
  }

  async exportarNotas(formato:'pdf'|'xlsx',filtrado:boolean):Promise<void> {
    if(this.exportando)return;
    this.exportando=true;this.mensajeReporte='';
    const termino=filtrado?this.filterTerm.trim().toLowerCase():'';
    const estado:EstadoFiltro=filtrado?this.estadoFiltro:'todos';
    const campo=filtrado?this.campoFiltro:'todos',desde=filtrado?this.fechaDesde:'',hasta=filtrado?this.fechaHasta:'';
    if(desde&&hasta&&desde>hasta){this.mensajeReporte='Corrija el rango de fechas antes de exportar.';this.exportando=false;return;}
    const columna=this.sortColumn,direccion=this.sortDirection;
    const estados:Record<EstadoFiltro,string>={'todos':'Todas','con-saldo':'Con saldo a favor','agotadas':'Usadas totalmente','pagadas-total':'Pagadas totalmente'};
    const alcance=filtrado?'Filtros actuales | Estado: '+estados[estado]+' | Campo: '+campo+' | B\u00fasqueda: '+(termino||'Sin texto')+' | Desde: '+(desde||'Sin limite')+' | Hasta: '+(hasta||'Sin limite'):'Listado completo | Todas las notas de cr\u00e9dito';
    try {
      // Read fresh pages, independently of the current screen page or filter cache.
      const todas:any[]=[];let pagina=0;let paginas=1;
      do {
        const respuesta:any=await firstValueFrom(this.s_ntacredito.getAllPageable(pagina,200));
        if(!Array.isArray(respuesta.content))throw new Error('Respuesta de notas inv\u00e1lida');
        todas.push(...respuesta.content);paginas=respuesta.totalPages??1;pagina++;
      }while(pagina<paginas);
      const notas=todas.filter(n=>this.matchesEstadoFiltro(n,estado)&&this.matchesFilter(n,termino,campo)&&this.matchesFechas(n,desde,hasta))
        .sort((a,b)=>this.compareValues(this.getSortValue(a,columna),this.getSortValue(b,columna))*(direccion==='asc'?1:-1));
      if(!notas.length){this.mensajeReporte='No hay notas de cr\u00e9dito para el reporte seleccionado.';return;}
      const dinero=(valor:any)=>{const numero=Number(valor??0);if(!Number.isFinite(numero))throw new Error('Importe inv\u00e1lido en una nota de cr\u00e9dito');return Math.round(numero*100)/100;};
      const filas:NotaReporte[]=notas.map(n=>({nota:n.idntacredito,cuenta:String(n.idabonado_abonados?.idabonado??''),cliente:String(n.idcliente_clientes?.nombre??''),identificacion:String(n.idcliente_clientes?.cedula??''),planilla:String(n.nrofactura??''),valor:dinero(n.valor),devengado:dinero(n.devengado),endosado:dinero(n.totalEndosado),saldo:dinero(this.getSaldo(n)),estado:this.getEstadoNotaCredito(n)}));
      const fecha=new Intl.DateTimeFormat('es-EC',{dateStyle:'short',timeStyle:'short',timeZone:'America/Guayaquil'}).format(new Date());
      const archivo=formato==='pdf'?pdfNotas(filas,alcance,fecha):await excelNotas(filas,alcance,fecha);
      const url=URL.createObjectURL(archivo),enlace=document.createElement('a');enlace.href=url;enlace.download='notas-credito-'+(filtrado?'filtradas':'completo')+'.'+formato;enlace.click();setTimeout(()=>URL.revokeObjectURL(url),15000);
    }catch(e){console.error(e);this.mensajeReporte='No se pudo generar el reporte. Intente nuevamente; no se exportaron datos incompletos.';}
    finally{this.exportando=false;}
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
