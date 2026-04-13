import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { ColoresService } from 'src/app/compartida/colores.service';
import { Abonados } from 'src/app/modelos/abonados';
import { AbonadosService } from 'src/app/servicios/abonados.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as ExcelJS from 'exceljs';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { CategoriaService } from 'src/app/servicios/categoria.service';
import { RutasService } from 'src/app/servicios/rutas.service';
import { LoadingService } from 'src/app/servicios/loading.service';
import { PageResponse } from 'src/app/interfaces/page-response';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-listar-abonados',
  templateUrl: './listar-abonados.component.html',
  styleUrls: ['./listar-abonados.component.css'],
})
export class ListarAbonadosComponent implements OnInit {
  @ViewChild('importExcelInput') importExcelInputRef!: ElementRef<HTMLInputElement>;
  @ViewChild('btnAbrirPreviewImportacion') btnAbrirPreviewImportacionRef!: ElementRef<HTMLButtonElement>;
  @ViewChild('btnCerrarPreviewImportacion') btnCerrarPreviewImportacionRef!: ElementRef<HTMLButtonElement>;

  // tabla
  _abonados: any[] = [];
  _abonadosOriginal: any[] = [];
  _categorias: any[] = [];
  _rutas: any[] = [];

  // filtros
  filtroEstado: number | null = null;
  filtroCategoria: number | null = null;
  filtroRuta: number | null = null;

  // paginación (solo activa cuando se usan filtros)
  page = 0;
  size = 20;
  totalElements = 0;
  totalPages = 0;
  modoFiltro = false; // true = paginado con filtros, false = búsqueda individual

  // form y UI
  buscarAbonadoForm: FormGroup;
  filterTerm: string = '';
  archExportar: string = '';
  otraPagina: boolean = false;
  pdfAlcance: 'pagina' | 'todos' = 'pagina';
  _campos: any;
  rolepermission = 1;
  ventana = 'abonados';
  importandoExcel = false;
  mensajeImportacion = '';
  detalleImportacion: string[] = [];
  previewImportacion: PreviewImportacionRow[] = [];
  previewImportacionArchivo = '';
  previewPage = 0;
  previewSize = 10;

  readonly PAGE_SIZES = [10, 20, 50, 100];
  readonly PREVIEW_PAGE_SIZES = [10, 20, 50];

  constructor(
    public fb: FormBuilder,
    private aboService: AbonadosService,
    private router: Router,
    public authService: AutorizaService,
    private coloresService: ColoresService,
    private categoriaService: CategoriaService,
    private rutasService: RutasService,
    private loadingService: LoadingService,
  ) { }

  ngOnInit(): void {
    sessionStorage.setItem('ventana', `/${this.ventana}`);
    const coloresJSON = sessionStorage.getItem(`/${this.ventana}`);
    if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
    else this.buscaColor();

    let tipoBusqueda = sessionStorage.getItem('tipoBusqueda') ?? '1';
    let buscaAbonados = sessionStorage.getItem('buscaAbonados') ?? '';
    localStorage.removeItem('idabonadoToFactura');

    if (this.coloresService.rolepermission == null) {
      this.coloresService
        .getRolePermission(this.authService.idusuario, this.ventana)
        .then((rp) => (this.rolepermission = rp))
        .catch(console.error);
    }

    this.buscarAbonadoForm = this.fb.group({
      selecTipoBusqueda: +tipoBusqueda,
      buscarAbonado: [buscaAbonados],
    });

    this.buscarAbonadoForm.get('selecTipoBusqueda')?.valueChanges.subscribe(() => {
      this.buscarAbonadoForm.controls['buscarAbonado'].setValue('');
    });

    if (buscaAbonados !== '') this.onSubmit();
    this.cargarCategorias();
    this.cargarRutas();
  }

  async buscaColor() {
    try {
      const datos = await this.coloresService.setcolor(1, this.ventana);
      sessionStorage.setItem(`/${this.ventana}`, JSON.stringify(datos));
      this.colocaColor(datos);
    } catch (error) { console.error(error); }
  }

