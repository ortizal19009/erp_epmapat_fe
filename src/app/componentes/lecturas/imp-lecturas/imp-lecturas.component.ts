import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { ColoresService } from 'src/app/compartida/colores.service';
import { NombreEmisionPipe } from 'src/app/pipes/nombre-emision.pipe';
import { CategoriaService } from 'src/app/servicios/categoria.service';
import { LecturasService } from 'src/app/servicios/lecturas.service';
import { RutasxemisionService } from 'src/app/servicios/rutasxemision.service';
import * as ExcelJS from 'exceljs';
import { forkJoin } from 'rxjs';
import { PdfService } from 'src/app/servicios/pdf.service';

@Component({
  selector: 'app-imp-lecturas',
  templateUrl: './imp-lecturas.component.html',
  styleUrls: ['./imp-lecturas.component.css'],
})
export class ImpLecturasComponent implements OnInit {
  rutaxemision = {} as Rutaxemision;
  idrutaxemision: number;
  _rutaxemision: any;
  formImprimir: FormGroup;
  _lecturas: any;
  summ3: number;
  sumarecaudar: number;
  _categorias: any;
  otrapagina: boolean = false;
  swimprimir: boolean = true;
  nombrearchivo: string;

  constructor(
    private coloresService: ColoresService,
    public authService: AutorizaService,
    public fb: FormBuilder,
    private rutaxemiService: RutasxemisionService,
    private router: Router,
    private lecService: LecturasService,
    private catService: CategoriaService,
    private pdf: PdfService
  ) {}

