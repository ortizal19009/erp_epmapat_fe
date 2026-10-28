import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Facturas } from 'src/app/modelos/facturas.model';
import { AbonadosService } from 'src/app/servicios/abonados.service';
import { FacturaService } from 'src/app/servicios/factura.service';
import { InteresesService } from 'src/app/servicios/intereses.service';
import { LecturasService } from 'src/app/servicios/lecturas.service';
import { LoadingService } from 'src/app/servicios/loading.service';
import { PdfService } from 'src/app/servicios/pdf.service';
import { RubroxfacService } from 'src/app/servicios/rubroxfac.service';
import { RutasService } from 'src/app/servicios/rutas.service';

interface RowUIState {
  selected: boolean;
}

@Component({
  selector: 'app-rutasmoras',
  templateUrl: './rutasmoras.component.html',
  styleUrls: ['./rutasmoras.component.css', '../../../compartida/gestion-cuentas.css'],
})
export class RutasmorasComponent implements OnInit, OnDestroy {
  _ruta: any;
  today: number = Date.now();
  titulo = 'Mora Medidores';
  rutas: any[] = [];
  idrutaSeleccionada: number | null = null;
  cargandoRutas = false;
  cargandoCuentas = false;
  errorRutas = '';
  errorCuentas = '';
  private parametros?: Subscription;
  private listadoRutas?: Subscription;
  private detalleRuta?: Subscription;
  private solicitudCuentas = 0;
  datosCuentas: any[] = [];
  datosCuentasFiltradas: any[] = [];

  /* filtros */
  filterTerm: string = '';
  deudasMin: number | null = null;
  deudasMax: number | null = null;

  /* SORT */
  currentSortColumn: string | null = null;
  isAscending: boolean = true;

  /* selección */
  rowUI: Record<number, RowUIState> = {};
  seleccionados: any[] = [];
  selectedCount: number = 0;

  constructor(
    private rutaDato: ActivatedRoute,
    private lecService: LecturasService,
    private rubxfacService: RubroxfacService,
    private fb: FormBuilder,
    private s_ruta: RutasService,
    private s_abonado: AbonadosService,
    private s_facturas: FacturaService,
    private s_pdf: PdfService,
    private s_rubxfacturas: RubroxfacService,
    private interService: InteresesService,
    private s_loading: LoadingService,
    private router: Router
  ) {}

