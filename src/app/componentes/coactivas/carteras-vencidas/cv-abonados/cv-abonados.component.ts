import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import autoTable from 'jspdf-autotable';
import jsPDF from 'jspdf';
import { ColoresService } from 'src/app/compartida/colores.service';
import { CategoriaService } from 'src/app/servicios/categoria.service';
import { FacturaService } from 'src/app/servicios/factura.service';
import { LoadingService } from 'src/app/servicios/loading.service';
import { PdfService } from 'src/app/servicios/pdf.service';
import { RutasService } from 'src/app/servicios/rutas.service';

@Component({
  selector: 'app-cv-abonados',
  templateUrl: './cv-abonados.component.html',
  styleUrls: ['./cv-abonados.component.css']
})
export class CvAbonadosComponent implements OnInit {
  f_buscar: FormGroup;
  filtro = '';
  today: Date = new Date();
  abonados: any[] = [];
  categorias: any[] = [];
  rutas: any[] = [];
  facturas: any[] = [];
  totalFacturas = 0;
  totalIntereses = 0;
  totalDeuda = 0;
  cuentaSeleccionada: number | null = null;
  abonadoSeleccionado: any = null;
  nombreModal = '';
  swfacturas = true;
  idplanilla = 0;

  estados = [
    { id: 1, descripcion: 'Activo' },
    { id: 2, descripcion: 'Suspendido' },
    { id: 3, descripcion: 'Retirado' },
    { id: 0, descripcion: 'Eliminado' }
  ];

  page = 0;
  size = 20;
  totalPages = 0;
  totalElements = 0;
  pages: number[] = [];
  maxPagesToShow = 5;
  sortColumn = 'valor';
  sortDirection: 'asc' | 'desc' = 'desc';

  constructor(
    private coloresService: ColoresService,
    private fb: FormBuilder,
    private facturaService: FacturaService,
    private categoriaService: CategoriaService,
    private rutasService: RutasService,
    private loadingService: LoadingService,
    private pdfService: PdfService
  ) { }

  ngOnInit(): void {
    sessionStorage.setItem('ventana', '/cv-abonados');
    const coloresJSON = sessionStorage.getItem('/cv-abonados');
    if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
    else this.buscaColor();

    const d = this.today.toISOString().slice(0, 10);
    this.f_buscar = this.fb.group({
      sDate: d,
      tipoFiltro: 'estado',
      estado: 1,
      idcategoria: null,
      idruta: null,
      filtro: ''
    });

    this.f_buscar.get('tipoFiltro')?.valueChanges.subscribe((tipo) => {
      this.resetValoresFiltro(tipo);
    });

    this.cargarCatalogos();
    this.buscar();
  }

  colocaColor(colores: any) {
    document.documentElement.style.setProperty('--bgcolor1', colores[0]);
    document.querySelector('.cabecera')?.classList.add('nuevoBG1');
    document.documentElement.style.setProperty('--bgcolor2', colores[1]);
    document.querySelector('.detalle')?.classList.add('nuevoBG2');
  }

  async buscaColor() {
    try {
      const datos = await this.coloresService.setcolor(1, 'cv-abonados');
      sessionStorage.setItem('/cv-abonados', JSON.stringify(datos));
      this.colocaColor(datos);
    } catch (error) {
      console.error(error);
    }
  }

  cargarCatalogos() {
    this.categoriaService.getListCategoria().subscribe({
      next: (datos) => {
        this.categorias = datos || [];
        if (this.f_buscar?.value?.tipoFiltro === 'categoria' && !this.f_buscar.value.idcategoria && this.categorias.length) {
          this.f_buscar.patchValue({ idcategoria: this.categorias[0].idcategoria }, { emitEvent: false });
        }
      },
      error: (e) => console.error(e)
    });
    this.rutasService.getListaRutas().subscribe({
      next: (datos) => {
        this.rutas = datos || [];
        if (this.f_buscar?.value?.tipoFiltro === 'ruta' && !this.f_buscar.value.idruta && this.rutas.length) {
          this.f_buscar.patchValue({ idruta: this.rutas[0].idruta }, { emitEvent: false });
        }
      },
      error: (e) => console.error(e)
    });
  }

  resetValoresFiltro(tipo: string) {
    this.f_buscar.patchValue({
      estado: tipo === 'estado' ? 1 : null,
      idcategoria: tipo === 'categoria' ? this.categorias?.[0]?.idcategoria ?? null : null,
      idruta: tipo === 'ruta' ? this.rutas?.[0]?.idruta ?? null : null,
    }, { emitEvent: false });
  }

