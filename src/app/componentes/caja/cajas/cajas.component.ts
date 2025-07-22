import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { format } from '@formkit/tempo';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { ColoresService } from 'src/app/compartida/colores.service';
import { Usuarios } from 'src/app/modelos/administracion/usuarios.model';

import { CajaService } from 'src/app/servicios/caja.service';
import { FacturaService } from 'src/app/servicios/factura.service';
import { PdfService } from 'src/app/servicios/pdf.service';
import { RecaudacionService } from 'src/app/servicios/recaudacion.service';
import { RubrosService } from 'src/app/servicios/rubros.service';
import { RubroxfacService } from 'src/app/servicios/rubroxfac.service';

@Component({
  selector: 'app-cajas',
  templateUrl: './cajas.component.html',
  styleUrls: ['./cajas.component.css'],
})
export class ListarCajaComponent implements OnInit {
  _cajas: any;
  filtro: string;
  otraPagina: boolean = false;
  usuario: Usuarios = new Usuarios();
  caja = {} as Caja;
  today: Date = new Date();
  desde: any;
  hasta: any;
  opt: any = '0';
  swAddCaja: boolean = false;
  idcaja: number;
  _iduser: number;
  @ViewChild('swModi', { read: TemplateRef }) swModi: TemplateRef<unknown> | undefined;

  constructor(
    private cajaService: CajaService,
    private router: Router,
    public authService: AutorizaService,
    private coloresService: ColoresService,
    private _pdf: PdfService,
    private s_facturas: FacturaService,
    private s_rubroxfac: RubroxfacService,
    private s_recaudacion: RecaudacionService,
    private s_rubro: RubrosService,
    private s_pdf: PdfService
  ) { }

  ngOnInit(): void {
    let fechaActual: Date = new Date();
    sessionStorage.setItem('ventana', '/cajas');
    let coloresJSON = sessionStorage.getItem('/cajas');
    if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
    else this.buscaColor();
    this.listarCajas();
    let fDate = format(fechaActual, 'YYYY-MM-DD');
    this.desde = fDate;
    this.hasta = fDate;
  }

