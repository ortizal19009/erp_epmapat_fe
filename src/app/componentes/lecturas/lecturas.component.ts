import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { Clientes } from 'src/app/modelos/clientes';
import { Facturas } from 'src/app/modelos/facturas.model';
import { Modulos } from 'src/app/modelos/modulos.model';
import { Rubros } from 'src/app/modelos/rubros.model';
import { FacturaService } from 'src/app/servicios/factura.service';
import { LecturasService } from 'src/app/servicios/lecturas.service';
import { PreciosxcatService } from 'src/app/servicios/preciosxcat.service';
import { RubrosService } from 'src/app/servicios/rubros.service';
import { RubroxfacService } from 'src/app/servicios/rubroxfac.service';
import { RutasxemisionService } from 'src/app/servicios/rutasxemision.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { NombreEmisionPipe } from 'src/app/pipes/nombre-emision.pipe'
import * as ExcelJS from 'exceljs';
import { Pliego24Service } from 'src/app/servicios/pliego24.service';

@Component({
   selector: 'app-lecturas',
   templateUrl: './lecturas.component.html',
   styleUrls: ['./lecturas.component.css']
})

export class LecturasComponent implements OnInit {

   idrutaxemision: number; //Para obtener idrutaxemisionToLectura
   rutaxemision = {} as Rutaxemision; //Interface para los datos de la Ruta y la Emision
   _lecturas: any;
   _lectura: any;
   formValor: FormGroup;
   _rutaxemision: any;
   filtro: string;
   sumtotal: number;
   cuenta: number;
   abonados: number;
   swfiltro: boolean;
   swcargado: boolean;   //
   //Para actualizar el consumo actual
   idlectura: number;
   fila: number;
   datosLectura: any;
   //Para cerrar
   disabled: boolean;
   btncerrar: boolean;
   modulo: Modulos;
   kontador: number;
   fecha: Date;
   rubros: any = [];
   rubrosFilter: [];
   tarifa: any;
   factura: any;
   arrprecios: number[] = [];
   arridfactura: number[] = [];
   public progreso = 0;
   private contador = 0;
   otraPagina: boolean = false;
   archExportar: string;

   constructor(private router: Router, private lecService: LecturasService,
      private rutaxemiService: RutasxemisionService, public fb: FormBuilder, private facService: FacturaService,
      private rubService: RubrosService, private pliegoService: PreciosxcatService, private rubxfacService: RubroxfacService,
      private pli24Service: Pliego24Service) { }

   ngOnInit(): void {
      this.idrutaxemision = +sessionStorage.getItem("idrutaxemisionToLectura")!;
      this.rutaxemisionDatos(this.idrutaxemision);
      this.lecService.getLecturas(this.idrutaxemision).subscribe({
         next: resp => {
            this._lecturas = resp;
            this.abonados = this._lecturas.length;
            this.total();
         },
         error: err => console.error(err.error)
      });

      //Formulario para modificar Lectura Actual
      this.formValor = this.fb.group({
         lecturaanterior: 0,
         lecturaactual: 0, disabled: false,
         consumo: 0
      });

      this.formValor.get('lecturaactual')?.valueChanges.subscribe((valor) => {
         this.formValor.controls['consumo'].setValue(valor - this.formValor.get('lecturaanterior')?.value);
      });
      this.fecha = new Date();
   }

   rutaxemisionDatos(idrutaxemision: number) {
      this.rutaxemiService.getById(idrutaxemision).subscribe({
         next: datos => {
            this._rutaxemision = datos;
            this.rutaxemision.emision = datos.idemision_emisiones.emision;
            this.rutaxemision.codigo = datos.idruta_rutas.codigo;
            this.rutaxemision.ruta = datos.idruta_rutas.descripcion;
            this.rutaxemision.estado = datos.estado;
         },
         error: err => console.error(err.error)
      })
   }

   lecturas() { this.archExportar = this.rutaxemision.codigo + '_' + this.rutaxemision.emision.toString() }