  colocaColor(colores: any) {
    document.documentElement.style.setProperty('--bgcolor1', colores[0]);
    document.querySelector('.cabecera')?.classList.add('nuevoBG1');
    document.documentElement.style.setProperty('--bgcolor2', colores[1]);
    document.querySelector('.detalle')?.classList.add('nuevoBG2');
  }

  // =====================
  // BÚSQUEDA INDIVIDUAL
  // =====================
  onSubmit() {
    sessionStorage.setItem('tipoBusqueda', this.buscarAbonadoForm.controls['selecTipoBusqueda'].value.toString());
    sessionStorage.setItem('buscaAbonados', this.buscarAbonadoForm.controls['buscarAbonado'].value.toString());

    this.filtroEstado = null;
    this.filtroCategoria = null;
    this.filtroRuta = null;
    this.modoFiltro = false;
    this._abonados = [];
    this._abonadosOriginal = [];

    const tipo = +this.buscarAbonadoForm.value.selecTipoBusqueda;
    const valor = this.buscarAbonadoForm.value.buscarAbonado;
    if (!valor) return;

    this.loadingService.showLoading();

    const setDatos = (datos: any) => {
      this._abonados = datos;
      this._abonadosOriginal = datos;
      this.loadingService.hideLoading();
    };
    const onError = (e: any) => { console.error(e); this.loadingService.hideLoading(); };

    if (tipo === 1) {
      this.aboService.getResAbonado(+valor).subscribe({ next: setDatos, error: onError });
    } else if (tipo === 2) {
      this.aboService.getResAbonadoNombre(valor).subscribe({ next: setDatos, error: onError });
    } else if (tipo === 3) {
      this.aboService.getResAbonadoIdentificacion(valor).subscribe({ next: setDatos, error: onError });
    } else {
      this.loadingService.hideLoading();
    }
  }

  // =====================
  // FILTROS PAGINADOS
  // =====================
  cargarCategorias() {
    this.categoriaService.getListCategoria().subscribe({
      next: (datos) => this._categorias = datos,
      error: (e) => console.error(e),
    });
  }

  cargarRutas() {
    this.rutasService.getListaRutas().subscribe({
      next: (datos) => this._rutas = datos,
      error: (e) => console.error(e),
    });
  }

  onFiltroEstado() {
    this.filtroCategoria = null;
    this.filtroRuta = null;
    if (this.filtroEstado === null) { this.limpiarFiltros(); return; }
    this.page = 0;
    this.buscarConFiltros();
  }

  onFiltroCategoria() {
    this.filtroEstado = null;
    this.filtroRuta = null;
    if (this.filtroCategoria === null) { this.limpiarFiltros(); return; }
    this.page = 0;
    this.buscarConFiltros();
  }

  onFiltroRuta() {
    this.filtroEstado = null;
    this.filtroCategoria = null;
    if (this.filtroRuta === null) { this.limpiarFiltros(); return; }
    this.page = 0;
    this.buscarConFiltros();
  }

  buscarConFiltros() {
      this.modoFiltro = true;
      this.buscarAbonadoForm.controls['buscarAbonado'].setValue('');
      this._abonadosOriginal = [];
      this.loadingService.showLoading();

      const onSuccess = (resp: PageResponse<Abonados>) => {
        this._abonados = resp.content;
        this.totalElements = resp.totalElements;
        this.totalPages = resp.totalPages;
        this.page = resp.number;
        this.loadingService.hideLoading();
      };
      const onError = (e: any) => { console.error(e); this.loadingService.hideLoading(); };

      if (this.filtroCategoria !== null) {
        this.aboService.getAbonadosByCategoriaPageable(this.filtroCategoria, this.page, this.size)
          .subscribe({ next: onSuccess, error: onError });
      } else if (this.filtroEstado !== null) {
        this.aboService.getAbonadosByEstadoPageable(this.filtroEstado, this.page, this.size)
          .subscribe({ next: onSuccess, error: onError });
      } else if (this.filtroRuta !== null) {
        this.aboService.getAbonadosByRutaPageable(this.filtroRuta, this.page, this.size)
          .subscribe({ next: onSuccess, error: onError });
      } else {
        this.loadingService.hideLoading();
      }
    }


