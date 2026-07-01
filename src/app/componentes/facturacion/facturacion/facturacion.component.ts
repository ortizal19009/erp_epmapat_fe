import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FacturacionCuotasPendientes } from 'src/app/interfaces/facturacion/facturacion-cuotas-pendientes';
import { Facturacion } from 'src/app/modelos/facturacion.model';
import { FacturacionService } from 'src/app/servicios/facturacion.service';
import * as ExcelJS from 'exceljs';

@Component({
  selector: 'app-facturacion',
  templateUrl: './facturacion.component.html',
  styleUrls: ['./facturacion.component.css'],
})
export class FacturacionComponent implements OnInit {
  formBuscar: FormGroup;
  _facturacion: any;
  numero: any; //Número enviado como mensaje a eliminar
  rtn: number;
  filtro: string;
  swfiltro: boolean;
  sumtotal: number = 0;
  otraPagina: boolean = false;
  archExportar: string;
  soloPendientesCuotas = false;
  facturacionesPendientes: FacturacionCuotasPendientes[] = [];
  facturacionesPendientesMap = new Map<number, FacturacionCuotasPendientes>();
  totalFacturasPendientes = 0;
  totalValorPendiente = 0;
  page = 1;
  pageSize = 10;
  readonly pageSizeOptions = [10, 25, 50, 100];
  sortColumn = 'idfacturacion';
  sortDirection: 'asc' | 'desc' = 'desc';

  constructor(
    private factuServicio: FacturacionService,
    private router: Router,
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    this.formBuscar = this.fb.group({
      desde: '',
      hasta: '',
      del: '',
      al: '',
      cliente: '',
    });

    this.factuServicio.ultimo().subscribe({
      next: (datos) => {
        let al: string = datos.feccrea.toString().slice(0, 10);
        let del: string = '';
        let fechaRestada: Date;
        fechaRestada = new Date(datos.feccrea);
        fechaRestada.setMonth(fechaRestada.getMonth() - 1);
        del = fechaRestada.toISOString().slice(0, 10);
        let cliente: string = '';
        if (sessionStorage.getItem('clienteFacturacion') != null)
          cliente = sessionStorage.getItem('clienteFacturacion')!;

        this.formBuscar.patchValue({
          desde: '',
          hasta: '',
          del: del,
          al: al,
          cliente: cliente,
        });
        this.buscar();
      },
      error: (err) => console.error(err.error),
    });
  }

  iniDesdeHasta() {
    if (!this.formBuscar.value.cliente) {
      let desde = '';
      if (sessionStorage.getItem('desdeFacturacion') != null)
        desde = sessionStorage.getItem('desdeFacturacion')!;
      this.formBuscar.controls['desde'].setValue(desde);
      let hasta = '';
      if (sessionStorage.getItem('hastaFacturacion') != null)
        hasta = sessionStorage.getItem('hastaFacturacion')!;
      this.formBuscar.controls['hasta'].setValue(hasta);
    }
  }

  public buscar() {
    let desde = this.formBuscar.value.desde;
    let hasta = this.formBuscar.value.hasta;
    let cliente = this.formBuscar.value.cliente;
    sessionStorage.setItem('delFacturacion', this.formBuscar.value.del);
    sessionStorage.setItem('alFacturacion', this.formBuscar.value.al);
    sessionStorage.setItem('clienteFacturacion', this.formBuscar.value.cliente);

    if (this.soloPendientesCuotas) {
      this.buscarPendientesCuotas(desde, hasta, cliente);
      return;
    }

    if (cliente != '' && cliente != null) {
      this.formBuscar.controls['desde'].setValue('');
      this.formBuscar.controls['hasta'].setValue('');
      this.factuServicio
        .getByCliente(
          cliente,
          this.formBuscar.value.del,
          this.formBuscar.value.al
        )
        .subscribe({
          next: (datos) => {
            this._facturacion = datos;
            this.page = 1;
            this.total();
            this.cargarEstadosPendientes('', '', cliente);
          },
          error: (err) => console.error(err.error),
        });
    } else {
      sessionStorage.setItem('desdeFacturacion', this.formBuscar.value.desde);
      sessionStorage.setItem('hastaFacturacion', this.formBuscar.value.hasta);
      if (desde == '' || desde == null) desde = 0;
      if (hasta == '' || hasta == null) hasta = 999999999;
      this.factuServicio
        .getDesdeHasta(
          desde,
          hasta,
          this.formBuscar.value.del,
          this.formBuscar.value.al
        )
        .subscribe({
          next: (datos) => {
            this._facturacion = datos;
            this.page = 1;
            this.total();
            this.cargarEstadosPendientes(desde, hasta, cliente);
          },
          error: (err) => console.error(err.error),
        });
    }
  }