   exportToCSV() {
      const columnTitles: string[] = ['Cuenta', 'Nro. Medidor', 'Abonado', 'Lectura Anterior', 'Direccion', 'Categoria', 'Promedio', 'Lectura Actual',
         'Consumo', 'Novedad', 'Observaciones', 'Xcord', 'Ycord', 'Procesado', 'Recorrido', 'Secuencia', 'Identificador'];

      const csvData = [columnTitles, ...this._lecturas.map((lectura: any) => [
         lectura.idabonado_abonados.idabonado,
         lectura.idabonado_abonados.nromedidor,
         lectura.idabonado_abonados.idcliente_clientes.nombre,
         lectura.lecturaanterior,
         lectura.idabonado_abonados.direccionubicacion,
         lectura.idabonado_abonados.idcategoria_categorias.descripcion,
         60,
         '',
         '',
         '',
         '',
         '',
         '',
         0,
         'Ciclo 02/Sector 040' + lectura.idabonado_abonados.direccionubicacion,
         lectura.idabonado_abonados.secuencia,
         lectura.idlectura
      ])];

      const csvContent = this.convertArrayToCSV(csvData, ';');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = this.archExportar + '.csv';
      a.click();
   }

   private convertArrayToCSV(array: any[], delimiter: string): string {
      const rows = [];
      for (const row of array) {
         rows.push(row.map((item: any) => this.escapeCSVValue(item)).join(delimiter));
      }
      return rows.join('\n');
   }

