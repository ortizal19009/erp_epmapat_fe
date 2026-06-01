import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { ColoresService } from 'src/app/compartida/colores.service';
import { EmisionAuditService } from 'src/app/servicios/emision-audit.service';
import { PdfService } from 'src/app/servicios/pdf.service';

interface ControlEmisionRow {
  idauditoria: number | null;
  idemision: number | null;
  emision: string;
  accion: string;
  fecha: string | null;
  usuario: string;
  estadoAnterior: string;
  estadoNuevo: string;
  documento: string;
  referenciaDocumento: string;
  motivo: string;
  ip: string;
  equipo: string;
  facturasActualizadas: number;
  rubrosActualizados: number;
  totalRutas: number;
  rutasActualizadas: number;
  origen: string;
  detalle: any;
}

@Component({
  selector: 'app-control-emisiones',
  templateUrl: './control-emisiones.component.html',
  styleUrls: ['./control-emisiones.component.css'],
})
export class ControlEmisionesComponent implements OnInit {
  formFiltros!: FormGroup;
  cargando = false;
  error = '';
  filasBase: ControlEmisionRow[] = [];
  filasFiltradas: ControlEmisionRow[] = [];
  filasPagina: ControlEmisionRow[] = [];
  filtroGeneral = '';
  currentPage = 1;
  pageSize = 10;
  readonly pageSizeOptions = [10, 20, 50];
  totalPages = 1;
  totalElements = 0;
  sortColumn: keyof ControlEmisionRow = 'fecha';
  sortDirection: 'asc' | 'desc' = 'desc';
  resumen = {
    total: 0,
    anulaciones: 0,
    reaperturas: 0,
    eliminaciones: 0,
  };
  detalleSeleccionado: ControlEmisionRow | null = null;

  constructor(
    private fb: FormBuilder,
    private coloresService: ColoresService,
    public authService: AutorizaService,
    private emisionAuditService: EmisionAuditService,
    private pdfService: PdfService
  ) {}

