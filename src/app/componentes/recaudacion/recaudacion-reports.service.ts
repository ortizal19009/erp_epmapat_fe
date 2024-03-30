import { ParseSpan } from '@angular/compiler';
import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { UsuarioService } from 'src/app/servicios/administracion/usuario.service';
import { RubroxfacService } from 'src/app/servicios/rubroxfac.service';

@Injectable({
  providedIn: 'root',
})
export class RecaudacionReportsService {
  date: Date = new Date();
  total: number = 0;
  interes: number = 0;
  iva: number = 0;
  subtotal: number = 0;
  meses = [
    'ENERO',
    'FEBRERO',
    'MARZO',
    'ABRIL',
    'MAYO',
    'JUNIO',
    'JULIO',
    'AGOSTO',
    'SEPTIEMBRE',
    'OCTUBRE',
    'NOVIEMBRE',
    'DICIEMBRE',
  ];
  constructor(
    private rubxfacService: RubroxfacService,
    private s_usuarios: UsuarioService
  ) {}
  cabeceraConsumoAgua(datos: any, doc: jsPDF, usuario: any, factura: any) {
    //doc.setFontSize(7);
    let tableWidth = 200;
    let m3 = datos.lecturaactual - datos.lecturaanterior;
    let fecha = datos.fechaemision.slice(0, 10).split('-');
    let mesConsumo = `${this.meses[+fecha[1]! - 1]} ${fecha[0]}`;

    autoTable(doc, {
      tableWidth,
      styles: { fontSize: 9, fontStyle: 'bold' },
      columnStyles: {
        0: { minCellWidth: 10 },
        2: { minCellWidth: 15 },
      },
      bodyStyles: {
        cellPadding: 2,
        fillColor: [255, 255, 255],
        textColor: 'black',
      },
      alternateRowStyles: { fillColor: [255, 255, 255] },
      headStyles: {
        halign: 'center',
        fillColor: 'white',
        textColor: 'black',
      },
      columns: ['EPMAPA-TULCAN', ''],
      body: [
        [`Nro comp: ${factura.nrofactura}`],
        [`Ruc/cedula: ${datos.idabonado_abonados.idcliente_clientes.cedula}`],
        [`Mes pagado: ${mesConsumo}`],
        [`Cliente: ${datos.idabonado_abonados.idcliente_clientes.nombre}`],
        [`Dirección: ${datos.idabonado_abonados.direccionubicacion}`],
        /* [`Referencia: ${datos.idcliente.referencia}`], */
        [`M3: ${m3}`, `Emision: ${datos.idemision}`],
        [
          `Cuenta: ${datos.idabonado_abonados.idabonado}`,
          `FechaPag: ${factura.fechacobro}`,
        ],
        [
          `L. Anterior: ${datos.lecturaanterior}`,
          `L. Actual: ${datos.lecturaactual}`,
        ],
        [
          `Categoría: ${datos.idabonado_abonados.idcategoria_categorias.descripcion}`,
        ],
        [`Recaudador: ${usuario.nomusu}`],
      ],
    });
  }
  cabeceraOtros(datos: any, doc: jsPDF, usuario: any) {
    let tableWidth = 200;
    autoTable(doc, {
      //doc.setFontType("bold");
      //startY: 250,
      tableWidth,
      //theme: 'striped',
      styles: { fontSize: 9, fontStyle: 'bold' },
      columnStyles: {
        0: { minCellWidth: 10 },
        2: { minCellWidth: 15 },
      },
      bodyStyles: {
        cellPadding: 1,
        fillColor: [255, 255, 255],
        textColor: 'black',
      },

      headStyles: {
        halign: 'center',
        fillColor: 'white',
        textColor: 'black',
      },
      columns: ['EPMAPA-TULCAN', ''],
      body: [
        [`Nro comp: ${datos.nrofactura}`],
        [`Ruc/cedula: ${datos.idcliente.cedula}`],

        [`Cliente: ${datos.idcliente.nombre}`],
        [`Dirección: ${datos.idcliente.direccion}`],
        /* [`Referencia: ${datos.idcliente.referencia}`], */
        /* [`M3: ${m3}`, `Emision: ${datos.idemision}`], */
        [`Cuenta: ${datos.idabonado}`, `FechaPag: ${datos.fechacobro}`],
        [`Recaudador:  ${usuario.nomusu}`],
      ],
    });
  }
  comprobantePago(l_datos: any, factura: any) {
    console.log(l_datos);
    console.log(factura);
    if (factura.interescobrado === null) {
      factura.interescobrado = 0;
    }
    let doc = new jsPDF('p', 'pt', 'a4');
    let usuario: any;
    let idfactura: any;
    let tableWidth = 200;
    this.iva = 0;
    this.subtotal = 0;
    this.total = 0;
    this.interes = 0;
    if (l_datos != null) {
      idfactura = l_datos.idfactura;
    } else {
      idfactura = factura.idfactura;
    }
    this.s_usuarios.getByIdusuario(factura.usuariocobro).subscribe({
      next: (datos) => {
        usuario = datos;
        let modulo = factura.idmodulo.idmodulo;
        if ((modulo === 3 || modulo === 4) && l_datos != null) {
          this.cabeceraConsumoAgua(l_datos, doc, usuario, factura);
        } else {
          this.cabeceraOtros(factura, doc, usuario);
        }
      },
      error: (e) => console.error(e),
    });
    this.rubxfacService.getByIdfactura(idfactura).subscribe({
      next: (_rubrosxfac: any) => {
        console.log(_rubrosxfac);
        let rubros: any = [];
        _rubrosxfac.forEach((item: any) => {
          if (item.idrubro_rubros.swiva === true) {
            this.iva += item.valorunitario * 0.15;
          }
          if (
            item.idrubro_rubros.idrubro != 5 &&
            item.idrubro_rubros.idrubro != 165
          ) {
            this.total += +item.valorunitario!;
            rubros.push([
              item.idrubro_rubros.descripcion,
              item.valorunitario.toFixed(2),
            ]);
          } else if (item.idrubro_rubros.idrubro === 165) {
            this.iva = item.valorunitario;
          } else {
            this.interes = item.valorunitario;
          }
        });
        this.total += this.interes + this.iva;
        this.subtotal += this.total - this.interes - this.iva;
        autoTable(doc, {
          tableWidth,
          theme: 'grid',
          styles: { fontSize: 9, fontStyle: 'bold' },
          headStyles: {
            halign: 'center',
            fillColor: 'white',
            textColor: 'black',
          },
          bodyStyles: {
            cellPadding: 1,
            fillColor: [255, 255, 255],
            textColor: 'black',
          },
          columnStyles: {
            0: { minCellWidth: 10 },
            1: { minCellWidth: 15, halign: 'right' },
          },
          columns: ['Descripción', 'Valor unitario'],
          body: rubros,
        });
        autoTable(doc, {
          tableWidth,
          theme: 'grid',
          styles: { fontSize: 9, fontStyle: 'bold' },
          headStyles: {
            halign: 'center',
            fillColor: 'white',
            textColor: 'black',
          },
          bodyStyles: {
            cellPadding: 1,
            fillColor: [255, 255, 255],
            textColor: 'black',
          },
          columnStyles: {
            0: { minCellWidth: 10 },
            1: { minCellWidth: 15, halign: 'right' },
          },
          columns: ['', ''],
          body: [
            ['Sub total', this.subtotal.toFixed(2)],
            ['Iva 12%', this.iva.toFixed(2)],
            ['Intereses', factura.interescobrado.toFixed(2)],
            ['Valor total', this.total.toFixed(2)],
          ],
        });
        window.open(doc.output('bloburl'));
        /*     doc.output('pdfobjectnewwindow', {
          filename: 'hoja de reporte de pago',
        }); */
      },
      error: (err) =>
        console.error('Al recuperar el datalle de la Planilla: ', err.error),
    });
  }
}