  ngOnInit(): void {
    sessionStorage.setItem('ventana', '/lecturas');
    let coloresJSON = sessionStorage.getItem('/lecturas');
    if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
    else this.buscaColor();

    this.idrutaxemision = +sessionStorage.getItem('idrutaxemisionToLectura')!;
    this.rutaxemisionDatos(this.idrutaxemision);

    this.formImprimir = this.fb.group(
      {
        reporte: 0,
        nombrearchivo: 'Lecturas',
        otrapagina: '',
      },
      // { updateOn: "blur" }
    );

    //this.formImprimir.get('reporte')!.setValue('Lecturas');
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
        'lecturas',
      );
      const coloresJSON = JSON.stringify(datos);
      sessionStorage.setItem('/lecturas', coloresJSON);
      this.colocaColor(datos);
    } catch (error) {
      console.error(error);
    }
  }

  impriexpor() {
    this.swimprimir = !this.swimprimir;
  }

  rutaxemisionDatos(idrutaxemision: number) {
    this.rutaxemiService.getById(idrutaxemision).subscribe({
      next: (datos) => {
        this._rutaxemision = datos;
        this.rutaxemision.emision = datos.idemision_emisiones.emision;
        this.rutaxemision.ruta = datos.idruta_rutas.descripcion;
        this.rutaxemision.estado = datos.estado;
      },
      error: (err) => console.error(err.error),
    });
  }

  retornar() {
    this.router.navigate(['/lecturas']);
  }

  imprimir() {
    const reporte: number = Number(this.formImprimir.value.reporte);
    console.log('reporte:', reporte);

    switch (reporte) {
      case 0: {
        // Lecturas
        this.lecService.getLecturas(this.idrutaxemision).subscribe({
          next: (datos) => {
            this._lecturas = datos;
            if (this.swimprimir) this.imprimirLecturas();
            else this.exporta();
          },
          error: (err) => console.error(err.error),
        });
        break;
      }

      case 1: {
        // Totales por categoría
        this.catService.listaCategorias().subscribe({
          next: (datos) => {
            this._categorias = datos;
            this.imprimirTotales();
          },
          error: (err) => console.error(err.error),
        });
        break;
      }

      case 2: {
        this.lecService.get_Lecturas(this.idrutaxemision).subscribe({
          next: (datos: any[]) => {
            const peticiones$ = datos.map((i: any) => {
              const body = {
                m3: (i.lecturaactual ?? 0) - (i.lecturaanterior ?? 0),
                categoria: i.idcategoria,
                swMunicipio: i.idabonado_abonados?.municipio,
                swAdultoMayor: i.idabonado_abonados?.adultomayor,
                swAguapotable: i.idabonado_abonados?.swalcantarillado,
              };

              return this.lecService.getValoresSimulados_asyc(body);
            });
            forkJoin(peticiones$).subscribe({
              next: (resultados: any[]) => {
                const acumulado = resultados.reduce(
                  (acc: any, curr: any) => {
                    Object.keys(curr).forEach((key) => {
                      const valor = curr[key];

                      if (typeof valor === 'number') {
                        // suma
                        acc.sumas[key] = (acc.sumas[key] ?? 0) + valor;

                        // conteo (solo si valor > 0)
                        if (valor > 0) {
                          acc.contadores[key] = (acc.contadores[key] ?? 0) + 1;
                        }
                      }
                    });
                    return acc;
                  },
                  { sumas: {}, contadores: {} },
                );

                // armar objeto final: rubro -> { valor, conteo }
                const resumen: any = {};
                const keys = new Set([
                  ...Object.keys(acumulado.sumas),
                  ...Object.keys(acumulado.contadores),
                ]);

                keys.forEach((key) => {
                  const suma = acumulado.sumas[key] ?? 0;
                  const conteo = acumulado.contadores[key] ?? 0;

                  resumen[key] = {
                    valor: Number(suma.toFixed(2)),
                    conteo: conteo,
                  };
                });

                console.log('RESUMEN:', resumen);
                this.generarReporteRubrosPDF(resumen, {
                  titulo: 'EPMAPA-T - Resumen de Rubros',
                  nombreArchivo: 'resumen_rubros.pdf',
                });
              },
              error: (err) => console.error(err),
            });
          },
          error: (err) => console.error(err?.error ?? err),
        });

        break;
      }

      default: {
        console.warn('Reporte no reconocido:', reporte);
        break;
      }
    }
  }

  generarReporteRubrosPDF(
    data: Record<string, { valor: number; conteo: number }>,
    opts?: { titulo?: string; fecha?: string; nombreArchivo?: string },
  ) {
    const doc = new jsPDF('p', 'mm', 'a4');

    const titulo = opts?.titulo ?? 'REPORTE DE RUBROS PRE EMISION';
    const fecha = opts?.fecha ?? new Date().toLocaleString();
    const nombreArchivo = opts?.nombreArchivo ?? 'reporte_rubros.pdf';

    // Encabezado
    doc.setFontSize(14);
    doc.text(titulo, 14, 16);

    doc.setFontSize(10);
    doc.text(`Fecha: ${fecha}`, 14, 22);

    // Convertir a filas
    const filas = Object.entries(data)
      .map(([rubro, info]) => ({
        rubro,
        valor: info.valor ?? 0,
        conteo: info.conteo ?? 0,
      }))
      // opcional: ordenar por rubro, o por valor desc
      .sort((a, b) => b.valor - a.valor);

    // Si quieres que "Total" vaya al final:
    const totalIndex = filas.findIndex(
      (f) => f.rubro.toLowerCase() === 'total',
    );
    let filaTotal: any = null;
    if (totalIndex >= 0) {
      filaTotal = filas.splice(totalIndex, 1)[0];
    }

    const currency = (n: number) =>
      new Intl.NumberFormat('es-EC', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(n);

    const body = filas.map((f) => [
      f.rubro,
      currency(f.valor),
      String(f.conteo),
    ]);

    // si hay total, añadirlo al final (y lo destacamos luego)
    if (filaTotal) {
      body.push([
        filaTotal.rubro,
        currency(filaTotal.valor),
        String(filaTotal.conteo),
      ]);
    }

    autoTable(doc, {
      startY: 28,
      head: [['Rubro', 'Valor', 'Conteo']],
      body,
      styles: { fontSize: 10, cellPadding: 2 },
      headStyles: { fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 95 },
        1: { halign: 'right', cellWidth: 45 },
        2: { halign: 'center', cellWidth: 30 },
      },
      didParseCell: (hookData) => {
        // resaltar la fila Total si existe (última fila)
        const isLastRow = hookData.row.index === body.length - 1;
        if (filaTotal && isLastRow) {
          hookData.cell.styles.fontStyle = 'bold';
        }
      },
    });
    this.pdf.setfooter(doc);

    // Pie
    const finalY = (doc as any).lastAutoTable?.finalY ?? 28;
    doc.setFontSize(9);
    doc.text('Generado por el sistema *No esta calculado el valor de las multas', 14, finalY + 10);

    //doc.save(nombreArchivo);
    this.muestraPDF(doc);
  }

  imprimirLecturas() {
    this.otrapagina = this.formImprimir.value.otrapagina;
    const nombreEmision = new NombreEmisionPipe();
    let m_izquierda = 12;
    var doc = new jsPDF();
    doc.setFont('times', 'bold');
    doc.setFontSize(16);
    doc.text('EpmapaT', m_izquierda, 10);
    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.text('LECTURAS', m_izquierda, 16);
    doc.setFont('times', 'bold');
    doc.setFontSize(11);
    doc.text('Emisión: ', m_izquierda, 20);
    doc.setFont('times', 'normal');
    doc.setFontSize(11);
    doc.text(
      nombreEmision.transform(this.rutaxemision.emision),
      m_izquierda + 16,
      20,
    );
    doc.setFont('times', 'bold');
    doc.setFontSize(11);
    doc.text('Ruta:', m_izquierda, 24);
    doc.setFont('times', 'normal');
    doc.setFontSize(11);
    doc.text(this.rutaxemision.ruta.toString(), m_izquierda + 12, 24);

    var datos: any = [];
    let suma: number = 0;
    let arecaudar: number = 0;
    var i = 0;
    this._lecturas.forEach(() => {
      datos.push([
        this._lecturas[i].idabonado_abonados.idabonado,
        this._lecturas[i].idabonado_abonados.idcliente_clientes.nombre,
        this._lecturas[i].idabonado_abonados.idcategoria_categorias.descripcion,
        this._lecturas[i].lecturaanterior,
        this._lecturas[i].lecturaactual,
        this._lecturas[i].lecturaactual - this._lecturas[i].lecturaanterior,
        this._lecturas[i].total1,
        this._lecturas[i].idnovedad_novedades.descripcion,
      ]);
      suma +=
        this._lecturas[i].lecturaactual - this._lecturas[i].lecturaanterior;
      arecaudar += this._lecturas[i].total1;
      i++;
    });
    this.summ3 = suma;
    this.sumarecaudar = arecaudar;

    datos.push([
      '',
      'TOTAL',
      '',
      '',
      '',
      this.summ3.toLocaleString('en-US'),
      this.sumarecaudar.toLocaleString('en-US'),
    ]);
    const addPageNumbers = function () {
      const pageCount = doc.internal.pages.length;
      for (let i = 1; i <= pageCount - 1; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.text(
          'Página ' + i + ' de ' + (pageCount - 1),
          m_izquierda,
          doc.internal.pageSize.height - 10,
        );
      }
    };

    autoTable(doc, {
      head: [
        [
          'Cta',
          'Responsable',
          'Categoría',
          'Anterior',
          'Actual',
          'Cnsm',
          'A recaudar',
          'Novedades',
        ],
      ],
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
        0: { halign: 'center', cellWidth: 12 },
        1: { halign: 'left', cellWidth: 65 },
        2: { halign: 'left', cellWidth: 22 },
        3: { halign: 'right', cellWidth: 17 },
        4: { halign: 'right', cellWidth: 17 },
        5: { halign: 'right', cellWidth: 10 },
        6: { halign: 'right', cellWidth: 18 },
        7: { halign: 'left', cellWidth: 32 },
      },
      margin: { left: m_izquierda - 1, top: 26, right: 6, bottom: 13 },
      body: datos,

      didParseCell: function (data) {
        var fila = data.row.index;
        var columna = data.column.index;
        if (columna > 0 && typeof data.cell.raw === 'number') {
          data.cell.text = [data.cell.raw.toLocaleString('en-US')];
        }
        // if (columna === 6 && +data.cell.raw! > 4) {
        //   data.cell.styles.fontStyle = 'bold';
        //   data.cell.styles.textColor = [255, 0, 0];
        // };
        if (fila === datos.length - 1) {
          data.cell.styles.fontStyle = 'bold';
        } // Total Bold
      },
    });
    addPageNumbers();

    this.muestraPDF(doc);
  }

  imprimirTotales() {
    this.otrapagina = this.formImprimir.value.otrapagina;
    const nombreEmision = new NombreEmisionPipe();
    let m_izquierda = 30;
    var doc = new jsPDF();
    doc.setFont('times', 'bold');
    doc.setFontSize(16);
    doc.text('EpmapaT', m_izquierda, 10);
    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.text('TOTALES POR CATEGORÍA', m_izquierda, 16);
    doc.setFont('times', 'bold');
    doc.setFontSize(11);
    doc.text('Emisión: ', m_izquierda, 20);
    doc.setFont('times', 'normal');
    doc.setFontSize(11);
    doc.text(
      nombreEmision.transform(this.rutaxemision.emision),
      m_izquierda + 16,
      20,
    );
    doc.setFont('times', 'bold');
    doc.setFontSize(11);
    doc.text('Ruta:', m_izquierda, 24);
    doc.setFont('times', 'normal');
    doc.setFontSize(11);
    doc.text(this.rutaxemision.ruta.toString(), m_izquierda + 12, 24);

    let datos: any = [];
    let i = 0;
    this._categorias.forEach(() => {
      datos.push([this._categorias[i], 0, 0.0]);
      // suma += this._lecturas[i].lecturaactual - this._lecturas[i].lecturaanterior;
      // arecaudar += this._lecturas[i].total1;
      i++;
    });
    // this.summ3 = suma;
    // this.sumarecaudar = arecaudar;

    // datos.push(['', 'TOTAL', '', '', '', this.summ3.toLocaleString('en-US'), this.sumarecaudar.toLocaleString('en-US')]);
    datos.push(['TOTAL', '', '']);

    autoTable(doc, {
      head: [['Categoria', 'Consumo', 'A recaudar']],
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
        0: { halign: 'left', cellWidth: 40 },
        1: { halign: 'right', cellWidth: 20 },
        2: { halign: 'right', cellWidth: 30 },
      },
      margin: { left: m_izquierda - 1, top: 26, right: 91, bottom: 13 },
      body: datos,

      didParseCell: function (data) {
        var fila = data.row.index;
        var columna = data.column.index;
        if (columna > 0 && typeof data.cell.raw === 'number') {
          data.cell.text = [data.cell.raw.toLocaleString('en-US')];
        }
        if (fila === datos.length - 1) {
          data.cell.styles.fontStyle = 'bold';
        } // Total Bold
      },
    });
    // addPageNumbers();

    this.muestraPDF(doc);
  }

  muestraPDF(doc: any) {
    var opciones = {
      filename: 'lecturas.pdf',
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    };
    if (this.otrapagina) doc.output('dataurlnewwindow', opciones);
    else {
      const pdfDataUri = doc.output('datauristring');
      //Si ya existe el <embed> primero lo remueve
      const elementoExistente = document.getElementById('idembed');
      if (elementoExistente) {
        elementoExistente.remove();
      }
      //Crea el <embed>
      var embed = document.createElement('embed');
      embed.setAttribute('src', pdfDataUri);
      embed.setAttribute('type', 'application/pdf');
      embed.setAttribute('width', '70%');
      embed.setAttribute('height', '100%');
      embed.setAttribute('id', 'idembed');
      //Agrega el <embed> al contenedor del Modal
      var container: any;
      container = document.getElementById('pdf');
      container.appendChild(embed);
    }
  }

  // exportar() { this.archExportar = 'Lecturas' }

  exporta() {
    this.nombrearchivo = 'Lecturas';
    this.nombrearchivo = this.formImprimir.value.nombrearchivo;
    const nombreEmision = new NombreEmisionPipe(); // Crea una instancia del pipe
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Lecturas');

    worksheet.addRow([
      '',
      'Emisión: ' + nombreEmision.transform(this.rutaxemision.emision),
      'Ruta: ' + this.rutaxemision.ruta,
    ]);

    // Celda B1
    const cellB1 = worksheet.getCell('B1');
    const customStyle = {
      font: {
        name: 'Times New Roman',
        bold: true,
        size: 14,
        color: { argb: '002060' },
      },
    };

    // Aplicar el estilo personalizado a los Títulos
    cellB1.font = customStyle.font;
    const cellC1 = worksheet.getCell('C1');
    cellC1.font = customStyle.font;

    worksheet.addRow([]);

    const cabecera = [
      'Cta',
      'Responsable',
      'Categoría',
      'Anterior',
      'Actual',
      'Consumo',
      'A recaudar',
      'Novedades',
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
    this._lecturas.forEach((item: any) => {
      const row = [
        item.idabonado_abonados.idabonado,
        item.idabonado_abonados.idcliente_clientes.nombre,
        item.idabonado_abonados.idcategoria_categorias.descripcion,
        item.lecturaanterior,
        item.lecturaactual,
        item.lecturaactual - item.lecturaanterior,
        item.total1,
        item.idnovedad_novedades.descripcion,
      ];
      worksheet.addRow(row);
    });

    //Coloca la fila del Total
    worksheet.addRow(['', 'TOTAL']);
    worksheet.getCell('B' + (this._lecturas.length + 4).toString()).font = {
      bold: true,
    };
    let celdaf = worksheet.getCell(
      'F' + (this._lecturas.length + 4).toString(),
    );
    celdaf.numFmt = '#,##0';
    celdaf.font = { bold: true };
    celdaf.value = {
      formula: 'SUM(F4:' + 'F' + (this._lecturas.length + 3).toString() + ')',
      result: 0,
      sharedFormula: undefined,
      date1904: false,
    };
    let celdaG = worksheet.getCell(
      'G' + (this._lecturas.length + 4).toString(),
    );
    celdaG.numFmt = '#,##0.00';
    celdaG.font = { bold: true };
    celdaG.value = {
      formula: 'SUM(G4:' + 'G' + (this._lecturas.length + 3).toString() + ')',
      result: 0,
      sharedFormula: undefined,
      date1904: false,
    };

    // Establece el ancho de las columnas
    const anchoConfig = [
      { columnIndex: 2, widthInChars: 40 },
      { columnIndex: 3, widthInChars: 20 },
      { columnIndex: 4, widthInChars: 10 },
      { columnIndex: 5, widthInChars: 10 },
      { columnIndex: 7, widthInChars: 14 },
      { columnIndex: 8, widthInChars: 25 },
    ];
    anchoConfig.forEach((config) => {
      worksheet.getColumn(config.columnIndex).width = config.widthInChars;
    });

    // Columnas centradas
    const columnsToCenter = [1];
    columnsToCenter.forEach((columnIndex) => {
      worksheet
        .getColumn(columnIndex)
        .eachCell({ includeEmpty: true }, (cell) => {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        });
    });
    // Columnas a la derecha
    let columnsToRigth = [4, 5, 6, 7];
    columnsToRigth.forEach((columnIndex) => {
      worksheet
        .getColumn(columnIndex)
        .eachCell({ includeEmpty: true }, (cell) => {
          cell.alignment = { horizontal: 'right' };
        });
    });

    // Formato numérico
    const numeroStyle = { numFmt: '#,##0' };
    const columnsToFormat = [4, 5, 6];
    for (let i = 4; i <= this._lecturas.length + 2; i++) {
      columnsToFormat.forEach((columnIndex) => {
        const cell = worksheet.getCell(i, columnIndex);
        cell.style = numeroStyle;
      });
    }

    // Formato numérico con decimales
    const numeroStyle1 = { numFmt: '#,##0.00' };
    const columnsToFormat1 = [7];
    for (let i = 4; i <= this._lecturas.length + 2; i++) {
      columnsToFormat1.forEach((columnIndex) => {
        const cell = worksheet.getCell(i, columnIndex);
        cell.style = numeroStyle1;
      });
    }

    // Crea el archivo Excel
    workbook.xlsx.writeBuffer().then((buffer) => {
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);

      // Crear un enlace para descargar el archivo
      const a = document.createElement('a');
      a.href = url;
      a.download = `${this.nombrearchivo}.xlsx`; // Usa el nombre proporcionado por el usuario
      a.click();

      window.URL.revokeObjectURL(url); // Libera recursos
    });
  }
}

interface Rutaxemision {
  emision: String;
  ruta: String;
  estado: number;
}
