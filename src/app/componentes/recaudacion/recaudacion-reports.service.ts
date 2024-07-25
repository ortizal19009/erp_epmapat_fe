import { ParseSpan } from '@angular/compiler';
import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Clientes } from 'src/app/modelos/clientes';
import { UsuarioService } from 'src/app/servicios/administracion/usuario.service';
import { ClientesService } from 'src/app/servicios/clientes.service';
import { EmisionService } from 'src/app/servicios/emision.service';
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
  emision: any;
  constructor(
    private rubxfacService: RubroxfacService,
    private s_usuarios: UsuarioService,
    private s_cliente: ClientesService,
    private s_emision: EmisionService
  ) {}
  async cabeceraConsumoAgua(
    datos: any,
    doc: jsPDF,
    usuario: any,
    factura: any
  ) {
    //doc.setFontSize(7);
    /*     this.s_cliente.getListaById(datos.idabonado_abonados.idresponsable).subscribe({
      next: (datos: any) => {
      }, error: (e) => { console.error(e) }
    }) */
    let tableWidth = 200;
    let m3 = datos.lecturaactual - datos.lecturaanterior;
    let emi: any = await this.getEmisionByid(datos.idemision);
    let fecha = emi.feccrea.slice(0, 10).split('-');
    let mesConsumo = `${this.meses[+fecha[1]! - 1]} ${fecha[0]}`;
    autoTable(doc, {
      margin: { left: 10, top: 5 },
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
        [`Nro planilla: ${factura.idfactura}`],
        [`Ruc/cedula: ${datos.idabonado_abonados.idcliente_clientes.cedula}`],
        [`Mes pagado: ${mesConsumo}`],
        [`Cliente: ${datos.idabonado_abonados.idresponsable.nombre}`],
        [`Dirección: ${datos.idabonado_abonados.direccionubicacion}`],
        /* [`Referencia: ${datos.idcliente.referencia}`], */
        [`M3: ${m3}`, `Emision: ${emi.emision}`],
        [
          {
            content: `Cuenta:  ${datos.idabonado_abonados.idabonado}`,
            styles: { fontSize: 12, fontStyle: 'bold' },
          },
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
      margin: { left: 10 },
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
        [`Nro comp: ${datos.nrofactura}`],
        [`Nro planilla: ${datos.idfactura}`],
        [`Ruc/cedula: ${datos.idcliente.cedula}`],
        [`Cliente: ${datos.idcliente.nombre}`],
        [`Dirección: ${datos.idcliente.direccion}`],
        /* [`Referencia: ${datos.idcliente.referencia}`], */
        /* [`M3: ${m3}`, `Emision: ${datos.idemision}`], */
        [
          {
            content: `Cuenta: ${datos.idabonado}`,
            styles: { textColor: 'white' },
          },
          `FechaPag: ${datos.fechacobro}`,
        ],
        [`Recaudador:  ${usuario.nomusu}`],
      ],
    });
  }
  comprobantePago(l_datos: any, factura: any) {
    if (factura.interescobrado === null) {
      factura.interescobrado = 0;
    }
    let doc = new jsPDF('p', 'pt', 'a4');
    var logo = new Image();
    logo.src = './assets/img/logo_planilla.png';

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
        let rubros: any = [];
        _rubrosxfac.forEach((item: any) => {
          if (item.idrubro_rubros.swiva === true) {
            this.iva += item.valorunitario * item.cantidad * 0.15;
          }
          if (
            item.idrubro_rubros.idrubro != 5 &&
            item.idrubro_rubros.idrubro != 165
          ) {
            if (
              item.idfactura_facturas.swcondonar === true &&
              item.idrubro_rubros.idrubro === 6
            ) {
            } else {
              this.total += +item.valorunitario! * item.cantidad;
              rubros.push([
                item.idrubro_rubros.descripcion,
                item.cantidad.toFixed(0),
                item.valorunitario.toFixed(2),
              ]);
            }
          } else if (item.idrubro_rubros.idrubro === 165) {
            this.iva = 0;
          } else {
            this.interes = item.valorunitario;
          }
        });
        this.total += this.interes + this.iva;
        this.subtotal += this.total - this.interes - this.iva;
        autoTable(doc, {
          margin: { left: 10 },
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
            1: { minCellWidth: 15, halign: 'center' },
            2: { minCellWidth: 15, halign: 'right' },
          },
          columns: ['Descripción', 'Cant.', 'Valor unitario'],
          body: rubros,
        });
        autoTable(doc, {
          margin: { left: 10 },
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
            ['Iva 15%', factura.swiva.toFixed(2)],
            ['Intereses', factura.interescobrado.toFixed(2)],
            ['Valor total', this.total.toFixed(2)],
          ],
        });
        doc.setGState(doc.GState({ opacity: 0.4 }));
        doc.addImage(logo, 'PNG', 20, 130, 190, 195);
        doc.setGState(doc.GState({ opacity: 0.99 }));
        doc.addImage(logo, 'PNG', 120, 15, 80, 80);
        window.open(doc.output('bloburl'));
        /*     doc.output('pdfobjectnewwindow', {
          filename: 'hoja de reporte de pago',
        }); */
      },
      error: (err) =>
        console.error('Al recuperar el datalle de la Planilla: ', err.error),
    });
  }
  async getEmisionByid(idemision: number) {
    const emision = this.s_emision.getByIdemision(idemision).toPromise();
    return emision;
  }
}