  buscarPendientesCuotas(desde: any, hasta: any, cliente: any) {
    if (desde == '' || desde == null) desde = 0;
    if (hasta == '' || hasta == null) hasta = 999999999;

    this.factuServicio
      .getPendientesCuotas(
        +desde,
        +hasta,
        this.formBuscar.value.del,
        this.formBuscar.value.al,
        cliente
      )
      .subscribe({
        next: (datos) => {
          this.facturacionesPendientes = Array.isArray(datos) ? datos : [];
          this.facturacionesPendientesMap = new Map(
            this.facturacionesPendientes.map((item) => [Number(item.idfacturacion), item])
          );
          this._facturacion = this.facturacionesPendientes;
          this.page = 1;
          this.totalPendientesCuotas();
        },
        error: (err) => console.error(err.error),
      });
  }

  public modificar(idfacturacion: number) {
    this.router.navigate(['modifacturacion', idfacturacion]);
  }

  eliminar(idfacturacion: number, numero: number) {
    localStorage.setItem('ifacturacionToDelete', idfacturacion.toString());
    this.numero = numero;
    this.rtn = 0;
    if (this.numero > 400) {
      this.rtn = 1;
    }
  }

  confirmaEliminar() {
    let idc = localStorage.getItem('ifacturacionToDelete');
    if (idc != null) {
      this.factuServicio.delete(+idc!).subscribe({
        next: (datos) => this.buscar(),
        error: (err) => console.error(err.error),
      });
    }
  }

  public info(facturacion: Facturacion) {
    sessionStorage.setItem(
      'idfacturacionToInfo',
      facturacion.idfacturacion.toString()
    );
    this.router.navigate(['info-facturacion']);
  }

  public nuevo() {
    this.router.navigate(['/add-facturacion']);
  }

  total() {
    let subtotal = 0;
    for (let i = 0; i < this._facturacion.length; i++) {
      subtotal = subtotal + this._facturacion[i].total;
    }
    this.sumtotal = subtotal;
  }

  totalPendientesCuotas() {
    this.totalFacturasPendientes = this.facturacionesPendientes.reduce(
      (acc, item) => acc + Number(item.planillasPendientes || 0),
      0
    );
    this.totalValorPendiente = this.facturacionesPendientes.reduce(
      (acc, item) => acc + Number(item.valorPendiente || 0),
      0
    );
  }