  ngOnInit(): void {
    sessionStorage.setItem('ventana', '/control-emisiones');
    const coloresJSON = sessionStorage.getItem('/control-emisiones') || sessionStorage.getItem('/emisiones');
    if (coloresJSON) {
      this.colocaColor(JSON.parse(coloresJSON));
    } else {
      this.buscaColor();
    }

    const hoy = new Date();
    const anio = hoy.getFullYear();
    const mes = `${hoy.getMonth() + 1}`.padStart(2, '0');
    const dia = `${hoy.getDate()}`.padStart(2, '0');
    const hoyTexto = `${anio}-${mes}-${dia}`;

    this.formFiltros = this.fb.group({
      idemision: [''],
      accion: ['TODAS'],
      desde: [`${anio}-01-01`],
      hasta: [hoyTexto],
    });

    this.cargarRegistros();
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
        'emisiones'
      );
      const coloresJSON = JSON.stringify(datos);
      sessionStorage.setItem('/control-emisiones', coloresJSON);
      this.colocaColor(datos);
    } catch (error) {
      console.error(error);
    }
  }

  cargarRegistros(): void {
    this.cargando = true;
    this.error = '';

    const filtros = this.formFiltros.value;
    const idemision = filtros.idemision ? Number(filtros.idemision) : null;
    const accion = filtros.accion && filtros.accion !== 'TODAS' ? filtros.accion : null;

    this.emisionAuditService
      .listar({
        idemision,
        accion,
        desde: filtros.desde || null,
        hasta: filtros.hasta || null,
      })
      .subscribe({
        next: (resp) => {
          this.filasBase = this.normalizarRespuesta(resp);
          this.currentPage = 1;
          this.aplicarFiltrosLocales();
          this.cargando = false;
        },
        error: (err) => {
          console.error('No se pudo cargar el monitoreo de emisiones', err);
          this.error = 'No se pudo cargar el detalle de anulaciones y reaperturas.';
          this.filasBase = [];
          this.aplicarFiltrosLocales();
          this.cargando = false;
        },
      });
  }

  limpiarFiltros(): void {
    const hoy = new Date();
    const anio = hoy.getFullYear();
    const mes = `${hoy.getMonth() + 1}`.padStart(2, '0');
    const dia = `${hoy.getDate()}`.padStart(2, '0');
    this.formFiltros.patchValue({
      idemision: '',
      accion: 'TODAS',
      desde: `${anio}-01-01`,
      hasta: `${anio}-${mes}-${dia}`,
    });
    this.filtroGeneral = '';
    this.currentPage = 1;
    this.cargarRegistros();
  }

  onFiltroGeneralChange(): void {
    this.currentPage = 1;
    this.aplicarFiltrosLocales();
  }

  cambiarTamanoPagina(): void {
    this.currentPage = 1;
    this.recalcularVista();
  }

  cambiarPagina(delta: number): void {
    const nueva = this.currentPage + delta;
    if (nueva >= 1 && nueva <= this.totalPages) {
      this.currentPage = nueva;
      this.paginar();
    }
  }

  irPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPages) {
      this.currentPage = pagina;
      this.paginar();
    }
  }

  paginasVisibles(): number[] {
    const inicio = Math.max(1, this.currentPage - 2);
    const fin = Math.min(this.totalPages, inicio + 4);
    const paginas: number[] = [];
    for (let i = inicio; i <= fin; i++) {
      paginas.push(i);
    }
    return paginas;
  }

  toggleSort(columna: keyof ControlEmisionRow): void {
    if (this.sortColumn === columna) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = columna;
      this.sortDirection = 'asc';
    }
    this.recalcularVista();
  }

  getSortIcon(columna: keyof ControlEmisionRow): string {
    if (this.sortColumn !== columna) {
      return 'fa fa-sort text-muted';
    }
    return this.sortDirection === 'asc' ? 'fa fa-sort-up' : 'fa fa-sort-down';
  }

  verDetalle(fila: ControlEmisionRow): void {
    this.detalleSeleccionado = fila;
  }

  abrirReporte(): void {
    const doc = new jsPDF('l', 'pt', 'a4');
    this.pdfService.header('Monitoreo de emisiones - anulaciones y reaperturas', doc);

    const body = this.filasFiltradas.map((fila) => [
      fila.idemision ?? '',
      fila.emision,
      fila.accion,
      this.formatFecha(fila.fecha),
      fila.usuario,
      fila.estadoAnterior,
      fila.estadoNuevo,
      fila.documento,
      fila.referenciaDocumento,
      fila.motivo,
    ]);

    autoTable(doc, {
      startY: 100,
      head: [[
        'Id',
        'Emision',
        'Accion',
        'Fecha',
        'Usuario',
        'Estado anterior',
        'Estado nuevo',
        'Documento',
        'Referencia',
        'Motivo',
      ]],
      body,
      styles: {
        fontSize: 7,
        cellPadding: 2,
        overflow: 'linebreak',
      },
    });

    this.pdfService.setfooter(doc);
    const blobUrl = URL.createObjectURL(doc.output('blob'));
    const pdfViewer: any = document.getElementById('pdfViewer');
    if (pdfViewer) {
      pdfViewer.src = blobUrl;
    }
  }

  private aplicarFiltrosLocales(): void {
    const filtro = this.filtroGeneral.trim().toLowerCase();
    this.filasFiltradas = this.filasBase.filter((fila) => {
      if (!filtro) {
        return true;
      }

      const texto = [
        fila.idemision,
        fila.emision,
        fila.accion,
        fila.usuario,
        fila.estadoAnterior,
        fila.estadoNuevo,
        fila.documento,
        fila.referenciaDocumento,
        fila.motivo,
        fila.ip,
        fila.equipo,
        this.formatFecha(fila.fecha),
      ]
        .map((v) => `${v ?? ''}`.toLowerCase())
        .join(' ');

      return texto.includes(filtro);
    });

    this.recalcularResumen();
    this.currentPage = Math.min(this.currentPage, Math.max(1, Math.ceil(this.filasFiltradas.length / this.pageSize)));
    this.recalcularVista();
  }

  private recalcularResumen(): void {
    this.resumen.total = this.filasFiltradas.length;
    this.resumen.anulaciones = this.filasFiltradas.filter((f) => f.accion === 'ANULAR').length;
    this.resumen.reaperturas = this.filasFiltradas.filter((f) => f.accion === 'REABRIR').length;
    this.resumen.eliminaciones = this.filasFiltradas.filter((f) => f.accion === 'ELIMINAR').length;
  }

  private recalcularVista(): void {
    const ordenadas = [...this.filasFiltradas].sort((a, b) =>
      this.compararValores(a[this.sortColumn], b[this.sortColumn], this.sortDirection)
    );
    this.filasFiltradas = ordenadas;
    this.totalElements = ordenadas.length;
    this.totalPages = Math.max(1, Math.ceil(this.totalElements / this.pageSize));
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }
    this.paginar();
  }

  private paginar(): void {
    const inicio = (this.currentPage - 1) * this.pageSize;
    this.filasPagina = this.filasFiltradas.slice(inicio, inicio + this.pageSize);
  }

  private normalizarRespuesta(resp: any): ControlEmisionRow[] {
    const lista = Array.isArray(resp)
      ? resp
      : Array.isArray(resp?.data)
      ? resp.data
      : Array.isArray(resp?.auditoria)
      ? resp.auditoria
      : [];

    return lista
      .map((item: any) => this.normalizarFila(item))
      .sort((a: ControlEmisionRow, b: ControlEmisionRow) =>
        this.compararValores(a.fecha, b.fecha, 'desc')
      );
  }

  private normalizarFila(item: any): ControlEmisionRow {
    const detalle = this.parseDetalle(item?.detalle ?? item?.objectJson ?? item?.json ?? item?.payload);
    const accion = `${item?.accion ?? detalle?.accion ?? ''}`.toUpperCase();
    const jsonNuevo = detalle?.json_nuevo ?? {};
    const resumen = detalle?.resumen ?? {};
    const emision = detalle?.emision ?? {};

    return {
      idauditoria: item?.idauditoria ?? item?.idaudit ?? item?.id ?? null,
      idemision: this.toNumber(item?.idregistro ?? item?.entidadId ?? detalle?.idregistro ?? emision?.idemision),
      emision: `${item?.emision ?? emision?.emision ?? detalle?.emisionCodigo ?? ''}`,
      accion,
      fecha: item?.fecha ?? item?.fecmodi ?? detalle?.fecha ?? null,
      usuario: `${item?.usuario ?? item?.usumodi ?? detalle?.usuario ?? ''}`,
      estadoAnterior: this.estadoTexto(item?.estadoAnterior ?? detalle?.estado_anterior ?? emision?.estado_anterior),
      estadoNuevo: this.estadoTexto(item?.estadoNuevo ?? detalle?.estado_nuevo ?? emision?.estado_nuevo ?? jsonNuevo?.estado),
      documento: `${item?.documento ?? detalle?.documento ?? jsonNuevo?.documentoAnulacion ?? ''}`,
      referenciaDocumento: `${item?.referenciaDocumento ?? detalle?.referencia_documento ?? jsonNuevo?.referenciaDocumentoAnulacion ?? ''}`,
      motivo: `${item?.motivo ?? detalle?.observacion ?? item?.observacion ?? detalle?.mensaje ?? ''}`,
      ip: `${item?.ip ?? detalle?.ip ?? ''}`,
      equipo: `${item?.equipo ?? detalle?.equipo ?? ''}`,
      facturasActualizadas: this.toNumber(item?.facturasActualizadas ?? jsonNuevo?.facturasActualizadas ?? resumen?.facturas) || 0,
      rubrosActualizados: this.toNumber(item?.rubrosActualizados ?? jsonNuevo?.rubrosActualizados) || 0,
      totalRutas: this.toNumber(item?.totalRutas ?? resumen?.rutas) || 0,
      rutasActualizadas: this.toNumber(item?.rutasActualizadas) || 0,
      origen: `${item?.origen ?? item?.entidad ?? ''}`,
      detalle,
    };
  }

  private parseDetalle(valor: any): any {
    if (!valor) {
      return {};
    }
    if (typeof valor === 'string') {
      try {
        return JSON.parse(valor);
      } catch {
        return { texto: valor };
      }
    }
    return valor;
  }

  private compararValores(a: any, b: any, dir: 'asc' | 'desc'): number {
    const va = this.normalizarValor(a);
    const vb = this.normalizarValor(b);
    let result = 0;
    if (va < vb) result = -1;
    if (va > vb) result = 1;
    return dir === 'asc' ? result : -result;
  }

  private normalizarValor(valor: any): any {
    if (valor === null || valor === undefined || valor === '') {
      return '';
    }
    if (typeof valor === 'number') {
      return valor;
    }
    const fecha = new Date(valor);
    if (!Number.isNaN(fecha.getTime())) {
      return fecha.getTime();
    }
    const numero = Number(valor);
    if (!Number.isNaN(numero) && `${valor}`.trim() !== '') {
      return numero;
    }
    return `${valor}`.toLowerCase();
  }

  private toNumber(valor: any): number | null {
    if (valor === null || valor === undefined || valor === '') {
      return null;
    }
    const numero = Number(valor);
    return Number.isNaN(numero) ? null : numero;
  }

  formatFecha(valor: string | null): string {
    if (!valor) {
      return '';
    }
    const fecha = new Date(valor);
    if (Number.isNaN(fecha.getTime())) {
      return `${valor}`;
    }
    return fecha.toLocaleString();
  }

  estadoTexto(estado: any): string {
    const valor = Number(estado);
    if (estado === 'ANULADA') {
      return 'Anulada';
    }
    if (Number.isNaN(valor)) {
      return `${estado ?? ''}`.trim();
    }
    switch (valor) {
      case 0:
        return 'Abierta';
      case 1:
        return 'Cerrada';
      case 2:
        return 'Reabierta';
      case 3:
        return 'Anulada';
      default:
        return `${estado}`;
    }
  }
}
