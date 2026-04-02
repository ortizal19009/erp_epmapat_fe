import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup } from '@angular/forms';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Swal from 'sweetalert2';
import { ConvenioService } from 'src/app/servicios/convenio.service';
import { PdfService } from 'src/app/servicios/pdf.service';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { ColoresService } from 'src/app/compartida/colores.service';
import { LoadingService } from 'src/app/servicios/loading.service';

@Component({
  selector: 'app-convenios',
  templateUrl: './convenios.component.html',
  styleUrls: ['./convenios.component.css']
})
export class ConveniosComponent implements OnInit {
  formBuscar: FormGroup;
  filtro: string = '';
  _convenios: any[] = [];
  swdesdehasta: boolean = false;
  swbuscando: boolean = false;
  txtbuscar: string = 'Buscar';

  page: number = 0;
  size: number = 20;
  totalPages: number = 0;
  totalElements: number = 0;
  pages: number[] = [];
  maxPagesToShow: number = 5;

  constructor(
    private convService: ConvenioService,
    private pdfService: PdfService,
    private router: Router,
    private fb: FormBuilder,
    public authService: AutorizaService,
    private coloresService: ColoresService,
    private s_loading: LoadingService
  ) { }

  ngOnInit(): void {
    sessionStorage.setItem('ventana', '/convenios');
    const coloresJSON = sessionStorage.getItem('/convenios');
    if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
    else this.buscaColor();

    this.formBuscar = this.fb.group({
      desde: [''],
      hasta: [''],
      nombre: [''],
      estado: [''],
      minPendientes: [''],
      maxPendientes: [''],
      cuenta: [''],
    });

    const desdeGuardado = sessionStorage.getItem('desdeconvenio');
    const hastaGuardado = sessionStorage.getItem('hastaconvenio');

    if (desdeGuardado != null && hastaGuardado != null) {
      this.formBuscar.patchValue({
        desde: desdeGuardado,
        hasta: hastaGuardado,
      });
      this.buscarConvenios();
    } else {
      this.ultimoNroconvenio();
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

  async buscaColor() {
    try {
      const datos = await this.coloresService.setcolor(this.authService.idusuario, 'convenios');
      const coloresJSON = JSON.stringify(datos);
      sessionStorage.setItem('/convenios', coloresJSON);
      this.colocaColor(datos);
    } catch (error) {
      console.error(error);
    }
  }

  ultimoNroconvenio() {
    this.convService.ultimoNroconvenio().subscribe({
      next: (resp) => {
        this.formBuscar.controls['hasta'].setValue(resp.nroconvenio);
        let desde = 1;
        if (resp.nroconvenio > 10) desde = resp.nroconvenio - 10;
        this.formBuscar.controls['desde'].setValue(desde);
        this.buscarConvenios();
      },
      error: (err) => console.error(err.error)
    });
  }

  buscarConvenios(page: number = 0): void {
    this.swbuscando = true;
    this.txtbuscar = 'Buscando';
    this.page = page;
    this.s_loading.showLoading();

    sessionStorage.setItem('desdeconvenio', String(this.formBuscar.value.desde ?? ''));
    sessionStorage.setItem('hastaconvenio', String(this.formBuscar.value.hasta ?? ''));

    const filtros = {
      ...this.getFiltrosBusqueda(),
      page: this.page,
      size: this.size,
    };

    this.convService.buscarConvenios(filtros).subscribe({
      next: (resp) => {
        this._convenios = resp.content || [];
        this.totalPages = resp.totalPages || 0;
        this.totalElements = resp.totalElements || 0;
        this.page = resp.number || 0;
        this.updatePages();
        this.swbuscando = false;
        this.txtbuscar = 'Buscar';
        this.s_loading.hideLoading();
      },
      error: (err) => {
        if (err?.status === 400 && this.canFallbackToDesdeHasta(filtros)) {
          this.buscarConveniosPorRango(filtros.nroDesde!, filtros.nroHasta!);
          return;
        }
        console.error(err);
        this.resetBusqueda();
      }
    });
  }

  public listainicial() {
    sessionStorage.removeItem('desdeconvenio');
    sessionStorage.removeItem('hastaconvenio');
    this.swdesdehasta = false;
    this.formBuscar.patchValue({
      nombre: '',
      estado: '',
      minPendientes: '',
      maxPendientes: '',
      cuenta: '',
    });
    this.ultimoNroconvenio();
  }

  changeDesdeHasta() {
    this.swdesdehasta = true;
  }

  nuevo() {
    this.router.navigate(['add-convenio']);
  }

  info(event: any, idconvenio: number) {
    const tagName = event.target.tagName;
    if (tagName === 'TD') {
      sessionStorage.setItem('idconvenioToInfo', idconvenio.toString());
      this.router.navigate(['info-convenio']);
    }
  }

  public modiConvenio(idconvenio: number) {
    sessionStorage.setItem('idconvenioToModi', idconvenio.toString());
    this.router.navigate(['modi-convenio']);
  }

  anularConvenio(idconvenio: number): void {
    this.router.navigate(['/anular-convenio', idconvenio], {
      queryParams: { modo: 'anular' },
    });
  }

  eliminarConvenio(idconvenio: number): void {
    this.router.navigate(['/anular-convenio', idconvenio], {
      queryParams: { modo: 'eliminar' },
    });
  }

  marcarConvenioPagado(convenio: any): void {
    if (!this.puedeMarcarPagado(convenio)) return;

    Swal.fire({
      title: 'Marcar convenio como pagado',
      text: `¿Desea actualizar el convenio ${convenio?.nroconvenio ?? ''} al estado Pagado?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, marcar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (!result.isConfirmed) return;

      this.s_loading.showLoading();
      this.convService.updateEstado(
        convenio.idconvenio,
        3,
        this.authService.idusuario,
        'Convenio marcado como pagado al tener todas las facturas nuevas cobradas',
        'CAMBIO_DE_ESTADO'
      ).subscribe({
        next: () => {
          this.s_loading.hideLoading();
          Swal.fire('Actualizado', 'El convenio fue marcado como pagado.', 'success');
          this.buscarConvenios(this.page);
        },
        error: (err) => {
          console.error(err);
          this.s_loading.hideLoading();
          Swal.fire('Error', 'No se pudo actualizar el estado del convenio.', 'error');
        }
      });
    });
  }

  imprimir() {
    const conveniosPantalla = this._convenios || [];
    if (!conveniosPantalla.length) {
      alert('No hay convenios para imprimir.');
      return;
    }

    Swal.fire({
      title: 'Imprimir convenios',
      text: 'Seleccione qué desea imprimir.',
      icon: 'question',
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonText: 'Solo pantalla',
      denyButtonText: 'Todos los consultados',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.generarPdfConvenios(conveniosPantalla);
        return;
      }

      if (!result.isDenied) return;

      this.s_loading.showLoading();
      const filtros = this.getFiltrosBusqueda();
      const total = this.totalElements > 0 ? this.totalElements : this.size;

      this.convService.buscarConvenios({
        ...filtros,
        page: 0,
        size: total,
      }).subscribe({
        next: (resp) => {
          this.s_loading.hideLoading();
          this.generarPdfConvenios(resp.content || []);
        },
        error: (err) => {
          console.error(err);
          this.s_loading.hideLoading();
          Swal.fire('Error', 'No se pudieron cargar todos los convenios para imprimir.', 'error');
        }
      });
    });
  }

  onPreviousPage(): void {
    if (this.page > 0) {
      this.buscarConvenios(this.page - 1);
    }
  }

  onNextPage(): void {
    if (this.page + 1 < this.totalPages) {
      this.buscarConvenios(this.page + 1);
    }
  }

  onGoToPage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.buscarConvenios(page);
    }
  }

  updatePages(): void {
    if (this.totalPages <= 0) {
      this.pages = [];
      return;
    }

    const halfRange = Math.floor(this.maxPagesToShow / 2);
    let startPage = Math.max(this.page - halfRange, 0);
    let endPage = Math.min(this.page + halfRange, this.totalPages - 1);

    if (this.page <= halfRange) {
      endPage = Math.min(this.maxPagesToShow - 1, this.totalPages - 1);
    } else if (this.page + halfRange >= this.totalPages) {
      startPage = Math.max(this.totalPages - this.maxPagesToShow, 0);
    }

    this.pages = Array.from(
      { length: endPage - startPage + 1 },
      (_, i) => startPage + i
    );
  }

  getConvenioNombre(convenio: any): string {
    return convenio?.nombre || convenio?.idabonado?.idcliente_clientes?.nombre || '';
  }

  getConvenioCuenta(convenio: any): number | string {
    return convenio?.idabonado?.idabonado || convenio?.idabonado || convenio?.cuenta || '';
  }

  getConvenioPendientes(convenio: any): number {
    return Number(convenio?.facpendientes ?? 0);
  }

  getConvenioPagadas(convenio: any): number {
    return Number(convenio?.facpagadas ?? 0);
  }

  puedeAnular(convenio: any): boolean {
    return Number(convenio?.estado) === 1 && this.getConvenioPagadas(convenio) > 0;
  }

  puedeEliminar(convenio: any): boolean {
    return Number(convenio?.estado) === 1 && this.getConvenioPagadas(convenio) === 0;
  }

  getConvenioTotalFact(convenio: any): number {
    if (convenio?.facnuevas != null) return Number(convenio.facnuevas);
    return this.getConvenioPendientes(convenio) + this.getConvenioPagadas(convenio);
  }

  estaPagadoOListo(convenio: any): boolean {
    if (Number(convenio?.estado) === 3) return true;
    const total = this.getConvenioTotalFact(convenio);
    return total > 0 && this.getConvenioPendientes(convenio) === 0;
  }

  puedeMarcarPagado(convenio: any): boolean {
    return this.estaPagadoOListo(convenio) && Number(convenio?.estado) !== 3;
  }

  getTooltipMarcarPagado(convenio: any): string {
    if (Number(convenio?.estado) === 3) {
      return 'El convenio ya está marcado como pagado.';
    }
    if (this.getConvenioPendientes(convenio) > 0) {
      return 'No se puede marcar como pagado mientras existan cartas pendientes.';
    }
    return 'Marcar convenio como pagado.';
  }

  getConvenioEstadoLabel(estado: number): string {
    switch (Number(estado)) {
      case 1:
        return 'Activo';
      case 2:
        return 'Anulado';
      case 3:
        return 'Pagado';
      case 0:
        return 'Eliminado';
      default:
        return String(estado ?? '');
    }
  }

  getConvenioEstadoClass(estado: number): string {
    switch (Number(estado)) {
      case 1:
        return 'badge-success';
      case 2:
        return 'badge-warning';
      case 3:
        return 'badge-primary';
      case 0:
        return 'badge-danger';
      default:
        return 'badge-secondary';
    }
  }

  private parseNumber(value: any): number | null {
    if (value === null || value === undefined || value === '') return null;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }

  private getFiltrosBusqueda() {
    const nombre = (this.formBuscar.value.nombre ?? '').trim();
    const estado = this.parseNumber(this.formBuscar.value.estado);
    const minPendientes = this.parseNumber(this.formBuscar.value.minPendientes);
    const maxPendientes = this.parseNumber(this.formBuscar.value.maxPendientes);
    const cuenta = this.parseNumber(this.formBuscar.value.cuenta);
    const usarFiltrosDirectosBackend =
      !!nombre || estado != null || minPendientes != null || maxPendientes != null || cuenta != null;

    return {
      nroDesde: usarFiltrosDirectosBackend ? null : this.parseNumber(this.formBuscar.value.desde),
      nroHasta: usarFiltrosDirectosBackend ? null : this.parseNumber(this.formBuscar.value.hasta),
      nombre,
      estado,
      minPendientes,
      maxPendientes,
      cuenta,
    };
  }

  private generarPdfConvenios(convenios: any[]): void {
    if (!convenios.length) {
      Swal.fire('Sin datos', 'No hay convenios para imprimir con ese criterio.', 'info');
      return;
    }

    const doc = new jsPDF('p', 'pt', 'a4');
    this.pdfService.header('Reporte de convenios', doc);

    const body = convenios.map((c: any, index: number) => {
      const fecha = c?.feccrea ? new Date(c.feccrea).toLocaleDateString('es-ES') : '';
      return [
        index + 1,
        c?.nroconvenio ?? '',
        fecha,
        this.getConvenioCuenta(c),
        this.getConvenioNombre(c),
        Number(c?.totalconvenio || 0).toFixed(2),
        c?.cuotas ?? '',
        this.getConvenioPendientes(c),
        this.getConvenioPagadas(c),
        this.getConvenioEstadoLabel(c?.estado),
      ];
    });

    autoTable(doc, {
      startY: 110,
      theme: 'grid',
      head: [[
        '#',
        'Nro',
        'Fecha',
        'Cuenta',
        'Abonado',
        'Total',
        'Cuotas',
        'Pendientes',
        'Pagadas',
        'Estado',
      ]],
      body,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255], halign: 'center' },
    });

    this.pdfService.setfooter(doc);
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  }

  private canFallbackToDesdeHasta(filtros: {
    nroDesde?: number | null;
    nroHasta?: number | null;
    nombre?: string | null;
    estado?: number | null;
    minPendientes?: number | null;
    maxPendientes?: number | null;
    cuenta?: number | null;
  }): boolean {
    const soloRango =
      !!filtros.nroDesde &&
      !!filtros.nroHasta &&
      !filtros.nombre &&
      filtros.estado == null &&
      filtros.minPendientes == null &&
      filtros.maxPendientes == null &&
      filtros.cuenta == null;

    return soloRango;
  }

  private buscarConveniosPorRango(desde: number, hasta: number): void {
    this.convService.conveniosDesdeHasta(desde, hasta).subscribe({
      next: (datos: any) => {
        this._convenios = Array.isArray(datos) ? datos : [];
        this.totalElements = this._convenios.length;
        this.totalPages = this.totalElements > 0 ? 1 : 0;
        this.page = 0;
        this.updatePages();
        this.swbuscando = false;
        this.txtbuscar = 'Buscar';
        this.s_loading.hideLoading();
      },
      error: (err) => {
        console.error(err);
        this.resetBusqueda();
      }
    });
  }

  private resetBusqueda(): void {
    this._convenios = [];
    this.totalPages = 0;
    this.totalElements = 0;
    this.pages = [];
    this.swbuscando = false;
    this.txtbuscar = 'Buscar';
    this.s_loading.hideLoading();
  }
}