  //Emisiones
  pdf() {
    if (this.soloPendientesCuotas) {
      this.pdfPendientesCuotas();
      return;
    }
    //const nombreEmision = new NombreEmisionPipe(); // Crea una instancia del pipe
    let m_izquierda = 10;
    var doc = new jsPDF();
    doc.setFont('times', 'bold');
    doc.setFontSize(16);
    doc.text('EpmapaT', m_izquierda, 10);
    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.text('FACTURACIÓN', m_izquierda, 16);

    var datos: any = [];
    var i = 0;
    this._facturacion.forEach(() => {
      let fecha = this._facturacion[i].feccrea
        .slice(8, 10)
        .concat(
          '-',
          this._facturacion[i].feccrea.slice(5, 7),
          '-',
          this._facturacion[i].feccrea.slice(0, 4)
        );
      datos.push([
        this._facturacion[i].idfacturacion,
        fecha,
        this.getClientePendiente(this._facturacion[i]),
        this._facturacion[i].descripcion,
        this._facturacion[i].total,
        this._facturacion[i].cuotas,
      ]);
      i++;
    });

    datos.push(['', 'TOTAL', '', '', this.sumtotal]);

    const addPageNumbers = function () {
      const pageCount = doc.internal.pages.length;
      for (let i = 1; i <= pageCount - 1; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.text(
          'Página ' + i + ' de ' + (pageCount - 1),
          m_izquierda,
          doc.internal.pageSize.height - 10
        );
      }
    };

    autoTable(doc, {
      head: [['Nro.', 'Fecha', 'Cliente', 'Descripción', 'Valor', 'Cuotas']],
      theme: 'grid',
      headStyles: {
        fillColor: [68, 103, 114],
        fontStyle: 'bold',
        halign: 'center',
      },
      styles: {
        font: 'helvetica',
        fontSize: 8,
        cellPadding: 1,
        halign: 'center',
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { halign: 'center', cellWidth: 18 },
        2: { halign: 'left', cellWidth: 60 },
        3: { halign: 'left', cellWidth: 80 },
        4: { halign: 'right', cellWidth: 15 },
        5: { halign: 'center', cellWidth: 14 },
      },
      margin: { left: m_izquierda - 1, top: 19, right: 4, bottom: 13 },
      body: datos,

      didParseCell: function (data) {
        var fila = data.row.index;
        var columna = data.column.index;
        if (columna === 4 && data.cell.section === 'body') {
          data.cell.text[0] = formatNumber(+data.cell.raw!);
        }
        if (fila === datos.length - 1) {
          data.cell.styles.fontStyle = 'bold';
        } // Total Bold
      },
    });
    addPageNumbers();

    var opciones = {
      filename: 'lecturas.pdf',
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    };

    if (this.otraPagina) {
      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      const ventana = window.open(url, '_blank');

      // Libera memoria cuando la ventana se cierre
      if (ventana) {
        ventana.addEventListener('unload', () => URL.revokeObjectURL(url));
      }
    }
    else {
      const pdfBlob = doc.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);
      //Si ya existe el <embed> primero lo remueve
      const elementoExistente = document.getElementById('idembed');
      if (elementoExistente) {
        elementoExistente.remove();
      }
      //Crea el <embed>
      var embed = document.createElement('embed');
      embed.setAttribute('src', blobUrl);
      embed.setAttribute('type', 'application/pdf');
      embed.setAttribute('width', '50%');
      embed.setAttribute('height', '100%');
      embed.setAttribute('id', 'idembed');
      //Agrega el <embed> al contenedor del Modal
      var container: any;
      container = document.getElementById('pdf');
      container.appendChild(embed);
    }
  }

  exportar() {
    this.archExportar = this.soloPendientesCuotas
      ? 'Facturacion_Cuotas_Pendientes'
      : 'Facturacion';
  }

  exporta() {
    if (this.soloPendientesCuotas) {
      this.exportaPendientesCuotas();
      return;
    }
    //const nombreEmision = new NombreEmisionPipe(); // Crea una instancia del pipe
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Facturación');

    let titulo = 'Facturación:';
    if (this.formBuscar.value.desde)
      titulo = titulo + ' Desde ' + this.formBuscar.value.desde;
    if (this.formBuscar.value.hasta)
      titulo = titulo + ' Hasta ' + this.formBuscar.value.hasta;
    if (this.formBuscar.value.cliente)
      titulo = titulo + ' Cliente ' + this.formBuscar.value.cliente;
    if (!this.formBuscar.value.desde && !this.formBuscar.value.hasta)
      titulo =
        titulo +
        ' del ' +
        this.formBuscar.value.del +
        ' al ' +
        this.formBuscar.value.al;
    worksheet.addRow(['', '', titulo]);

    // Celda C1
    const cellC1 = worksheet.getCell('C1');
    const customStyle = {
      font: {
        name: 'Times New Roman',
        bold: true,
        size: 14,
        color: { argb: '002060' },
      },
    };
    cellC1.font = customStyle.font;

    worksheet.addRow([]);

    const cabecera = [
      'Nro',
      'Fecha',
      'Cliente',
      'Descripción',
      'Valor',
      'Cuotas',
    ];
    const headerRowCell = worksheet.addRow(cabecera);
    headerRowCell.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '002060' },
      };
      cell.font = {
        bold: true,
        name: 'Times New Roman',
        color: { argb: 'FFFFFF' },
      };
    });

    // Agrega los datos a la hoja de cálculo
    this._facturacion.forEach((item: any) => {
      const row = [
        item.idfacturacion,
        ,
        this.getClientePendiente(item),
        item.descripcion,
        item.total,
        item.cuotas,
      ];
      let fila = worksheet.addRow(row);
      if (item.feccrea != null) {
        let celdaBi = fila.getCell('B'); //Celda de la Fecha
        let año = item.feccrea.toString().slice(0, 4);
        let mes = item.feccrea.toString().slice(5, 7);
        let dia = item.feccrea.toString().slice(8, 10);
        let fecha = `DATE(${año},${mes},${dia})`;
        celdaBi.value = {
          formula: fecha,
          result: 0,
          sharedFormula: undefined,
          date1904: false,
        };
        celdaBi.numFmt = 'dd-mm-yyyy';
      }
    });

    //Coloca la fila del Total
    worksheet.addRow(['', '', 'TOTAL']);
    worksheet.getCell('C' + (this._facturacion.length + 4).toString()).font = {
      bold: true,
    };
    let celdaE = worksheet.getCell(
      'E' + (this._facturacion.length + 4).toString()
    );
    celdaE.numFmt = '#,##0.00';
    celdaE.font = { bold: true };
    celdaE.value = {
      formula:
        'SUM(E4:' + 'E' + (this._facturacion.length + 3).toString() + ')',
      result: 0,
      sharedFormula: undefined,
      date1904: false,
    };

    // Establece el ancho de las columnas
    const anchoConfig = [
      { columnIndex: 2, widthInChars: 12 },
      { columnIndex: 3, widthInChars: 45 },
      { columnIndex: 4, widthInChars: 60 },
      { columnIndex: 5, widthInChars: 10 },
      { columnIndex: 8, widthInChars: 25 },
    ];
    anchoConfig.forEach((config) => {
      worksheet.getColumn(config.columnIndex).width = config.widthInChars;
    });

    // Columnas centradas
    const columnsToCenter = [1, 2, 6];
    columnsToCenter.forEach((columnIndex) => {
      worksheet
        .getColumn(columnIndex)
        .eachCell({ includeEmpty: true }, (cell) => {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        });
    });
    // Columnas a la derecha
    let columnsToRigth = [5];
    columnsToRigth.forEach((columnIndex) => {
      worksheet
        .getColumn(columnIndex)
        .eachCell({ includeEmpty: true }, (cell) => {
          cell.alignment = { horizontal: 'right' };
        });
    });

    // Formato numérico
    const numeroStyle = { numFmt: '#,##0.00' };
    const columnsToFormat = [5];
    for (let i = 4; i <= this._facturacion.length + 3; i++) {
      columnsToFormat.forEach((columnIndex) => {
        const cell = worksheet.getCell(i, columnIndex);
        cell.style = numeroStyle;
      });
    }

    // Crea un archivo Excel
    workbook.xlsx.writeBuffer().then((buffer) => {
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);

      // Crear un enlace para descargar el archivo
      const a = document.createElement('a');
      a.href = url;
      a.download = `${this.archExportar}.xlsx`; // Usa el nombre proporcionado por el usuario
      a.click();

      window.URL.revokeObjectURL(url); // Libera recursos
    });
  }

  togglePendientesCuotas() {
    this.soloPendientesCuotas = !this.soloPendientesCuotas;
    this.buscar();
  }

  get totalRegistros(): number {
    return this.soloPendientesCuotas
      ? this.facturacionesPendientes.length
      : this._facturacion?.length || 0;
  }

  get totalPaginas(): number {
    const total = this.registrosFiltrados.length;
    return total > 0 ? Math.ceil(total / this.pageSize) : 1;
  }

  get registrosFiltrados(): any[] {
    const datos = Array.isArray(this._facturacion) ? [...this._facturacion] : [];
    const filtro = (this.filtro || '').trim().toLowerCase();

    const filtrados = !filtro
      ? datos
      : datos.filter((item) => this.matchesFiltro(item, filtro));

    return filtrados.sort((a, b) => this.compareItems(a, b));
  }

  get registrosPaginados(): any[] {
    const inicio = (this.page - 1) * this.pageSize;
    return this.registrosFiltrados.slice(inicio, inicio + this.pageSize);
  }

  ordenarPor(columna: string) {
    if (this.sortColumn === columna) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = columna;
      this.sortDirection = columna === 'idfacturacion' || columna === 'feccrea' ? 'desc' : 'asc';
    }
    this.page = 1;
  }

  getSortIcon(columna: string): string {
    if (this.sortColumn !== columna) return 'bi-arrow-down-up';
    return this.sortDirection === 'asc' ? 'bi-sort-up' : 'bi-sort-down';
  }

  cambiarPageSize(valor: string) {
    const nuevo = Number(valor);
    if (!Number.isNaN(nuevo) && nuevo > 0) {
      this.pageSize = nuevo;
      this.page = 1;
    }
  }

  cambiarPagina(nuevaPagina: number) {
    if (nuevaPagina < 1 || nuevaPagina > this.totalPaginas) return;
    this.page = nuevaPagina;
  }

  getClientePendiente(item: any): string {
    return item?.cliente ?? item?.nomcli ?? item?.idcliente_clientes?.nombre ?? '';
  }

  getPagadasPendiente(item: any): number {
    return Number(item?.planillasPagadas ?? item?.pagadas ?? 0);
  }

  getPendientesPendiente(item: any): number {
    return Number(item?.planillasPendientes ?? item?.pendientes ?? 0);
  }

  getValorPendientePendiente(item: any): number {
    return Number(item?.valorPendiente ?? item?.totalPendiente ?? item?.pendiente ?? 0);
  }

  getEstadoFacturacion(item: any): string {
    const idfacturacion = Number(item?.idfacturacion ?? 0);
    if (this.facturacionesPendientesMap.has(idfacturacion)) {
      return 'Pendiente';
    }
    return 'Pagada';
  }

  getClaseEstadoFacturacion(item: any): string {
    return this.getEstadoFacturacion(item) === 'Pendiente' ? 'badge badge-warning' : 'badge badge-success';
  }

  private cargarEstadosPendientes(desde: any, hasta: any, cliente: any) {
    let desdeFiltro = desde;
    let hastaFiltro = hasta;
    if (desdeFiltro === '' || desdeFiltro == null) desdeFiltro = 0;
    if (hastaFiltro === '' || hastaFiltro == null) hastaFiltro = 999999999;

    this.factuServicio
      .getPendientesCuotas(
        +desdeFiltro,
        +hastaFiltro,
        this.formBuscar.value.del,
        this.formBuscar.value.al,
        cliente
      )
      .subscribe({
        next: (datos) => {
          const pendientes = Array.isArray(datos) ? datos : [];
          this.facturacionesPendientesMap = new Map(
            pendientes.map((item) => [Number(item.idfacturacion), item])
          );
        },
        error: () => {
          this.facturacionesPendientesMap = new Map();
        },
      });
  }

  private matchesFiltro(item: any, filtro: string): boolean {
    const valores = [
      item?.idfacturacion,
      this.getClientePendiente(item),
      item?.descripcion,
      item?.feccrea,
      item?.total,
      item?.cuotas,
      this.getEstadoFacturacion(item),
      this.getPagadasPendiente(item),
      this.getPendientesPendiente(item),
      this.getValorPendientePendiente(item),
    ];

    return valores.some((valor) =>
      `${valor ?? ''}`.toLowerCase().includes(filtro)
    );
  }

  private compareItems(a: any, b: any): number {
    const valorA = this.getSortValue(a, this.sortColumn);
    const valorB = this.getSortValue(b, this.sortColumn);
    let comparacion = 0;

    if (typeof valorA === 'number' && typeof valorB === 'number') {
      comparacion = valorA - valorB;
    } else {
      comparacion = `${valorA ?? ''}`.localeCompare(`${valorB ?? ''}`, 'es', {
        numeric: true,
        sensitivity: 'base',
      });
    }

    return this.sortDirection === 'asc' ? comparacion : comparacion * -1;
  }

  private getSortValue(item: any, columna: string): string | number {
    switch (columna) {
      case 'idfacturacion':
        return Number(item?.idfacturacion ?? 0);
      case 'feccrea':
        return new Date(item?.feccrea ?? 0).getTime();
      case 'cliente':
        return this.getClientePendiente(item);
      case 'descripcion':
        return item?.descripcion ?? '';
      case 'total':
        return Number(item?.total ?? item?.valorFacturacion ?? 0);
      case 'cuotas':
        return Number(item?.cuotas ?? 0);
      case 'estado':
        return this.getEstadoFacturacion(item);
      case 'pagadas':
        return this.getPagadasPendiente(item);
      case 'pendientes':
        return this.getPendientesPendiente(item);
      case 'valorPendiente':
        return this.getValorPendientePendiente(item);
      default:
        return item?.[columna] ?? '';
    }
  }

  private pdfPendientesCuotas() {
    let m_izquierda = 10;
    const doc = new jsPDF('l');
    doc.setFont('times', 'bold');
    doc.setFontSize(16);
    doc.text('EpmapaT', m_izquierda, 10);
    doc.setFontSize(12);
    doc.text('FACTURACION CON CUOTAS PENDIENTES', m_izquierda, 16);

    const datos = this.facturacionesPendientes.map((item) => [
      item.idfacturacion,
      this.formatFecha(item.feccrea),
      item.cliente,
      item.descripcion,
      Number(item.cuotas || 0),
      Number(item.planillasPagadas || 0),
      Number(item.planillasPendientes || 0),
      Number(item.valorPendiente || 0),
    ]);

    datos.push(['', '', '', 'TOTAL', '', '', this.totalFacturasPendientes, this.totalValorPendiente]);

    autoTable(doc, {
      head: [['Nro.', 'Fecha', 'Cliente', 'Descripcion', 'Cuotas', 'Pagadas', 'Pendientes', 'Valor pendiente']],
      theme: 'grid',
      headStyles: { fillColor: [68, 103, 114], fontStyle: 'bold', halign: 'center' },
      styles: { font: 'helvetica', fontSize: 8, cellPadding: 1, halign: 'center' },
      columnStyles: {
        0: { halign: 'center', cellWidth: 14 },
        1: { halign: 'center', cellWidth: 22 },
        2: { halign: 'left', cellWidth: 65 },
        3: { halign: 'left', cellWidth: 95 },
        4: { halign: 'center', cellWidth: 16 },
        5: { halign: 'center', cellWidth: 18 },
        6: { halign: 'center', cellWidth: 20 },
        7: { halign: 'right', cellWidth: 24 },
      },
      margin: { left: m_izquierda - 1, top: 19, right: 4, bottom: 13 },
      body: datos,
      didParseCell: (data) => {
        const fila = data.row.index;
        if (data.column.index === 7 && data.cell.section === 'body') {
          data.cell.text[0] = formatNumber(+data.cell.raw!);
        }
        if (fila === datos.length - 1) {
          data.cell.styles.fontStyle = 'bold';
        }
      },
    });

    this.abrirPdf(doc, m_izquierda);
  }

  private exportaPendientesCuotas() {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Cuotas pendientes');
    worksheet.addRow(['', '', 'Facturacion con cuotas pendientes']);
    worksheet.getCell('C1').font = {
      name: 'Times New Roman',
      bold: true,
      size: 14,
      color: { argb: '002060' },
    };
    worksheet.addRow([]);

    const cabecera = [
      'Nro',
      'Fecha',
      'Cliente',
      'Descripcion',
      'Cuotas',
      'Pagadas',
      'Pendientes',
      'Valor pendiente',
    ];
    const headerRowCell = worksheet.addRow(cabecera);
    headerRowCell.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '002060' } };
      cell.font = { bold: true, name: 'Times New Roman', color: { argb: 'FFFFFF' } };
    });

    this.facturacionesPendientes.forEach((item) => {
      const fila = worksheet.addRow([
        item.idfacturacion,
        '',
        item.cliente,
        item.descripcion,
        item.cuotas,
        item.planillasPagadas,
        item.planillasPendientes,
        item.valorPendiente,
      ]);
      if (item.feccrea != null) {
        const fecha = new Date(item.feccrea);
        const celda = fila.getCell('B');
        celda.value = fecha;
        celda.numFmt = 'dd-mm-yyyy';
      }
    });

    worksheet.addRow(['', '', '', 'TOTAL', '', '', this.totalFacturasPendientes, this.totalValorPendiente]);
    const totalRow = this.facturacionesPendientes.length + 4;
    worksheet.getCell(`D${totalRow}`).font = { bold: true };
    worksheet.getCell(`G${totalRow}`).font = { bold: true };
    worksheet.getCell(`H${totalRow}`).font = { bold: true };
    worksheet.getCell(`H${totalRow}`).numFmt = '#,##0.00';

    [1, 2, 5, 6, 7].forEach((columnIndex) => {
      worksheet.getColumn(columnIndex).eachCell({ includeEmpty: true }, (cell) => {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });
    });
    [8].forEach((columnIndex) => {
      worksheet.getColumn(columnIndex).eachCell({ includeEmpty: true }, (cell) => {
        cell.alignment = { horizontal: 'right' };
        cell.numFmt = '#,##0.00';
      });
    });
    worksheet.getColumn(2).width = 15;
    worksheet.getColumn(3).width = 38;
    worksheet.getColumn(4).width = 42;
    worksheet.getColumn(8).width = 18;

    workbook.xlsx.writeBuffer().then((buffer) => {
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${this.archExportar}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    });
  }

  private abrirPdf(doc: jsPDF, margenIzq: number) {
    const addPageNumbers = function () {
      const pageCount = doc.internal.pages.length;
      for (let i = 1; i <= pageCount - 1; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.text(
          'Pagina ' + i + ' de ' + (pageCount - 1),
          margenIzq,
          doc.internal.pageSize.height - 10
        );
      }
    };

    addPageNumbers();

    if (this.otraPagina) {
      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      const ventana = window.open(url, '_blank');
      if (ventana) {
        ventana.addEventListener('unload', () => URL.revokeObjectURL(url));
      }
    } else {
      const pdfBlob = doc.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);
      const elementoExistente = document.getElementById('idembed');
      if (elementoExistente) {
        elementoExistente.remove();
      }
      const embed = document.createElement('embed');
      embed.setAttribute('src', blobUrl);
      embed.setAttribute('type', 'application/pdf');
      embed.setAttribute('width', '50%');
      embed.setAttribute('height', '100%');
      embed.setAttribute('id', 'idembed');
      const container: any = document.getElementById('pdf');
      container.appendChild(embed);
    }
  }

  private formatFecha(fecha: Date | string | null | undefined): string {
    if (!fecha) return '';
    const valor = new Date(fecha);
    if (Number.isNaN(valor.getTime())) return '';
    const dia = `${valor.getDate()}`.padStart(2, '0');
    const mes = `${valor.getMonth() + 1}`.padStart(2, '0');
    const anio = valor.getFullYear();
    return `${dia}-${mes}-${anio}`;
  }
}

function formatNumber(num: number) {
  return num.toFixed(2).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
}
