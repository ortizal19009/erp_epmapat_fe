import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { ColoresService } from 'src/app/compartida/colores.service';
import { Abonados } from 'src/app/modelos/abonados';
import { AbonadosService } from 'src/app/servicios/abonados.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as ExcelJS from 'exceljs';

@Component({
  selector: 'app-listar-abonados',
  templateUrl: './listar-abonados.component.html',
  styleUrls: ['./listar-abonados.component.css'],
})
export class ListarAbonadosComponent implements OnInit {
  _abonados: any;
  buscarAbonadoForm: FormGroup;
  filterTerm: string;
  archExportar: string;
  otraPagina: boolean = false;
  _campos: any;

  constructor(
    public fb: FormBuilder,
    private aboService: AbonadosService,
    private router: Router,
    private coloresService: ColoresService
  ) {}

  ngOnInit(): void {
    sessionStorage.setItem('ventana', '/abonados');
    let coloresJSON = sessionStorage.getItem('/abonados');
    if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
    else this.buscaColor();

    let tipoBusqueda = sessionStorage.getItem('tipoBusqueda');
    let buscaAbonados = sessionStorage.getItem('buscaAbonados');
    if (tipoBusqueda == null) tipoBusqueda = '1';
    if (buscaAbonados == null) buscaAbonados = '';
    localStorage.removeItem('idabonadoToFactura');

    this.buscarAbonadoForm = this.fb.group({
      selecTipoBusqueda: +tipoBusqueda!,
      buscarAbonado: [buscaAbonados],
    });

    this.buscarAbonadoForm
      .get('selecTipoBusqueda')
      ?.valueChanges.subscribe((valor) => {
        this.buscarAbonadoForm.controls['buscarAbonado'].setValue('');
      });
    if (buscaAbonados != '') this.onSubmit();
  }