  cambiarPagina(nuevaPagina: number) {
    if (nuevaPagina < 0 || nuevaPagina >= this.totalPages) return;
    this.page = nuevaPagina;
    this.buscarConFiltros();
  }

  cambiarSize(event: Event) {
    this.size = +(event.target as HTMLSelectElement).value;
    this.page = 0;
    this.buscarConFiltros();
  }

  get paginasVisibles(): number[] {
    const rango = 2;
    const inicio = Math.max(0, this.page - rango);
    const fin = Math.min(this.totalPages - 1, this.page + rango);
    return Array.from({ length: fin - inicio + 1 }, (_, i) => inicio + i);
  }

  limpiarFiltros() {
    this.filtroEstado = null;
    this.filtroCategoria = null;
    this.filtroRuta = null;
    this.modoFiltro = false;
    this.totalElements = 0;
    this.totalPages = 0;
    this.page = 0;
    this._abonados = [...this._abonadosOriginal];
    if (this._abonadosOriginal.length === 0) {
      this._abonados = [];
      this.buscarAbonadoForm.controls['buscarAbonado'].setValue('');
    }
  }

  // =====================
  // NAVEGACIÓN
  // =====================
  onNavigationEnd() { this.router.navigate(['/app-listar-abonados']); }
  addAbonadoRouter() { this.router.navigate(['forms-aguatramite', 1]); }

  modificarAbonado(abonado: Abonados) {
    const input = document.getElementById('buscarAbonado') as HTMLInputElement;
    localStorage.setItem('v-buscarAbonado', input.value);
    localStorage.setItem('idabonadoToModi', abonado.idabonado.toString());
    this.router.navigate(['/modificar-abonado']);
  }

  detallesAbonado(abonado: Abonados) {
    sessionStorage.setItem('tipoBusqueda', this.buscarAbonadoForm.controls['selecTipoBusqueda'].value.toString());
    sessionStorage.setItem('buscaAbonados', this.buscarAbonadoForm.controls['buscarAbonado'].value.toString());
    sessionStorage.setItem('padreDetalleAbonado', '1');
    sessionStorage.setItem('idabonadoToFactura', abonado.idabonado.toString());
    this.router.navigate(['detalles-abonado']);
  }

  alerta() {
    const mensaje = localStorage.getItem('mensajeSuccess');
    if (mensaje != null) {
      const divAlerta = document.getElementById('alertaAbonados');
      const alerta = document.createElement('div') as HTMLElement;
      divAlerta?.appendChild(alerta);
      alerta.innerHTML = `<div class='alert alert-success'><strong>EXITO!</strong> <br/>${mensaje}.</div>`;
      setTimeout(() => { divAlerta?.removeChild(alerta); localStorage.removeItem('mensajeSuccess'); }, 2000);
    }
    localStorage.removeItem('mensajeSuccess');
  }

  // =====================
  // PDF / EXPORT
  // =====================
  exportar() { this.archExportar = 'Abonados'; }

  abrirSelectorExcel() {
    this.mensajeImportacion = '';
    this.detalleImportacion = [];
    this.importExcelInputRef?.nativeElement.click();
  }

  async importarGeolocalizaciones(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.importandoExcel = true;
    this.mensajeImportacion = '';
    this.detalleImportacion = [];
    this.loadingService.showLoading();

    try {
      const filas = await this.leerArchivoExcel(file);
      if (filas.length === 0) {
        this.mensajeImportacion = 'El archivo no contiene registros para importar.';
        return;
      }
      this.previewImportacionArchivo = file.name;
      this.previewPage = 0;
      this.previewImportacion = await this.generarPreviewImportacion(filas);
      this.btnAbrirPreviewImportacionRef?.nativeElement.click();
    } catch (error: any) {
      console.error(error);
      this.mensajeImportacion = error?.message || 'No se pudo procesar el archivo Excel.';
    } finally {
      this.importandoExcel = false;
      this.loadingService.hideLoading();
      if (this.importExcelInputRef) this.importExcelInputRef.nativeElement.value = '';
    }
  }

