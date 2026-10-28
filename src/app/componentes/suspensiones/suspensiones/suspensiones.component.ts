import { SuspensionesReporteService } from 'src/app/servicios/suspensiones-reporte.service';
import { Ng2SearchPipe } from 'ng2-search-filter';
import { Observable, Subscription } from 'rxjs';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import jsPDF from 'jspdf';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { ColoresService } from 'src/app/compartida/colores.service';
import { FacturaService } from 'src/app/servicios/factura.service';
import { LecturasService } from 'src/app/servicios/lecturas.service';
import { RubroxfacService } from 'src/app/servicios/rubroxfac.service';
import { SuspensionesService } from 'src/app/servicios/suspensiones.service';
// import { SuspensionesService } from 'src/app/Service/suspensiones.service';

@Component({
  selector: 'app-suspensiones',
  templateUrl: './suspensiones.component.html',
  styleUrls: ['./suspensiones.component.css', '../../../compartida/gestion-cuentas.css'],
})
export class SuspensionesComponent implements OnInit, OnDestroy {
  formSuspensiones: FormGroup;
  titulo: string = 'Suspensiones';
  filterTerm = '';
  cargandoListado = false;
  errorListado = '';
  exportandoReporte = false;
  rangoReporte = '';
  private listadoSubscription?: Subscription;
  suspensiones: any[] = [];
  today: string = this.formatDateForInput(new Date());
  startOfYear: string = this.formatDateForInput(new Date(new Date().getFullYear(), 0, 1));
  optImprimir: string = '1';
  _ruta: any;
  currentSortColumn: string = '';
  isAscending: boolean = true;

  constructor(
    private router: Router,
    private suspeService: SuspensionesService,
    private coloresService: ColoresService,
    private fb: FormBuilder,
    private s_lecturas: LecturasService,
    private s_facturas: FacturaService,
    private s_rubroxfac: RubroxfacService,
    private authService: AutorizaService,
    private reportes: SuspensionesReporteService = new SuspensionesReporteService()
  ) {}

  ngOnInit(): void {
    sessionStorage.setItem('ventana', '/suspensiones');
    let coloresJSON = sessionStorage.getItem('/suspensiones');
    if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
    else this.buscaColor();

    this.formSuspensiones = this.fb.group({
      desde: [this.startOfYear],
      hasta: [this.today],
    });
    this.buscarxFecha();
  }