  ngOnInit(): void {
    sessionStorage.setItem('ventana', '/mora-abonados');
    const coloresJSON = sessionStorage.getItem('/mora-abonados');
    if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));

    this.listarRutas();
    this.parametros = this.rutaDato.paramMap.subscribe(parametros => {
      const id = Number(parametros.get('idruta'));
      this.solicitudCuentas++;
      this.detalleRuta?.unsubscribe();
      if (this.cargandoCuentas) this.s_loading.hideLoading();
      this.cargandoCuentas = false;
      this.idrutaSeleccionada = Number.isFinite(id) && id > 0 ? id : null;
      this._ruta = null;
      this.titulo = 'Mora Medidores';
      this.datosCuentas = [];
      this.datosCuentasFiltradas = [];
      this.rowUI = {};
      this.seleccionados = [];
      this.selectedCount = 0;
      this.errorCuentas = '';
      if (this.idrutaSeleccionada) {
        this.getRuta(this.idrutaSeleccionada);
        this.getDatosCuenta(this.idrutaSeleccionada);
      }
    });
  }

  ngOnDestroy() {
    this.parametros?.unsubscribe();
    this.listadoRutas?.unsubscribe();
    this.detalleRuta?.unsubscribe();
    this.solicitudCuentas++;
    if (this.cargandoCuentas) this.s_loading.hideLoading();
  }

  listarRutas() {
    this.listadoRutas?.unsubscribe();
    this.cargandoRutas = true;
    this.errorRutas = '';
    this.listadoRutas = this.s_ruta.getResumenRutas().subscribe({
      next: rutas => { this.rutas = rutas; this.cargandoRutas = false; },
      error: () => { this.errorRutas = 'No se pudieron cargar las rutas.'; this.cargandoRutas = false; }
    });
  }

  seleccionarRuta(id: number | null) {
    this.router.navigate(id ? ['/mora-abonados', id] : ['/mora-abonados']);
  }

  colocaColor(colores: any) {
    document.documentElement.style.setProperty('--bgcolor1', colores[0]);
    const cabecera = document.querySelector('.cabecera');
    if (cabecera) cabecera.classList.add('nuevoBG1');

    document.documentElement.style.setProperty('--bgcolor2', colores[1]);
    const detalle = document.querySelector('.detalle');
    if (detalle) detalle.classList.add('nuevoBG2');
  }

  getRuta(idruta: number) {
    this.detalleRuta = this.s_ruta.getByIdruta(idruta).subscribe({
      next: (rutaDatos: any) => {
        this._ruta = rutaDatos;
        this.titulo = 'Mora Medidores - ' + rutaDatos.descripcion;
      },
      error: (e) => console.error(e),
    });
  }

  // =========================
  // DATA
  // =========================
  getDatosCuenta(idruta: number) {
    const solicitud = ++this.solicitudCuentas;
    this.cargandoCuentas = true;
    this.errorCuentas = '';
    this.s_loading.showLoading();
    this.s_abonado.DeudasCuentasByRuta(idruta).then((item: any) => {
      if (solicitud !== this.solicitudCuentas) return;
      this.datosCuentas = Array.isArray(item) ? item : [];
      this.initRowUI(this.datosCuentas);
      this.applyFilters();
    }).catch(() => {
      if (solicitud === this.solicitudCuentas) this.errorCuentas = 'No se pudieron cargar los valores pendientes de la ruta.';
    }).finally(() => {
      if (solicitud !== this.solicitudCuentas) return;
      this.cargandoCuentas = false;
      this.s_loading.hideLoading();
    });
  }

  private initRowUI(list: any[]) {
    for (const a of list) {
      const key = Number(a.cuenta);
      if (!this.rowUI[key]) {
        this.rowUI[key] = { selected: false };
      }
    }
    this.rebuildSeleccionados();
  }

  // =========================
  // FILTROS (texto + rango)
  // =========================
  applyFilters() {
    const term = (this.filterTerm || '').trim().toLowerCase();

    const min = (this.deudasMin === null || this.deudasMin === undefined || this.deudasMin === ('' as any))
      ? null
      : Number(this.deudasMin);

    const max = (this.deudasMax === null || this.deudasMax === undefined || this.deudasMax === ('' as any))
      ? null
      : Number(this.deudasMax);

    this.datosCuentasFiltradas = this.datosCuentas.filter((a: any) => {
      // filtro texto
      const texto =
        `${a.cuenta ?? ''} ${a.nombre ?? ''} ${a.cedula ?? ''}`.toLowerCase();
      const okTexto = term ? texto.includes(term) : true;

      // filtro rango de deudas
      const deudas = Number(a.num_facturas ?? 0);
      const okMin = (min !== null && !Number.isNaN(min)) ? deudas >= min : true;
      const okMax = (max !== null && !Number.isNaN(max)) ? deudas <= max : true;

      return okTexto && okMin && okMax;
    });

    // mantener sort vigente
    if (this.currentSortColumn) {
      this.sortArrayInPlace(this.datosCuentasFiltradas, this.currentSortColumn, this.isAscending);
    }

    // refrescar "select all" visual y conteo
    this.rebuildSeleccionados();
  }

  clearFilters() {
    this.filterTerm = '';
    this.deudasMin = null;
    this.deudasMax = null;
    this.applyFilters();
  }

  // =========================
  // SORT (NO rompe filtros)
  // =========================
  sortData(column: string) {
    if (this.currentSortColumn === column) {
      this.isAscending = !this.isAscending;
    } else {
      this.currentSortColumn = column;
      this.isAscending = true;
    }

    // ordena la lista filtrada (lo que ve el usuario)
    this.sortArrayInPlace(this.datosCuentasFiltradas, column, this.isAscending);

    // también ordena la lista base para que al limpiar filtros conserve el orden
    this.sortArrayInPlace(this.datosCuentas, column, this.isAscending);
  }

  private sortArrayInPlace(arr: any[], column: string, asc: boolean) {
    arr.sort((a: any, b: any) => {
      const va = a?.[column];
      const vb = b?.[column];

      // números primero si aplica
      const na = Number(va);
      const nb = Number(vb);
      const bothNumbers = !Number.isNaN(na) && !Number.isNaN(nb);

      if (bothNumbers) {
        return asc ? na - nb : nb - na;
      }

      // strings fallback
      const sa = String(va ?? '').toLowerCase();
      const sb = String(vb ?? '').toLowerCase();
      if (sa < sb) return asc ? -1 : 1;
      if (sa > sb) return asc ? 1 : -1;
      return 0;
    });
  }

  getSortIcon(column: string): string {
    if (this.currentSortColumn !== column) return '';
    return this.isAscending ? 'bi-caret-up-fill' : 'bi-caret-down-fill';
  }

  // =========================
  // SELECCIÓN (solo checkbox)
  // =========================
  onRowSelectedChange(abonado: any) {
    this.rebuildSeleccionados();
  }

  get isAllFilteredSelected(): boolean {
    if (!this.datosCuentasFiltradas.length) return false;
    return this.datosCuentasFiltradas.every(a => this.rowUI[Number(a.cuenta)]?.selected);
  }

  toggleSelectAllFiltered(ev: any) {
    const checked = !!ev?.target?.checked;

    // solo sobre lo filtrado (lo que ve)
    for (const a of this.datosCuentasFiltradas) {
      const key = Number(a.cuenta);
      if (!this.rowUI[key]) this.rowUI[key] = { selected: false };
      this.rowUI[key].selected = checked;
    }

    this.rebuildSeleccionados();
  }

  clearSelection() {
    for (const a of this.datosCuentas) {
      const key = Number(a.cuenta);
      if (!this.rowUI[key]) continue;
      this.rowUI[key].selected = false;
    }
    this.rebuildSeleccionados();
  }

  private rebuildSeleccionados() {
    const selected: any[] = [];

    for (const a of this.datosCuentas) {
      const key = Number(a.cuenta);
      const ui = this.rowUI[key];
      if (ui?.selected) {
        selected.push({ ...a });
      }
    }

    this.seleccionados = selected;
    this.selectedCount = selected.length;
  }

  // =========================
  // IMPRIMIR SELECCIONADOS (PDF)
  // =========================
  async procesarSeleccionados() {
    if (this.seleccionados.length === 0) {
      alert('No hay filas seleccionadas.');
      return;
    }

    this.s_loading.showLoading();

    try {
      this.generarPdfSeleccionados(this.seleccionados);
    } finally {
      this.s_loading.hideLoading();
    }
  }

  private generarPdfSeleccionados(rows: any[]) {
    const doc = new jsPDF('p', 'pt', 'a4');
    this.s_pdf.header(`${this.titulo} - Seleccionados`, doc);

    const body = rows.map((r: any, idx: number) => ([
      idx + 1,
      r.cuenta,
      r.nombre,
      r.cedula,
      r.num_facturas,
      Number(r.subtotal ?? 0).toFixed(2),
      Number(r.intereses ?? 0).toFixed(2),
      Number(r.total ?? 0).toFixed(2),
    ]));

    autoTable(doc, {
      head: [[
        '#', 'Cuenta', 'Cliente', 'Identificación', 'Deudas',
        'Subtotal', 'Interés', 'Total'
      ]],
      body,
      styles: { fontSize: 7 },
      headStyles: { halign: 'center' },
      columnStyles: {
        0: { halign: 'center', cellWidth: 18 },
        1: { halign: 'center' },
        4: { halign: 'center' },
        5: { halign: 'right' },
        6: { halign: 'right' },
        7: { halign: 'right' },
      },
    });

    this.s_pdf.setfooter(doc);

    const blobUrl  = doc.output('datauri');
    const viewer: any = document.getElementById('pdfSeleccionadosViewer') as HTMLIFrameElement;
    viewer.src = blobUrl ;
  }
}