  async confirmarImportacionGeolocalizaciones() {
    const filasActualizar = this.previewImportacion.filter((fila) => fila.estado === 'ACTUALIZAR');
    if (filasActualizar.length === 0) {
      this.mensajeImportacion = 'No hay abonados pendientes por actualizar.';
      return;
    }

    this.importandoExcel = true;
    this.mensajeImportacion = '';
    this.detalleImportacion = [];
    this.loadingService.showLoading();

    try {
      const resultado = await this.actualizarGeolocalizaciones(filasActualizar);
      this.mensajeImportacion =
        `Importación finalizada. Actualizados: ${resultado.actualizados}. Errores: ${resultado.errores.length}.`;
      this.detalleImportacion = resultado.errores;

      if (resultado.actualizados > 0) {
        this.previewImportacion = this.previewImportacion.map((fila) => {
          if (fila.estado !== 'ACTUALIZAR') return fila;
          const errorFila = resultado.errores.find((err) => err.includes(`Cuenta ${fila.idabonado}:`));
          if (errorFila) {
            return { ...fila, estado: 'ERROR', mensaje: errorFila };
          }
          return {
            ...fila,
            geolocalizacionActual: fila.geolocalizacionNueva,
            estado: 'SIN_CAMBIOS',
            mensaje: 'Actualizado correctamente.',
          };
        });
        if (this.modoFiltro) this.buscarConFiltros();
        else if (this.buscarAbonadoForm.value.buscarAbonado) this.onSubmit();
      }

      if (resultado.errores.length === 0) {
        this.btnCerrarPreviewImportacionRef?.nativeElement.click();
      }
    } catch (error: any) {
      console.error(error);
      this.mensajeImportacion = error?.message || 'No se pudo completar la importación.';
    } finally {
      this.importandoExcel = false;
      this.loadingService.hideLoading();
    }
  }

  cambiarPreviewPagina(nuevaPagina: number) {
    if (nuevaPagina < 0 || nuevaPagina >= this.previewTotalPages) return;
    this.previewPage = nuevaPagina;
  }

  cambiarPreviewSize(event: Event) {
    this.previewSize = +(event.target as HTMLSelectElement).value;
    this.previewPage = 0;
  }

  get previewTotalPages(): number {
    return Math.max(1, Math.ceil(this.previewImportacion.length / this.previewSize));
  }

  get previewPaginasVisibles(): number[] {
    const rango = 2;
    const inicio = Math.max(0, this.previewPage - rango);
    const fin = Math.min(this.previewTotalPages - 1, this.previewPage + rango);
    return Array.from({ length: fin - inicio + 1 }, (_, i) => inicio + i);
  }

  get previewImportacionPagina(): PreviewImportacionRow[] {
    const inicio = this.previewPage * this.previewSize;
    return this.previewImportacion.slice(inicio, inicio + this.previewSize);
  }

  get previewTotalRegistros(): number {
    return this.previewImportacion.length;
  }

  get previewTotalActualizar(): number {
    return this.previewImportacion.filter((fila) => fila.estado === 'ACTUALIZAR').length;
  }

  get previewTotalSinCambios(): number {
    return this.previewImportacion.filter((fila) => fila.estado === 'SIN_CAMBIOS').length;
  }

  get previewTotalErrores(): number {
    return this.previewImportacion.filter((fila) => fila.estado === 'ERROR').length;
  }

  pdf() {
    // Si modo filtro y quiere todos, descarga primero y luego genera
    if (this.modoFiltro && this.pdfAlcance === 'todos') {
      this.loadingService.showLoading();
      this.descargarTodosParaPdf().then(todos => {
        this.loadingService.hideLoading();
        this.generarPdf(todos);
      }).catch(e => { console.error(e); this.loadingService.hideLoading(); });
    } else {
      this.generarPdf(this._abonados);
    }
  }