  async buscaColor() {
    try {
      const datos = await this.coloresService.setcolor(
        +this.authService.idusuario!,
        'cajas'
      );
      const coloresJSON = JSON.stringify(datos);
      sessionStorage.setItem('/cajas', coloresJSON);
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

  public listarCajas() {
    this.cajaService.getListaCaja().subscribe((datos) => {
      this._cajas = datos;
    });
  }

  public info(idcaja: number) {
    sessionStorage.setItem('idcajaToInfo', idcaja.toString());
    this.router.navigate(['info-caja']);
  }

  onCellClick(event: any, idcaja: number) {
    const tagName = event.target.tagName;
    if (tagName === 'TD') {
      sessionStorage.setItem('idcajaToInfo', idcaja.toString());
      this.router.navigate(['info-caja']);
    }
  }
  setIdcaja(idcaja: number) {
    this.idcaja = idcaja;
    this.swAddCaja = true;

  }

  imprimirReportes(recaudador: any) {
    sessionStorage.setItem('idrecaudador', recaudador.idusuario_usuarios.idusuario.toString());
    this.router.navigate(['/imp-inf-caja']);
  }
  pdf(opt: any) {
    switch (opt) {
      case '0':
        this.s_rubroxfac.getByFechacobro(this.desde, this.hasta).subscribe({
          next: (datos: any) => {
            let n_fxr: any[] = [];
            datos.forEach((item: any) => {
              let f_query = n_fxr.find(
                (factura: { idfactura: number }) =>
                  factura.idfactura === item.idfactura_facturas.idfactura
              );
              let fac = item.idfactura_facturas;
              if (!f_query) {
                fac.rubros = [item.idrubro_rubros];
                n_fxr.push(item.idfactura_facturas);
              } else {
                let r_query = n_fxr.find(
                  (factura: { idfactura: number }) =>
                    factura.idfactura === item.idfactura_facturas.idfactura
                );
                r_query.rubros.push(item.idrubro_rubros);
              }
            });
            this.allRubros(n_fxr);
          },
          error: (e) => console.error(e),
        });
        break;
      case '1':
        this.s_rubroxfac.getByFechacobro(this.desde, this.hasta).subscribe({
          next: (datos: any) => {
            let n_fxr: any[] = [];
            datos.forEach((item: any) => {
              let f_query = n_fxr.find(
                (factura: { idfactura: number }) =>
                  factura.idfactura === item.idfactura_facturas.idfactura
              );
              let fac = item.idfactura_facturas;
              if (!f_query) {
                fac.rubros = [item.idrubro_rubros];
                n_fxr.push(item.idfactura_facturas);
              } else {
                let r_query = n_fxr.find(
                  (factura: { idfactura: number }) =>
                    factura.idfactura === item.idfactura_facturas.idfactura
                );
                r_query.rubros.push(item.idrubro_rubros);
              }
            });
            this.allFacturas(n_fxr);
          },
          error: (e) => console.error(e),
        });
        break;
      default:
        break;
    }
  }
  async getFacturas(): Promise<any> {
    let fac = this.s_facturas.findByfechacobro(this.today).toPromise();
    return fac;
  }
  async getRubrosxfac(idfactura: number): Promise<any> {
    let rubxfa = this.s_rubroxfac.getByIdfactura(idfactura).toPromise();
    return rubxfa;
  }

  allFacturas(_datosBody: any) {
    let suma = 0;
    let numFacturas = 0;
    let datosBody: any = [];
    _datosBody.forEach((item: any) => {
      item.totaltarifa += item.interescobrado;
      if (item.idmodulo.idmodulo === 3) item.totaltarifa += 1;
      datosBody.push([
        item.idfactura,
        item.nrofactura,
        item.idmodulo.descripcion,
        item.fechacobro,
        item.totaltarifa.toFixed(2),
      ]);
      numFacturas++;
      suma += item.totaltarifa;
    });

    let doc = new jsPDF('p', 'pt', 'a4');
    this._pdf.header('REPORTE GENERAL DE CAJAS', doc);
    let m_izquierda = 10;

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
      head: [['Planilla', 'Nro Factura', 'Módulo', 'Fecha cobro', 'Total']],
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

      body: datosBody,

      didParseCell: function (data) {
        var fila = data.row.index;
        var columna = data.column.index;
        //if (columna === 4 && data.cell.section === 'body') { data.cell.text[0] = formatNumber(+data.cell.raw!); }
        /*     if (fila === datosBody.length - 1) {
                data.cell.styles.fontStyle = 'bold';
              }  */ // Total Bold
      },
    });
    autoTable(doc, {
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

      body: [['Total', numFacturas, suma.toFixed(2)]],
    });

    addPageNumbers();

    var opciones = {
      filename: 'lecturas.pdf',
      orientation: 'portrait',
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
      embed.setAttribute('width', '50%');
      embed.setAttribute('height', '75%');
      embed.setAttribute('id', 'idembed');
      //Agrega el <embed> al contenedor del Modal
      var container: any;
      container = document.getElementById('pdf');
      container.appendChild(embed);
    }
  }
  allRubros(_datosBody: any) {
    let doc = new jsPDF('p', 'pt', 'a4');
    this._pdf.header('REPORTE DEL DIA', doc);
    let m_izquierda = 10;
    let suma = 0;
    let numFacturas = 0;
    let datosBody: any = [];
    _datosBody.forEach((item: any, index: number) => {
      item.totaltarifa += item.interescobrado;
      if (item.idmodulo.idmodulo === 3) item.totaltarifa += 1;
      datosBody.push([
        item.idfactura,
        item.nrofactura,
        item.idmodulo.descripcion,
        item.fechacobro,
        item.totaltarifa.toFixed(2),
        item[index].rubros.descripcion,
      ]);
      numFacturas++;
      suma += item.totaltarifa;
    });
    autoTable(doc, {
      head: [
        ['Planilla', 'Nro Factura', 'Módulo', 'Fecha cobro', 'Total', 'Rubros'],
      ],
      body: datosBody,

      didDrawCell: function (data) {
        if (data.column.index === 5 && data.cell.section === 'body') {
          autoTable(doc, {
            startY: data.cell.y + 1,
            margin: { left: data.cell.x + 2 },
            tableWidth: data.cell.width - 8,
            body: [['Hola', 'hola']],
          });
        }
      },
    });
    autoTable(doc, {
      body: [['Total', numFacturas, suma.toFixed(2)]],
    });

    var opciones = {
      filename: 'lecturas.pdf',
      orientation: 'portrait',
      /*   unit: 'mm', */
      format: 'a4',
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
      embed.setAttribute('width', '50%');
      embed.setAttribute('height', '75%');
      embed.setAttribute('id', 'idembed');
      //Agrega el <embed> al contenedor del Modal
      var container: any;
      container = document.getElementById('pdf');
      container.appendChild(embed);
    }
  }
  imprimir() {
    this.router.navigate(['/imp-caja']);
  }
}
interface Caja {
  idcaja: number;
  codigo: String;
  descripcion: String;
  ptoemi: String;
  estado: String;
}

interface Rubro {
  nombre: string;
  precio: number;
}

interface Factura {
  numero: string;
  fecha: Date;
  rubros: Rubro[]; // Array of Rubro objects
}