  get filtrosRequest() {
    const tipo = this.f_buscar.value.tipoFiltro;
    return {
      estado: tipo === 'estado' ? this.f_buscar.value.estado : null,
      idcategoria: tipo === 'categoria' ? this.f_buscar.value.idcategoria : null,
      idruta: tipo === 'ruta' ? this.f_buscar.value.idruta : null,
    };
  }

  buscar(page: number = 0) {
    this.page = page;
    this.loadingService.showLoading();
    this.facturaService.getCVAbonados(this.f_buscar.value.sDate, this.page, this.size, this.filtrosRequest)
      .subscribe({
        next: (resp: any) => {
          this.abonados = resp.content || [];
          this.page = resp.pageable?.pageNumber ?? resp.number ?? 0;
          this.size = resp.size ?? this.size;
          this.totalPages = resp.totalPages ?? 0;
          this.totalElements = resp.totalElements ?? 0;
          this.updatePages();
          this.loadingService.hideLoading();
        },
        error: (e) => {
          console.error(e);
          this.loadingService.hideLoading();
        }
      });
  }

  onBuscar() {
    this.swfacturas = true;
    this.buscar(0);
  }

  verFacturas(abonado: any) {
    this.swfacturas = true;
    this.abonadoSeleccionado = abonado;
    this.cuentaSeleccionada = abonado.cuenta;
    this.nombreModal = `Facturas pendientes de la cuenta ${abonado.cuenta}`;
    this.totalFacturas = 0;
    this.totalIntereses = 0;
    this.totalDeuda = 0;
    this.facturas = [];
    this.loadingService.showLoading();

    this.facturaService.getCvFacturasByAbonado(abonado.cuenta, this.f_buscar.value.sDate)
      .subscribe({
        next: (datos: any) => {
          this.facturas = datos || [];
          this.totalFacturas = this.facturas.reduce((acc: number, item: any) => acc + Number(item.total || 0), 0);
          this.totalIntereses = this.facturas.reduce((acc: number, item: any) => acc + Number(item.interes || 0), 0);
          this.totalDeuda = this.facturas.reduce((acc: number, item: any) => acc + Number(item.totaldeuda || (Number(item.total || 0) + Number(item.interes || 0))), 0);
          this.loadingService.hideLoading();
        },
        error: (e) => {
          console.error(e);
          this.loadingService.hideLoading();
        }
      });
  }

  getDetallePlanilla(idplanilla: number) {
    this.idplanilla = idplanilla;
    this.swfacturas = false;
  }

  onPreviousPage(): void {
    if (this.page > 0) this.buscar(this.page - 1);
  }

  onNextPage(): void {
    if (this.page < this.totalPages - 1) this.buscar(this.page + 1);
  }

  onGoToPage(page: number): void {
    if (page >= 0 && page < this.totalPages) this.buscar(page);
  }

  updatePages(): void {
    const halfRange = Math.floor(this.maxPagesToShow / 2);
    let startPage = Math.max(this.page - halfRange, 0);
    let endPage = Math.min(this.page + halfRange, this.totalPages - 1);

    if (this.page <= halfRange) {
      endPage = Math.min(this.maxPagesToShow - 1, this.totalPages - 1);
    } else if (this.page + halfRange >= this.totalPages) {
      startPage = Math.max(this.totalPages - this.maxPagesToShow, 0);
    }

    this.pages = Array.from({ length: Math.max(endPage - startPage + 1, 0) }, (_, i) => startPage + i);
  }

  getEstadoDescripcion(estado: number): string {
    return this.estados.find((item) => item.id === estado)?.descripcion ?? `${estado ?? ''}`;
  }