  private async descargarTodosParaPdf(): Promise<any[]> {
    const { firstValueFrom } = await import('rxjs');
    let obs;
    if (this.filtroCategoria !== null) {
      obs = this.aboService.getAbonadosByCategoriaPageable(this.filtroCategoria, 0, this.totalElements);
    } else if (this.filtroEstado !== null) {
      obs = this.aboService.getAbonadosByEstadoPageable(this.filtroEstado, 0, this.totalElements);
    } else if (this.filtroRuta !== null) {
      obs = this.aboService.getAbonadosByRutaPageable(this.filtroRuta, 0, this.totalElements);
    } else {
      return this._abonados;
    }
    const resp = await firstValueFrom(obs);
    return resp.content;
  }

  private generarPdf(datos: any[]) {
    const margenL = 11;
    const margenR = 10;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    // A4 landscape: 841.89 x 595.28 pt
    const pageW = doc.internal.pageSize.getWidth();
    const usable = pageW - margenL - margenR; // ~820pt
    const fecha = new Date().toLocaleDateString('es-EC');

    // Cabecera
    doc.setFont('times', 'bold');
    doc.setFontSize(14);
    doc.text('EpMapa-T', margenL, 22);
    doc.setFontSize(9);
    doc.setFont('times', 'normal');
    doc.text('Empresa Municipal de Alcantarillado y Agua Potable', margenL, 34);
    doc.setFont('times', 'bold');
    doc.setFontSize(11);
    doc.text('LISTADO DE ABONADOS', margenL, 46);

    // Subtítulo con filtro activo
    let subtitulo = '';
    if (this.filtroEstado !== null) {
      const estados: any = { 0: 'Eliminado', 1: 'Activo', 2: 'Suspendido', 3: 'Retirado' };
      subtitulo = `Filtro — Estado: ${estados[this.filtroEstado] ?? this.filtroEstado}`;
    } else if (this.filtroCategoria !== null) {
      const cat = this._categorias.find(c => c.idcategoria === this.filtroCategoria);
      subtitulo = `Filtro — Categoría: ${cat?.descripcion ?? this.filtroCategoria}`;
    } else if (this.filtroRuta !== null) {
      const ruta = this._rutas.find(r => r.idruta === this.filtroRuta);
      subtitulo = `Filtro — Ruta: ${ruta?.descripcion ?? this.filtroRuta}`;
    }

    let startY = 56;
    if (subtitulo) {
      doc.setFontSize(8);
      doc.setFont('times', 'italic');
      doc.text(subtitulo, margenL, 56);
      startY = 64;
    }

    // Fecha y total — alineado a la derecha
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const infoText = `Fecha: ${fecha}   Total: ${datos.length} registros`;
    const infoW = doc.getTextWidth(infoText);
    doc.text(infoText, pageW - margenR - infoW, 22);

    // Normalizar campos (DTO plano o modelo completo)
    const estadoLabel: any = { 0: 'Eliminado', 1: 'Activo', 2: 'Suspendido', 3: 'Retirado' };
    const rows = datos.map((a: any) => [
      a.nombre || a.idresponsable?.nombre || a.idcliente_clientes?.nombre || '',
      a.identificacion || a.idresponsable?.cedula || '',
      String(a.idabonado ?? ''),
      a.categoria || a.idcategoria_categorias?.descripcion || '',
      a.ruta || a.idruta_rutas?.descripcion || '',
      a.direccion || a.direccionubicacion || '',
      estadoLabel[a.estado] ?? String(a.estado ?? ''),
    ]);

    // Anchos proporcionales al usable (suman 100%)
    // Nombre:28% Identif:9% Cuenta:7% Categ:12% Ruta:20% Dirección:18% Estado:6%
    const col = (pct: number) => Math.floor(usable * pct / 100);

    autoTable(doc, {
      startY,
      tableWidth: usable,
      head: [['Nombre', 'Identificación', 'Cuenta', 'Categoría', 'Ruta', 'Dirección', 'Estado']],
      theme: 'grid',
      headStyles: {
        fillColor: [44, 62, 80],
        fontStyle: 'bold',
        halign: 'center',
        fontSize: 7.5,
        cellPadding: 3,
      },
      styles: {
        font: 'helvetica',
        fontSize: 7,
        cellPadding: 2,
        overflow: 'linebreak',
        valign: 'middle',
      },
      columnStyles: {
        0: { halign: 'left',   cellWidth: col(28) },
        1: { halign: 'center', cellWidth: col(9)  },
        2: { halign: 'center', cellWidth: col(7)  },
        3: { halign: 'left',   cellWidth: col(12) },
        4: { halign: 'left',   cellWidth: col(20) },
        5: { halign: 'left',   cellWidth: col(18) },
        6: { halign: 'center', cellWidth: col(6)  },
      },
      margin: { left: margenL, right: margenR, bottom: 20 },
      body: rows,
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 6) {
          const val = String(data.cell.raw ?? '');
          if (val === 'Eliminado')  { data.cell.styles.textColor = [220, 53, 69];  data.cell.styles.fontStyle = 'bold'; }
          else if (val === 'Suspendido' || val === 'Retirado') { data.cell.styles.textColor = [200, 100, 0]; }
          else if (val === 'Activo') { data.cell.styles.textColor = [40, 167, 69]; }
        }
      },
    });

    // Números de página
    const pageCount = (doc.internal as any).getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100);
      doc.text(
        `Página ${i} de ${pageCount}`,
        pageW / 2,
        doc.internal.pageSize.getHeight() - 8,
        { align: 'center' }
      );
      doc.setTextColor(0);
    }

    this.abrirPdf(doc);
  }

  private abrirPdf(doc: jsPDF) {
    if (this.otraPagina) {
      const url = URL.createObjectURL(doc.output('blob'));
      const ventana = window.open(url, '_blank');
      if (ventana) ventana.addEventListener('unload', () => URL.revokeObjectURL(url));
    } else {
      const blobUrl = URL.createObjectURL(doc.output('blob'));
      const existente = document.getElementById('idembed') as HTMLEmbedElement;
      if (existente) { URL.revokeObjectURL(existente.src); existente.remove(); }
      const embed = document.createElement('embed');
      embed.setAttribute('src', blobUrl);
      embed.setAttribute('type', 'application/pdf');
      embed.setAttribute('width', '100%');
      embed.setAttribute('height', '600px');
      embed.setAttribute('id', 'idembed');
      (document.getElementById('pdf') as any).appendChild(embed);
    }
  }

  exporta() {
    this.aboService.getCampos().subscribe({
      next: (datos) => {
        this._campos = datos;
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Abonados');
        worksheet.addRow(['Abonados']);
        const font = { name: 'Times New Roman', bold: true, size: 14, color: { argb: '002060' } };
        worksheet.getCell('A1').font = font;
        worksheet.getCell('C1').font = font;
        worksheet.addRow([]);
        const cabecera = ['Cuenta', 'Nombre', 'Identificación', 'Dirección', 'Dirección Ubicación', 'Teléfono', 'F.Nacimiento', 'e-mail'];
        const headerRow = worksheet.addRow(cabecera);
        headerRow.eachCell((cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '002060' } };
          cell.font = { bold: true, name: 'Times New Roman', color: { argb: 'FFFFFF' } };
        });
        this._campos.forEach((a: any) => {
          worksheet.addRow([a.idabonado, a.nombre, a.cedula, a.direccion, a.direccionubicacion, a.telefono, a.fechanacimiento, a.email]);
        });
        [10, 50, 14, 50, 50, 20, 12, 40].forEach((w, i) => { worksheet.getColumn(i + 1).width = w; });
        [3, 6, 7].forEach((col) => {
          worksheet.getColumn(col).eachCell({ includeEmpty: true }, (cell) => {
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
          });
        });
        workbook.xlsx.writeBuffer().then((buffer) => {
          const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url; a.download = `${this.archExportar}.xlsx`; a.click();
          window.URL.revokeObjectURL(url);
        });
      },
      error: (err) => console.error(err.error),
    });
  }

  private async leerArchivoExcel(file: File): Promise<Array<{ idabonado: number; geolocalizacion: string }>> {
    const buffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) {
      throw new Error('No se encontró la primera hoja del archivo.');
    }

    const filas: Array<{ idabonado: number; geolocalizacion: string }> = [];

    worksheet.eachRow((row, rowNumber) => {
      const idRaw = row.getCell(1).value;
      const geoRaw = row.getCell(2).value;

      const idabonado = this.parseNumeroExcel(idRaw);
      const geolocalizacion = this.parseTextoExcel(geoRaw);

      if (rowNumber === 1) {
        const encabezadoId = this.parseTextoExcel(idRaw).toLowerCase();
        const encabezadoGeo = this.parseTextoExcel(geoRaw).toLowerCase();
        const pareceEncabezado =
          encabezadoId.includes('idabonado') || encabezadoGeo.includes('geolocalizacion');
        if (pareceEncabezado) return;
      }

      if (!idabonado && !geolocalizacion) return;

      if (!idabonado || !geolocalizacion) {
        this.detalleImportacion.push(`Fila ${rowNumber}: idabonado o geolocalización inválidos.`);
        return;
      }

      filas.push({ idabonado, geolocalizacion });
    });

    return filas;
  }

  private async actualizarGeolocalizaciones(
    filas: Array<{ idabonado: number; geolocalizacionNueva: string }>
  ): Promise<{ actualizados: number; errores: string[] }> {
    let actualizados = 0;
    const errores = [...this.detalleImportacion];

    for (const fila of filas) {
      try {
        const abonado: any = await firstValueFrom(this.aboService.getById(fila.idabonado));
        abonado.geolocalizacion = fila.geolocalizacionNueva;
        abonado.usumodi = this.authService.idusuario;
        abonado.fecmodi = new Date();
        await firstValueFrom(this.aboService.updateAbonado(abonado));
        actualizados++;
      } catch (error: any) {
        console.error(`Error actualizando abonado ${fila.idabonado}`, error);
        errores.push(
          `Cuenta ${fila.idabonado}: ${error?.error?.message || error?.error?.detail || 'no se pudo actualizar.'}`
        );
      }
    }

    return { actualizados, errores };
  }

  private async generarPreviewImportacion(
    filas: Array<{ idabonado: number; geolocalizacion: string }>
  ): Promise<PreviewImportacionRow[]> {
    const preview = await Promise.all(
      filas.map(async (fila, index) => {
        try {
          const abonado: any = await firstValueFrom(this.aboService.getById(fila.idabonado));
          const geolocalizacionActual = this.parseTextoExcel(abonado?.geolocalizacion);
          const geolocalizacionNueva = fila.geolocalizacion;
          const cambia = geolocalizacionActual !== geolocalizacionNueva;

          return {
            fila: index + 2,
            idabonado: fila.idabonado,
            nombre: abonado?.nombre || abonado?.idresponsable?.nombre || abonado?.idcliente_clientes?.nombre || '',
            geolocalizacionActual,
            geolocalizacionNueva,
            estado: cambia ? 'ACTUALIZAR' : 'SIN_CAMBIOS',
            mensaje: cambia ? 'Se actualizará la geolocalización.' : 'La geolocalización ya coincide.',
          } as PreviewImportacionRow;
        } catch (error: any) {
          return {
            fila: index + 2,
            idabonado: fila.idabonado,
            nombre: '',
            geolocalizacionActual: '',
            geolocalizacionNueva: fila.geolocalizacion,
            estado: 'ERROR',
            mensaje: error?.error?.message || error?.error?.detail || 'No se encontró el abonado.',
          } as PreviewImportacionRow;
        }
      })
    );

    return preview;
  }

  private parseNumeroExcel(value: any): number {
    if (value == null) return 0;
    if (typeof value === 'number') return Number(value);
    const texto = this.parseTextoExcel(value).replace(/[^0-9.-]/g, '');
    return Number(texto || 0);
  }

  private parseTextoExcel(value: any): string {
    if (value == null) return '';
    if (typeof value === 'object' && 'text' in value) return String((value as any).text || '').trim();
    if (typeof value === 'object' && 'result' in value) return String((value as any).result || '').trim();
    return String(value).trim();
  }
}

interface PreviewImportacionRow {
  fila: number;
  idabonado: number;
  nombre: string;
  geolocalizacionActual: string;
  geolocalizacionNueva: string;
  estado: 'ACTUALIZAR' | 'SIN_CAMBIOS' | 'ERROR';
  mensaje: string;
}
