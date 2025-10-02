import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import jsPDF from 'jspdf';
import { ColoresService } from 'src/app/compartida/colores.service';
import { Abonados } from 'src/app/modelos/abonados';
import { Documentos } from 'src/app/modelos/administracion/documentos.model';
import { Clientes } from 'src/app/modelos/clientes';
import { Facxremi } from 'src/app/modelos/coactivas/facxremi';
import { Remision } from 'src/app/modelos/coactivas/remision';
import { FacxremiService } from 'src/app/servicios/coactivas/facxremi.service';
import { RemisionService } from 'src/app/servicios/coactivas/remision.service';
import { LoadingService } from 'src/app/servicios/loading.service';
import { PdfService } from 'src/app/servicios/pdf.service';
import { RemisionReportsService } from './imp-remision/remision-reports.service';

@Component({
  selector: 'app-remision',
  templateUrl: './remision.component.html',
  styleUrls: ['./remision.component.css'],
})
export class RemisionComponent implements OnInit {
  f_buscar: FormGroup;
  f_reporte: FormGroup;
  filtro: string;
  _facturas: any;
  today: Date = new Date();
  _remisiones: any;
  modalSize: string = 'md';
  swimprimir: boolean = true;
  remisionDetalles: Remision = new Remision();
  fac_anteriores: any;
  fac_nuevas: any;
  _cliente: Clientes = new Clientes();
  _abonado: Abonados = new Abonados();
  _documentos: Documentos = new Documentos();

  /* variables para hacer la paginación  */
  page: number = 0;
  size: number = 10;
  _cuentasPageables?: any;
  totalPages: number = 0; // Total de páginas
  pages: number[] = []; // Lista de números de página
  maxPagesToShow: number = 5; // Máximo número de botones a mostrar
  totalElements: number = 20;

  constructor(
    private fb: FormBuilder,
    private coloresService: ColoresService,
    private s_remision: RemisionService,
    private s_pdf: PdfService,
    private sanitizer: DomSanitizer,
    private s_loader: LoadingService,
    private s_facxremi: FacxremiService,
    private s_remisionPdf: RemisionReportsService
  ) { }

  ngOnInit(): void {
    sessionStorage.setItem('ventana', '/cv-facturas');
    let coloresJSON = sessionStorage.getItem('/cv-facturas');
    if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
    else this.buscaColor();
    let d = this.today.toISOString().slice(0, 10);
    this.f_buscar = this.fb.group({
      sDate: d,
      desde: d,
      hasta: d,
      filtro: '',
    });
    this.f_reporte = this.fb.group(
      {
        d: ['', Validators.required],
        h: ['', Validators.required],
      },
      { validators: this.validarFechas }
    );
    this.f_reporte.patchValue({
      d: d,
      h: d,
    });
    this.getAllRemisiones(this.page, this.size);
  }
  onChangeDate(e: any) { }
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
  getAllRemisiones(page: number, size: number) {
    this.s_remision.getAllRemisiones(page, size).subscribe({
      next: (datos: any) => {
        this._remisiones = datos.content;
        this.size = datos.size;
        this.page = datos.pageable.pageNumber;
        this.totalPages = datos.totalPages;
        this.totalElements = datos.totalElemets;
        this.updatePages();
      },
      error: (e: any) => console.error(e),
    });
  }
  /* Inicio de configuracion de paginacion */
  onPreviousPage(): void {
    if (this.page > 0) {
      this.getAllRemisiones(this.page - 1, this.size);
    }
  }
  onNextPage(): void {
    if (this.page <= this.totalPages - 1) {
      this.getAllRemisiones(this.page + 1, this.size);
    }
  }
  onGoToPage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.getAllRemisiones(page, this.size);
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
  getRemByFeccrea() {
    this.s_loader.showLoading();
    this.swimprimir = false;
    let f = this.f_reporte.value;
    this.s_remision.getByFechacrea(f.d, f.h).subscribe({
      next: (datos: any) => {
        this._remisiones = datos;
        this.imprimir();
      },
      error: (e: any) => console.error(e),
    });
  }

  // Validador personalizado para fechas
  validarFechas(group: FormGroup): { [key: string]: boolean } | null {
    let d = group.get('d')!.value;
    let h = group.get('h')!.value;

    // Verificar que ambas fechas tengan valores
    if (!d || !h) {
      return null; // No hay error si alguna fecha está vacía
    }

    // Convertir las fechas a objetos Date
    const fechaInicio = new Date(d);
    const fechaFin = new Date(h);

    // Verificar que las fechas sean válidas
    if (isNaN(fechaInicio.getTime()) || isNaN(fechaFin.getTime())) {
      return { fechaInvalida: true }; // Fechas inválidas
    }

    // Verificar que la fecha de inicio no sea mayor que la fecha de fin
    if (fechaInicio > fechaFin) {
      return { fechaInvalida: true }; // Fecha de inicio mayor que fecha de fin
    }

    return null; // No hay error
  }

  async getRemisionById(remision: any) {
    this.fac_anteriores = [];
    this.fac_nuevas = [];
    this.modalSize = 'xl';
    this.remisionDetalles = remision;
    this._cliente = remision.idcliente_clientes;
    this._abonado = remision.idabonado_abonados;
    this._documentos = remision.iddocumento_documentos;
    let id = remision.idremision;
    this.fac_anteriores = await this.getDetalleRemision(id, 1);
    this.fac_nuevas = await this.getDetalleRemision(id, 2);
  }

  async getDetalleRemision(idremision: number, tipfac: number) {
    let respuesta: any = await this.s_facxremi.getByRemision(
      idremision,
      tipfac
    );
    return respuesta;
  }
  async imprimir() {
    this.modalSize = 'lg';
    let doc = new jsPDF();
    let header: any = [
      ['Cliente', 'Identificación', 'Cuenta', 'Cuotas', 'Capital', 'Intereses'],
    ];
    let body: any = [];
    this.s_pdf.header('Reporte de remisiones', doc);
    this._remisiones.forEach((item: any) => {
      body.push([
        item.idcliente_clientes.nombre,
        item.idcliente_clientes.cedula,
        item.idabonado_abonados.idabonado,
        item.cuotas,
        item.totcapital.toFixed(2),
        item.totintereses.toFixed(2),
      ]);
    });
    this.s_loader.hideLoading();
    await this.s_pdf.bodyOneTable(
      'Remision Intereses, Multas y Recargos',
      header,
      body,
      doc
    );
  }
  impContrato() {
    let doc = new jsPDF();
    this.s_remisionPdf.genContratoRemision(
      doc,
      this.remisionDetalles,
      this.fac_nuevas
    );
  }
  /* Fin de configuracion de paginacion */
}