  ordenarPor(columna: string) {
    if (this.sortColumn === columna) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
      return;
    }
    this.sortColumn = columna;
    this.sortDirection = columna === 'valor' || columna === 'interes' || columna === 'totaldeuda' || columna === 'facturas' || columna === 'cuenta' ? 'desc' : 'asc';
  }

  get sortedAbonados(): any[] {
    const factor = this.sortDirection === 'asc' ? 1 : -1;
    return [...this.abonados].sort((a, b) => {
      const valueA = this.getSortValue(a, this.sortColumn);
      const valueB = this.getSortValue(b, this.sortColumn);

      if (valueA == null && valueB == null) return 0;
      if (valueA == null) return -1 * factor;
      if (valueB == null) return 1 * factor;

      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return (valueA - valueB) * factor;
      }

      return String(valueA).localeCompare(String(valueB), 'es', { sensitivity: 'base' }) * factor;
    });
  }

  getSortValue(item: any, column: string): string | number | null {
    switch (column) {
      case 'cuenta': return Number(item.cuenta ?? 0);
      case 'responsable': return item.responsable ?? '';
      case 'identificacion': return item.identificacion ?? '';
      case 'categoria': return item.categoria ?? '';
      case 'ruta': return item.ruta ?? '';
      case 'estado': return this.getEstadoDescripcion(item.estado);
      case 'facturas': return Number(item.facturas ?? 0);
      case 'valor': return Number(item.valor ?? 0);
      case 'interes': return Number(item.interes ?? 0);
      case 'totaldeuda': return Number(item.totaldeuda ?? (Number(item.valor ?? 0) + Number(item.interes ?? 0)));
      default: return item?.[column] ?? null;
    }
  }

  getSortIcon(column: string): string {
    if (this.sortColumn !== column) return 'fa fa-sort';
    return this.sortDirection === 'asc' ? 'fa fa-sort-asc' : 'fa fa-sort-desc';
  }

  imprimirListado() {
    this.loadingService.showLoading();
    const total = this.totalElements > 0 ? this.totalElements : this.abonados.length || this.size;

    this.facturaService.getCVAbonados(this.f_buscar.value.sDate, 0, total, this.filtrosRequest)
      .subscribe({
        next: (resp: any) => {
          const datos = (resp?.content || [])
            .filter((abonado: any) => this.cumpleFiltroTexto(abonado));

          this.loadingService.hideLoading();
          this.generarPdfListado(datos);
        },
        error: (e) => {
          console.error(e);
          this.loadingService.hideLoading();
        }
      });
  }

  imprimirNotificacionDeuda() {
    if (!this.abonadoSeleccionado || !this.facturas.length) return;

    const abonado = this.abonadoSeleccionado;
    const fechaCorte = this.form_buscarFecha;
    const doc = new jsPDF('l', 'pt', 'a4');
    this.pdfService.header('Notificacion de deuda pendiente', doc);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    const texto = [
      `Abonado: ${abonado.responsable ?? ''}`,
      `Cuenta: ${abonado.cuenta ?? ''}    Identificacion: ${abonado.identificacion ?? ''}`,
      `Categoria: ${abonado.categoria ?? ''}    Ruta: ${abonado.ruta ?? ''}    Estado: ${this.getEstadoDescripcion(abonado.estado)}`,
      '',
      `Por medio de la presente se notifica que, al ${fechaCorte}, mantiene obligaciones pendientes de pago con la Empresa Publica Municipal de Agua Potable y Alcantarillado.`,
      `Se registra un total de ${abonado.facturas ?? 0} factura(s) pendientes con capital de $ ${Number(abonado.valor ?? 0).toFixed(2)}, intereses de $ ${Number(abonado.interes ?? 0).toFixed(2)} y una deuda acumulada de $ ${Number(abonado.totaldeuda ?? (Number(abonado.valor ?? 0) + Number(abonado.interes ?? 0))).toFixed(2)}.`,
      'Se solicita regularizar estos valores a la brevedad posible para evitar recargos y las acciones administrativas o coactivas correspondientes.'
    ];

    let y = 105;
    texto.forEach((linea) => {
      const lineas = doc.splitTextToSize(linea, 760);
      doc.text(lineas, 30, y);
      y += (lineas.length * 14);
    });

    autoTable(doc, {
      startY: y + 10,
      theme: 'grid',
      margin: { top: 85, left: 20, right: 20, bottom: 20 },
      tableWidth: 'auto',
      head: [[
        '#',
        'Planilla',
        'Modulo',
        'Fecha',
        'Valor',
        'Interes',
        'Total deuda'
      ]],
      body: this.facturas.map((factura: any, index: number) => ([
        index + 1,
        factura.factura ?? '',
        factura.modulo ?? '',
        factura.feccrea ?? '',
        Number(factura.total ?? 0).toFixed(2),
        Number(factura.interes ?? 0).toFixed(2),
        Number(factura.totaldeuda ?? (Number(factura.total ?? 0) + Number(factura.interes ?? 0))).toFixed(2),
      ])),
      foot: [[
        '',
        '',
        '',
        'Totales',
        this.totalFacturas.toFixed(2),
        this.totalIntereses.toFixed(2),
        this.totalDeuda.toFixed(2)
      ]],
      styles: { fontSize: 7, cellPadding: 1.5, overflow: 'linebreak' },
      headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255], halign: 'center' },
      footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 18, halign: 'center' },
        1: { cellWidth: 65, halign: 'center' },
        2: { cellWidth: 200 },
        3: { cellWidth: 70, halign: 'center' },
        4: { cellWidth: 55, halign: 'right' },
        5: { cellWidth: 55, halign: 'right' },
        6: { cellWidth: 65, halign: 'right' },
      }
    });

    const finalY = (doc as any).lastAutoTable?.finalY ?? (y + 80);
    doc.text('Atentamente,', 30, finalY + 35);
    doc.text('EPMAPA-T', 30, finalY + 65);

    this.pdfService.setfooter(doc);
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  }

  private cumpleFiltroTexto(abonado: any): boolean {
    const filtro = (this.filtro ?? '').trim().toLowerCase();
    if (!filtro) return true;

    const texto = [
      abonado?.cuenta,
      abonado?.responsable,
      abonado?.identificacion,
      abonado?.categoria,
      abonado?.ruta,
      this.getEstadoDescripcion(abonado?.estado),
      abonado?.facturas,
      abonado?.valor,
      abonado?.interes,
      abonado?.totaldeuda
    ].join(' ').toLowerCase();

    return texto.includes(filtro);
  }

  get form_buscarFecha(): string {
    const fecha = this.f_buscar?.value?.sDate;
    if (!fecha) return '';
    const [anio, mes, dia] = String(fecha).split('-');
    return `${dia}/${mes}/${anio}`;
  }

  private generarPdfListado(datos: any[]) {
    if (!datos.length) return;

    const ordenados = this.ordenarColeccion(datos);
    const doc = new jsPDF('l', 'pt', 'a4');
    this.pdfService.header('Cartera vencida por abonados', doc);

    const body = ordenados.map((abonado: any, index: number) => ([
      index + 1,
      abonado.cuenta ?? '',
      abonado.responsable ?? '',
      abonado.identificacion ?? '',
      abonado.categoria ?? '',
      abonado.ruta ?? '',
      this.getEstadoDescripcion(abonado.estado),
      Number(abonado.facturas ?? 0),
      Number(abonado.valor ?? 0).toFixed(2),
      Number(abonado.interes ?? 0).toFixed(2),
      Number(abonado.totaldeuda ?? (Number(abonado.valor ?? 0) + Number(abonado.interes ?? 0))).toFixed(2),
    ]));

    autoTable(doc, {
      startY: 95,
      theme: 'grid',
      margin: { top: 85, left: 20, right: 20, bottom: 20 },
      head: [[
        '#',
        'Cuenta',
        'Responsable',
        'Identificacion',
        'Categoria',
        'Ruta',
        'Estado',
        'Facturas',
        'Valor',
        'Interes',
        'Total deuda',
      ]],
      body,
      styles: { fontSize: 7, cellPadding: 1.5 },
      headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255], halign: 'center' },
      columnStyles: {
        0: { cellWidth: 20, halign: 'center' },
        1: { cellWidth: 55, halign: 'center' },
        2: { cellWidth: 150 },
        3: { cellWidth: 80, halign: 'center' },
        4: { cellWidth: 70 },
        5: { cellWidth: 70 },
        6: { cellWidth: 60, halign: 'center' },
        7: { cellWidth: 55, halign: 'center' },
        8: { cellWidth: 60, halign: 'right' },
        9: { cellWidth: 60, halign: 'right' },
        10: { cellWidth: 70, halign: 'right' },
      },
      foot: [[
        '',
        '',
        '',
        '',
        '',
        '',
        'Total',
        `${ordenados.reduce((acc, item) => acc + Number(item.facturas ?? 0), 0)}`,
        `${ordenados.reduce((acc, item) => acc + Number(item.valor ?? 0), 0).toFixed(2)}`,
        `${ordenados.reduce((acc, item) => acc + Number(item.interes ?? 0), 0).toFixed(2)}`,
        `${ordenados.reduce((acc, item) => acc + Number(item.totaldeuda ?? (Number(item.valor ?? 0) + Number(item.interes ?? 0))), 0).toFixed(2)}`,
      ]],
      footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' }
    });

    this.pdfService.setfooter(doc);
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  }

  private ordenarColeccion(items: any[]): any[] {
    const factor = this.sortDirection === 'asc' ? 1 : -1;
    return [...items].sort((a, b) => {
      const valueA = this.getSortValue(a, this.sortColumn);
      const valueB = this.getSortValue(b, this.sortColumn);

      if (valueA == null && valueB == null) return 0;
      if (valueA == null) return -1 * factor;
      if (valueB == null) return 1 * factor;

      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return (valueA - valueB) * factor;
      }

      return String(valueA).localeCompare(String(valueB), 'es', { sensitivity: 'base' }) * factor;
    });
  }
}