   private escapeCSVValue(value: any): string {
      // Escapar comillas dobles y manejar otros casos según sea necesario
      if (typeof value === 'string') {
         return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
   }

   cargar() { this.router.navigate(['/impor-lecturas']); }

   regresar() { this.router.navigate(['/emisiones']); }

   total() {
      let suma: number = 0;
      this.swcargado = false
      let i = 0;
      this._lecturas.forEach(() => {
         //Suma solo los positivos. this.swcargada controla si ya se han cargado las lecturas (si ya hay uno positivo )
         if (this._lecturas[i].lecturaactual - this._lecturas[i].lecturaanterior > 0) {
            this.swcargado = true
            suma += this._lecturas[i].lecturaactual - this._lecturas[i].lecturaanterior
         };
         i++;
      });
      this.sumtotal = suma;
   }

   onInputChange() {
      if (this.filtro.trim() !== '') {
         this.swfiltro = true;
      } else {
         this.swfiltro = false;
      }
   }

   valor(idlectura: number, fila: number) {
      if (this.rutaxemision.estado == 1) this.formValor.get('lecturaactual')?.disable();
      this.idlectura = idlectura;
      this.fila = fila;
      this.lecService.getByIdlectura(idlectura).subscribe({
         next: resp => {
            this.datosLectura = resp;
            this.cuenta = resp.idabonado_abonados.idabonado;
            this.formValor.patchValue({
               lecturaanterior: resp.lecturaanterior,
               lecturaactual: resp.lecturaactual,
               consumo: resp.lecturaactual - resp.lecturaanterior
            })
         },
         error: err => console.log(err.error)
      },);
   }

   actuValor() {
      this.datosLectura.lecturaactual = this.formValor.value.lecturaactual;
      this.lecService.updateLectura(this.idlectura, this.datosLectura).subscribe({
         next: nex => {
            this._lecturas[this.fila].lecturaactual = this.formValor.value.lecturaactual;
            this.total();
         },
         error: err => console.error(err.error)
      });
   }

   //Genera Planillas (Tabla Facturas)
   generar() {
      this.disabled = true;
      this.modulo = new Modulos;
      this.modulo.idmodulo = 4;
      this.kontador = 0;
      this.planillas();
   }

   planillas() {
      let categoria = this._lecturas[this.kontador].idcategoria;
      let consumo = this._lecturas[this.kontador].lecturaactual - this._lecturas[this.kontador].lecturaanterior;
      let terceraedad = this._lecturas[this.kontador].idabonado_abonados.idresponsable.terceraedad; //OJO: 3ra edad NO hay en el cliente
      // if(terceraedad) if(categoria = 9 && consumo > 10 ) categoria = 1;
      // else if(categoria == 9 && consumo > 34 ) categoria = 1;
      if (categoria == 9 && consumo > 34) categoria = 1;
      if (categoria == 1 && consumo > 70) categoria = 2;
      if (consumo < 0) {
         this.kontador++;
         this.progreso = (this.kontador / this._lecturas.length) * 100
         if (this.kontador < this._lecturas.length) this.planillas();
      }
      else {
         let planilla = {} as Planilla;
         planilla.idmodulo = this.modulo;
         let cliente: Clientes = new Clientes;
         cliente.idcliente = this._lecturas[this.kontador].idresponsable;
         planilla.idcliente = cliente;
         planilla.idabonado = this._lecturas[this.kontador].idabonado_abonados.idabonado;
         planilla.porcexoneracion = 0;
         planilla.pagado = 0;
         planilla.conveniopago = 0;
         planilla.estadoconvenio = 0;
         planilla.formapago = 1;
         planilla.usucrea = 1;
         planilla.feccrea = this.fecha;
         // Obtiene lo tarifa del nuevo Pliego
         this.pli24Service.getBloque(categoria, consumo).subscribe({
            next: resp => {
               if (!resp) {
                  this.kontador++;
                  this.progreso = (this.kontador / this._lecturas.length) * 100
                  if (this.kontador < this._lecturas.length) this.planillas();
               }
               else {
                  this.tarifa = resp;
                  // console.log('this.tarifa: ', this.tarifa)
                  let num1 = Math.round((this.tarifa[0].idcategoria.fijoagua - 0.1) * this.tarifa[0].porc * 100) / 100;
                  let num2 = Math.round((this.tarifa[0].idcategoria.fijosanea - 0.5) * this.tarifa[0].porc * 100) / 100;
                  let num3 = Math.round((consumo * this.tarifa[0].agua) * this.tarifa[0].porc * 100) / 100;
                  let num4 = Math.round((consumo * this.tarifa[0].saneamiento / 2) * this.tarifa[0].porc * 100) / 100;
                  let num5 = Math.round((consumo * this.tarifa[0].saneamiento / 2) * this.tarifa[0].porc * 100) / 100;
                  let num7 = Math.round(0.5 * this.tarifa[0].porc * 100) / 100;
                  let suma: number = 0;
                  suma = Math.round((num1 + num2 + num3 + num4 + num5 + 0.1 + num7) * 100) / 100;
                  planilla.totaltarifa = suma;
                  planilla.valorbase = suma;
                  this.facService.saveFactura(planilla).subscribe({
                     next: fac => {
                        this.factura = fac;
                        // console.log('this.factura.idfactura: ', this.factura.idfactura)
                        this.lecService.getByIdlectura(this._lecturas[this.kontador].idlectura).subscribe({
                           next: datos => {
                              this._lectura = datos;
                              this._lectura.idfactura = this.factura.idfactura;
                              this.lecService.updateLectura(this._lecturas[this.kontador].idlectura, this._lectura).subscribe({
                                 next: nex => {
                                    this.arrprecios.push(num1 + num3, num2 + num4 + num7, num5, 0.1);
                                    let i = 0;
                                    this.addrubros(i);

                                    this.kontador++;
                                    this.progreso = (this.kontador / this._lecturas.length) * 100
                                    if (this.kontador < this._lecturas.length) this.planillas();
                                    // if (this.kontador < 5) this.planillas();
                                    else {
                                       //Actualiza el estado, totales y fecha de cierre de la Ruta por Emisión
                                       this._rutaxemision.estado = 1;
                                       this._rutaxemision.usuariocierre = 1;
                                       this._rutaxemision.fechacierre = this.fecha;
                                       this._rutaxemision.m3 = this.sumtotal;
                                       this.rutaxemiService.updateRutaxemision(this.idrutaxemision, this._rutaxemision).subscribe({
                                          next: nex => this.btncerrar = true,
                                          error: err => console.error(err.error)
                                       });
                                    };
                                 },
                                 error: err => console.error(err.error)
                              })
                           },
                           error: err => console.error(err.error)
                        })
                     },
                     error: err => console.error(err.error)
                  });
               }
            },
            error: err => console.error(err.error)
         });
      }
   }

   addrubros(i: number) {
      // console.log( 'this.arrprecios[i]', i, this.arrprecios[i] )
      let rubrosxpla = {} as Rubrosxpla;
      rubrosxpla.cantidad = 1;
      rubrosxpla.valorunitario = this.arrprecios[i];
      rubrosxpla.estado = 0;
      let factura: Facturas = new Facturas();
      factura.idfactura = this.factura.idfactura;
      rubrosxpla.idfactura_facturas = factura;
      let rubro: Rubros = new Rubros();
      let idrubro = 1001 + i
      rubro.idrubro = idrubro;
      rubrosxpla.idrubro_rubros = rubro;
      this.rubxfacService.saveRubroxfac(rubrosxpla).subscribe({
         next: nex => {
            // console.log(i, 'Ok!')
         },
         error: err => console.error(err.error)
      });
      i = i + 1
      if (i < 4) this.addrubros(i)
   }

   // cerrar() {
   //    this._rutaxemision.estado = 1;
   //    this._rutaxemision.usuariocierre = 1;
   //    this._rutaxemision.fechacierre = this.fecha;
   //    this._rutaxemision.m3 = this.sumtotal;
   //    this.rutaxemiService.updateRutaxemision(this.idrutaxemision, this._rutaxemision).subscribe({
   //       next: nex => this.router.navigate(['/emisiones']),
   //       error: err => console.error(err.error)
   //    });
   // }

   pdf() {
      const nombreEmision = new NombreEmisionPipe(); // Crea una instancia del pipe
      let m_izquierda = 20;
      var doc = new jsPDF();
      doc.setFont("times", "bold"); doc.setFontSize(16); doc.text("EpmapaT", m_izquierda, 10);
      doc.setFont("times", "bold"); doc.setFontSize(12); doc.text("LECTURAS", m_izquierda, 16);
      doc.setFont("times", "bold"); doc.setFontSize(11); doc.text('Emisión: ', m_izquierda, 20);
      doc.setFont("times", "normal"); doc.setFontSize(11); doc.text(nombreEmision.transform(this.rutaxemision.emision), m_izquierda + 16, 20);
      doc.setFont("times", "bold"); doc.setFontSize(11); doc.text('Ruta:', m_izquierda, 24);
      doc.setFont("times", "normal"); doc.setFontSize(11); doc.text(this.rutaxemision.ruta.toString(), m_izquierda + 12, 24)

      var datos: any = [];
      var i = 0;
      this._lecturas.forEach(() => {
         datos.push([this._lecturas[i].idabonado_abonados.idabonado, this._lecturas[i].idabonado_abonados.idcliente_clientes.nombre,
         this._lecturas[i].idabonado_abonados.idcategoria_categorias.descripcion, this._lecturas[i].lecturaanterior,
         this._lecturas[i].lecturaactual, this._lecturas[i].lecturaactual - this._lecturas[i].lecturaanterior,
         this._lecturas[i].mesesmulta, this._lecturas[i].idnovedad_novedades.descripcion]);
         i++;
      });
      datos.push(['', 'TOTAL', '', '', '', this.sumtotal.toLocaleString('en-US')]);

      const addPageNumbers = function () {
         const pageCount = doc.internal.pages.length;
         for (let i = 1; i <= pageCount - 1; i++) {
            doc.setPage(i);
            doc.setFontSize(10);
            doc.text('Página ' + i + ' de ' + (pageCount - 1), m_izquierda, doc.internal.pageSize.height - 10);
         }
      };

      autoTable(doc, {
         head: [['Cta', 'Responsable', 'Categoría', 'Anterior', 'Actual', 'Cnsm', 'MM', 'Novedades']],
         theme: 'grid',
         headStyles: { fillColor: [68, 103, 114], fontStyle: 'bold', halign: 'center' },
         styles: { font: 'helvetica', fontSize: 8, cellPadding: 1, halign: 'center' },
         columnStyles: {
            0: { halign: 'center', cellWidth: 12 },
            1: { halign: 'left', cellWidth: 65 },
            2: { halign: 'left', cellWidth: 22 },
            3: { halign: 'right', cellWidth: 17 },
            4: { halign: 'right', cellWidth: 17 },
            5: { halign: 'right', cellWidth: 10 },
            6: { halign: 'center', cellWidth: 8 },
            7: { halign: 'left', cellWidth: 32 },
         },
         margin: { left: m_izquierda - 1, top: 26, right: 8, bottom: 13 },
         body: datos,

         didParseCell: function (data) {
            var fila = data.row.index;
            var columna = data.column.index;
            if (columna > 0 && typeof data.cell.raw === 'number') { data.cell.text = [data.cell.raw.toLocaleString('en-US')]; }
            if (columna === 6 && +data.cell.raw! > 4) {
               data.cell.styles.fontStyle = 'bold';
               data.cell.styles.textColor = [255, 0, 0];
            };
            if (fila === datos.length - 1) { data.cell.styles.fontStyle = 'bold'; } // Total Bold
         }
      });
      addPageNumbers();

      var opciones = {
         filename: 'lecturas.pdf',
         orientation: 'portrait',
         unit: 'mm',
         format: 'a4',
         compress: true
      };

      if (this.otraPagina) doc.output('dataurlnewwindow', opciones);
      else {
         const pdfDataUri = doc.output('datauristring');
         //Si ya existe el <embed> primero lo remueve
         const elementoExistente = document.getElementById('idembed');
         if (elementoExistente) { elementoExistente.remove(); }
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

   exportar() { this.archExportar = 'Lecturas' }

   exporta() {
      const nombreEmision = new NombreEmisionPipe(); // Crea una instancia del pipe
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Lecturas');

      worksheet.addRow(['', 'Emisión: ' + nombreEmision.transform(this.rutaxemision.emision), 'Ruta: ' + this.rutaxemision.ruta]);

      // Celda B1
      const cellB1 = worksheet.getCell('B1');
      const customStyle = { font: { name: 'Times New Roman', bold: true, size: 14, color: { argb: '002060' } } };

      // Aplicar el estilo personalizado a los Títulos
      cellB1.font = customStyle.font;
      const cellC1 = worksheet.getCell('C1');
      cellC1.font = customStyle.font;

      worksheet.addRow([]);

      const cabecera = ['Cta', 'Responsable', 'Categoría', 'Anterior', 'Actual', 'Cnsm', 'MM', 'Novedades'];
      const headerRowCell = worksheet.addRow(cabecera);
      headerRowCell.eachCell(cell => {
         cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: '002060' }
         };
         cell.font = { bold: true, name: 'Times New Roman', color: { argb: 'FFFFFF' } };
      });

      // Agrega los datos a la hoja de cálculo
      this._lecturas.forEach((item: any) => {
         const row = [item.idabonado_abonados.idabonado, item.idabonado_abonados.idcliente_clientes.nombre,
         item.idabonado_abonados.idcategoria_categorias.descripcion, item.lecturaanterior, item.lecturaactual,
         item.lecturaactual - item.lecturaanterior, item.mesesmulta, item.idnovedad_novedades.descripcion];
         worksheet.addRow(row);
      });

      //Coloca la fila del Total
      worksheet.addRow(['', 'TOTAL']);
      worksheet.getCell('B' + (this._lecturas.length + 4).toString()).font = { bold: true }
      let celdaf = worksheet.getCell('F' + (this._lecturas.length + 4).toString());
      celdaf.numFmt = '#,##0';
      celdaf.font = { bold: true }
      celdaf.value = { formula: 'SUM(F4:' + 'F' + (this._lecturas.length + 3).toString() + ')', result: 0, sharedFormula: undefined, date1904: false };

      // Establece el ancho de las columnas
      const anchoConfig = [
         { columnIndex: 2, widthInChars: 40 },
         { columnIndex: 4, widthInChars: 10 },
         { columnIndex: 5, widthInChars: 10 },
         { columnIndex: 8, widthInChars: 25 },
      ];
      anchoConfig.forEach(config => {
         worksheet.getColumn(config.columnIndex).width = config.widthInChars;
      });

      // Columnas centradas 
      const columnsToCenter = [1, 7];
      columnsToCenter.forEach(columnIndex => {
         worksheet.getColumn(columnIndex).eachCell({ includeEmpty: true }, cell => {
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
         });
      });
      // Columnas a la derecha 
      let columnsToRigth = [4, 5, 6];
      columnsToRigth.forEach(columnIndex => {
         worksheet.getColumn(columnIndex).eachCell({ includeEmpty: true }, cell => {
            cell.alignment = { horizontal: 'right' };
         });
      });

      // Formato numérico
      const numeroStyle = { numFmt: '#,##0' };
      const columnsToFormat = [4, 5, 6];
      for (let i = 4; i <= this._lecturas.length + 2; i++) {
         columnsToFormat.forEach(columnIndex => {
            const cell = worksheet.getCell(i, columnIndex);
            cell.style = numeroStyle;
         });
      }

      // Crea un archivo Excel
      workbook.xlsx.writeBuffer().then(buffer => {
         const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
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

interface Rutaxemision {
   emision: String;
   codigo: String;
   ruta: String;
   estado: number;
   usuariocierre: number;
   fechacierre: Date;
}

interface Planilla {
   idfactura: number;
   idmodulo: Modulos;
   idcliente: Clientes;
   idabonado: number;  //Probar con Abonados;
   nrofactura: String;
   porcexoneracion: number;
   razonexonera: String;
   totaltarifa: number;
   pagado: number;
   usuariocobro: number;
   fechacobro: Date;
   estado: number;
   usuarioanulacion: number;
   razonanulacion: String;
   usuarioeliminacion: number;
   fechaeliminacion: Date;
   razoneliminacion: String;
   conveniopago: number;
   fechaconvenio: Date;
   estadoconvenio: number;
   formapago: number;
   reformapago: String;
   horacobro: String;
   usuariotransferencia: number;
   fechatransferencia: Date;
   usucrea: number;
   feccrea: Date;
   usumodi: number;
   fecmodi: Date;
   valorbase: number;
}

interface Rubrosxpla {
   idrubroxfac: number;
   cantidad: number;
   valorunitario: number;
   estado: number;
   idfactura_facturas: Facturas;
   idrubro_rubros: Rubros;
}