  async buscaColor() {
    try {
      const datos = await this.coloresService.setcolor(1, 'abonados');
      const coloresJSON = JSON.stringify(datos);
      sessionStorage.setItem('/abonados', coloresJSON);
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

  onNavigationEnd() {
    // Recarga el componente actual
    this.router.navigate(['/app-listar-abonados']);
  }

  modificarAbonado(abonado: Abonados) {
    let i_buscarAbonado = document.getElementById(
      'buscarAbonado'
    ) as HTMLInputElement;
    localStorage.setItem('v-buscarAbonado', i_buscarAbonado.value);
    localStorage.setItem('idabonadoToModi', abonado.idabonado.toString());
    this.router.navigate(['/modificar-abonado']);
  }

  addAbonadoRouter() {
    // this.router.navigate(["/add-abonado"]);
    this.router.navigate(['forms-aguatramite', 1]);
  }

  onSubmit() {
    sessionStorage.setItem(
      'tipoBusqueda',
      this.buscarAbonadoForm.controls['selecTipoBusqueda'].value.toString()
    );
    sessionStorage.setItem(
      'buscaAbonados',
      this.buscarAbonadoForm.controls['buscarAbonado'].value.toString()
    );
    if (
      +this.buscarAbonadoForm.value.selecTipoBusqueda == 1 &&
      this.buscarAbonadoForm.value.buscarAbonado != ''
    ) {
      this.aboService
        .getResAbonado(+this.buscarAbonadoForm.value.buscarAbonado!)
        .subscribe({
          next: (datos: any) => {
            this._abonados = datos;
          },
          error: (err) => console.error(err.error),
        });
    } else if (
      +this.buscarAbonadoForm.value.selecTipoBusqueda == 2 &&
      this.buscarAbonadoForm.value.buscarAbonado != ''
    ) {
      this.aboService
        .getResAbonadoNombre(this.buscarAbonadoForm.value.buscarAbonado)
        .subscribe(
          (datos) => {
            this._abonados = datos;
          },
          (error) => console.error(error)
        );
    } else if (
      +this.buscarAbonadoForm.value.selecTipoBusqueda == 3 &&
      this.buscarAbonadoForm.value.buscarAbonado != ''
    ) {
      this.aboService
        .getResAbonadoIdentificacion(this.buscarAbonadoForm.value.buscarAbonado)
        .subscribe(
          (datos) => {
            this._abonados = datos;
          },
          (error) => console.error(error)
        );
    }
    // else if (this.buscarAbonadoForm.value.buscarAbonado === '') {
    // }
  }

  alerta() {
    let mensaje = localStorage.getItem('mensajeSuccess');
    if (mensaje != null) {
      const divAlerta = document.getElementById('alertaAbonados');
      const alerta = document.createElement('div') as HTMLElement;
      divAlerta?.appendChild(alerta);
      alerta.innerHTML =
        "<div class='alert alert-success'><strong>EXITO!</strong> <br/>" +
        mensaje +
        '.</div>';
      setTimeout(function () {
        divAlerta?.removeChild(alerta);
        localStorage.removeItem('mensajeSuccess');
      }, 2000);
    }
    localStorage.removeItem('mensajeSuccess');
  }

  detallesAbonado(abonado: Abonados) {
    sessionStorage.setItem(
      'tipoBusqueda',
      this.buscarAbonadoForm.controls['selecTipoBusqueda'].value.toString()
    );
    sessionStorage.setItem(
      'buscaAbonados',
      this.buscarAbonadoForm.controls['buscarAbonado'].value.toString()
    );
    sessionStorage.setItem('padreDetalleAbonado', '1');
    sessionStorage.setItem('idabonadoToFactura', abonado.idabonado.toString());
    this.router.navigate(['detalles-abonado']);
  }

  pdf() {
    let m_izquierda = 12;
    // var doc = new jsPDF();
    var doc = new jsPDF({ orientation: 'landscape' });
    doc.setFont('times', 'bold');
    doc.setFontSize(16);
    doc.text('EpmapaT', m_izquierda, 10);
    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.text('ABONADOS', m_izquierda, 16);

    var datos: any = [];
    var i = 0;
    this._abonados.forEach(() => {
      datos.push([
        this._abonados[i].nombre,
        this._abonados[i].identificacion,
        this._abonados[i].idabonado,
        this._abonados[i].categoria,
        this._abonados[i].ruta,
        this._abonados[i].direccion,
        this._abonados[i].estado,
      ]);
      i++;
    });
    // datos.push(['', 'TOTAL', '', '', '', this.sumtotal.toLocaleString('en-US')]);

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
      head: [
        [
          'Nombre',
          'Identificación',
          'Cuenta',
          'Categoría',
          'Ruta',
          'Dirección',
          'Estado',
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
        0: { halign: 'left', cellWidth: 80 },
        1: { halign: 'center', cellWidth: 20 },
        2: { halign: 'center', cellWidth: 22 },
        3: { halign: 'left', cellWidth: 26 },
        4: { halign: 'left', cellWidth: 50 },
        5: { halign: 'left', cellWidth: 78 },
        6: { halign: 'center', cellWidth: 13 },
      },
      margin: { left: m_izquierda - 1, top: 18, right: 10, bottom: 13 },
      body: datos,

      didParseCell: function (data) {
        var fila = data.row.index;
        var columna = data.column.index;
        // if (columna > 0 && typeof data.cell.raw === 'number') { data.cell.text = [data.cell.raw.toLocaleString('en-US')]; }
        if (columna === 6 && +data.cell.raw! > 4) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.textColor = [255, 0, 0];
        }
        // if (fila === datos.length - 1) { data.cell.styles.fontStyle = 'bold'; } // Total Bold
      },
    });
    addPageNumbers();

    var opciones = {
      filename: 'lecturas.pdf',
      // orientation: 'portrait',
      // orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
      compress: true,
    };

    if (this.otraPagina) doc.output('dataurlnewwindow', opciones);
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
      embed.setAttribute('width', '80%');
      embed.setAttribute('height', '100%');
      embed.setAttribute('id', 'idembed');
      //Agrega el <embed> al contenedor del Modal
      var container: any;
      container = document.getElementById('pdf');
      container.appendChild(embed);
    }
  }

  exportar() {
    this.archExportar = 'Abonados';
  }

  exporta() {
    this.aboService.getCampos().subscribe({
      next: (datos) => {
        this._campos = datos;

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Abonados');

        worksheet.addRow(['Abonados']);

        // Celda A1
        const cellA1 = worksheet.getCell('A1');
        const customStyle = {
          font: {
            name: 'Times New Roman',
            bold: true,
            size: 14,
            color: { argb: '002060' },
          },
        };

        // Aplicar el estilo personalizado a los Títulos
        cellA1.font = customStyle.font;
        const cellC1 = worksheet.getCell('C1');
        cellC1.font = customStyle.font;

        worksheet.addRow([]);

        const cabecera = [
          'Cuenta',
          'Nombre',
          'Identificación',
          'Dirección',
          'Dirección Ubicación',
          'Teléfono',
          'F.Nacimiento',
          'e-mail',
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
        this._campos.forEach((abonado: any) => {
          const row = [
            abonado.idabonado,
            abonado.nombre,
            abonado.cedula,
            abonado.direccion,
            abonado.direccionubicacion,
            abonado.telefono,
            abonado.fechanacimiento,
            abonado.email,
          ];
          worksheet.addRow(row);
        });

        // Establece el ancho de las columnas
        const anchoConfig = [
          { columnIndex: 1, widthInChars: 10 },
          { columnIndex: 2, widthInChars: 50 },
          { columnIndex: 3, widthInChars: 14 },
          { columnIndex: 4, widthInChars: 50 },
          { columnIndex: 5, widthInChars: 50 },
          { columnIndex: 6, widthInChars: 20 },
          { columnIndex: 7, widthInChars: 12 },
          { columnIndex: 8, widthInChars: 40 },
        ];
        anchoConfig.forEach((config) => {
          worksheet.getColumn(config.columnIndex).width = config.widthInChars;
        });

        // Columnas centradas
        const columnsToCenter = [3, 6, 7];
        columnsToCenter.forEach((columnIndex) => {
          worksheet
            .getColumn(columnIndex)
            .eachCell({ includeEmpty: true }, (cell) => {
              cell.alignment = { vertical: 'middle', horizontal: 'center' };
            });
        });

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
      },
      error: (err) => console.error(err.error),
    });
  }

  exporta1() {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Lecturas');

    worksheet.addRow(['Abonados']);

    // Celda A1
    const cellA1 = worksheet.getCell('A1');
    const customStyle = {
      font: {
        name: 'Times New Roman',
        bold: true,
        size: 14,
        color: { argb: '002060' },
      },
    };

    // Aplicar el estilo personalizado a los Títulos
    cellA1.font = customStyle.font;
    const cellC1 = worksheet.getCell('C1');
    cellC1.font = customStyle.font;

    worksheet.addRow([]);

    const cabecera = [
      'Nombre',
      'Identificación',
      'Cuenta',
      'Categoría',
      'Ruta',
      'Dirección',
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
    this._abonados.forEach((abonado: any) => {
      const row = [
        abonado.idcliente_clientes.nombre,
        abonado.idcliente_clientes.cedula,
        abonado.idabonado,
        abonado.idcategoria_categorias.descripcion,
        abonado.idruta_rutas.descripcion,
        abonado.direccionubicacion,
      ];
      worksheet.addRow(row);
    });

    // Establece el ancho de las columnas
    const anchoConfig = [
      { columnIndex: 1, widthInChars: 50 },
      { columnIndex: 2, widthInChars: 16 },
      { columnIndex: 3, widthInChars: 10 },
      { columnIndex: 4, widthInChars: 20 },
      { columnIndex: 5, widthInChars: 30 },
      { columnIndex: 6, widthInChars: 50 },
    ];
    anchoConfig.forEach((config) => {
      worksheet.getColumn(config.columnIndex).width = config.widthInChars;
    });

    // Columnas centradas
    const columnsToCenter = [2, 3];
    columnsToCenter.forEach((columnIndex) => {
      worksheet
        .getColumn(columnIndex)
        .eachCell({ includeEmpty: true }, (cell) => {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        });
    });

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
}