  async buscaColor() {
    try {
      const datos = await this.coloresService.setcolor(this.authService.idusuario, 'suspensiones');
      const coloresJSON = JSON.stringify(datos);
      sessionStorage.setItem('/suspensiones', coloresJSON);
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

  async descargarReporte(formato: 'pdf' | 'xlsx') {
    if (this.cargandoListado || this.exportandoReporte) return;
    const registros = new Ng2SearchPipe().transform(this.suspensiones, this.filterTerm);
    if (!registros.length) { this.errorListado = 'No hay registros para exportar.'; return; }
    this.exportandoReporte = true; this.errorListado = '';
    try {
      await this.reportes.descargar(this.titulo, registros,
        this.rangoReporte + (this.filterTerm ? ' | Busqueda: ' + this.filterTerm : ''), formato);
    } catch { this.errorListado = 'No se pudo generar el reporte. Intente nuevamente.'; }
    finally { this.exportandoReporte = false; }
  }

  ngOnDestroy() { this.listadoSubscription?.unsubscribe(); }

  get totalCuentasVinculadas(): number {
    return this.suspensiones.reduce((total, registro) => total + (registro.cuentasAfectadas?.length ?? registro.total ?? 0), 0);
  }

  abrirCuenta(cuenta: number) {
    sessionStorage.setItem('idabonadoToFactura', String(cuenta));
    this.router.navigate(['detalles-abonado']);
  }

  private cargarListado(consulta: Observable<any>, rango = 'Ultimos registros') {
    this.listadoSubscription?.unsubscribe();
    this.cargandoListado = true;
    this.errorListado = '';
    this.listadoSubscription = consulta.subscribe({
      next: datos => {
        this.suspensiones = Array.isArray(datos) ? datos : [];
        this.rangoReporte = rango;
        this.cargandoListado = false;
        this.applyCurrentSort();
      },
      error: () => { this.cargandoListado = false; this.errorListado = 'No se pudo cargar el listado. Intente nuevamente.'; }
    });
  }

  listarSuspensiones() {
    this.cargarListado(this.suspeService.getListaSuspensiones());
  }

  onSubmit() {}

  downloadPDF() {
    // this.s_pdf.suspensiones(this.titulo, this.suspensiones);
  }

  nuevaSuspension() {
    this.router.navigate(['add-suspension']);
  }

  info(suspension: any) {
    sessionStorage.setItem('retornoSuspensionesInfo', 'suspensiones');
    sessionStorage.setItem(
      'idsuspensionToInfo',
      suspension.idsuspension.toString()
    );
    this.router.navigate(['info-suspension']);
  }

  buscarxFecha() {
    const { desde, hasta } = this.formSuspensiones.value;
    if (!desde || !hasta || desde > hasta) {
      this.errorListado = 'Seleccione un rango de fechas valido (desde no puede ser posterior a hasta).';
      return;
    }
    this.cargarListado(this.suspeService.getByFecha(desde, hasta), `Desde ${desde} hasta ${hasta}`);
  }
  habilitarMedidor() {
    this.router.navigate(['habilitar-medidores']);
  }
  optSelect() {
    switch (this.optImprimir) {
      case '0':
        console.log('Imprimir Lista de suspenciones');
        break;
      case '1':
        console.log('Imprimir Lista de Mora consumo de agua x ruta');
        break;
    }
  }
  setRuta(e: any) {
    this.router.navigate(['mora-abonados', e.idruta]);
  }

  getTipoLabel(tipo: number): string {
    switch (Number(tipo)) {
      case 1:
        return 'Habilitación';
      case 2:
        return 'Suspensión';
      case 3:
        return 'Suspensión y retiro';
      default:
        return `${tipo ?? ''}`;
    }
  }

  sortData(column: string) {
    if (this.currentSortColumn === column) {
      this.isAscending = !this.isAscending;
    } else {
      this.currentSortColumn = column;
      this.isAscending = true;
    }

    this.applyCurrentSort();
  }

  getSortIcon(column: string): string {
    if (this.currentSortColumn !== column) return '';
    return this.isAscending ? 'bi-caret-up-fill' : 'bi-caret-down-fill';
  }

  private applyCurrentSort() {
    if (!this.currentSortColumn || !this.suspensiones?.length) {
      return;
    }
    this.sortArrayInPlace(this.suspensiones, this.currentSortColumn, this.isAscending);
  }

  private sortArrayInPlace(arr: any[], column: string, asc: boolean) {
    arr.sort((a: any, b: any) => {
      const va = this.resolveSortValue(a, column);
      const vb = this.resolveSortValue(b, column);

      const na = Number(va);
      const nb = Number(vb);
      const bothNumbers = !Number.isNaN(na) && !Number.isNaN(nb) && va !== '' && vb !== '';

      if (bothNumbers) {
        return asc ? na - nb : nb - na;
      }

      const da = new Date(va).getTime();
      const db = new Date(vb).getTime();
      const bothDates = !Number.isNaN(da) && !Number.isNaN(db);

      if (bothDates) {
        return asc ? da - db : db - da;
      }

      const sa = String(va ?? '').toLowerCase();
      const sb = String(vb ?? '').toLowerCase();
      if (sa < sb) return asc ? -1 : 1;
      if (sa > sb) return asc ? 1 : -1;
      return 0;
    });
  }

  private resolveSortValue(item: any, column: string): any {
    switch (column) {
      case 'documento':
        return item?.iddocumento_documentos?.nomdoc ?? '';
      case 'tipo':
        return this.getTipoLabel(item?.tipo);
      default:
        return item?.[column] ?? '';
    }
  }

  private formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  /* IMPRIMIR */
  i_deudasxruta(datos: any) {
    let doc = new jsPDF('p', 'pt', 'a4');
  }
}
