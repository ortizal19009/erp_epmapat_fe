import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { CajaService } from 'src/app/servicios/caja.service';
import { RecaudaxcajaService } from 'src/app/servicios/recaudaxcaja.service';
import { CajaReportsService } from '../caja-reports.service';
import { PdfService } from 'src/app/servicios/pdf.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatNumber } from '@angular/common';
import { FacturaService } from 'src/app/servicios/factura.service';
import { Usuarios } from 'src/app/modelos/administracion/usuarios.model';
import { format, parse } from '@formkit/tempo';
import { RubroxfacService } from 'src/app/servicios/rubroxfac.service';

@Component({
  selector: 'app-info-caja',
  templateUrl: './info-caja.component.html',
  styleUrls: ['./info-caja.component.css'],
})
export class InfoCajaComponent implements OnInit {
  caja = {} as Caja; //Interface para los datos de la Caja
  elimdisabled: boolean = false;
  idcaja: number;
  _recaudaxcaja: any;
  formFechas: FormGroup;
  formCaja: FormGroup;
  filtro: string;
  otraPagina: boolean = false;
  usuario: Usuarios = new Usuarios();
  desde: any;
  hasta: any;

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private cajaService: CajaService,
    private recxcaja: RecaudaxcajaService,
    private _pdf: PdfService,
    private s_facturas: FacturaService,
    private s_rubroxfac: RubroxfacService
  ) {}

  ngOnInit(): void {
    sessionStorage.setItem('ventana', '/cajas');
    let coloresJSON = sessionStorage.getItem('/cajas');
    if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));

    this.idcaja = +sessionStorage.getItem('idcajaToInfo')!;

    this.formFechas = this.fb.group({
      caja: '',
      desde: '',
      hasta: '',
    });

    this.datosCaja();

    const fechaActual = new Date();
    let hasta = fechaActual.toISOString().slice(0, 10);
    let fechaRestada: Date = new Date();
    fechaRestada.setMonth(fechaActual.getMonth() - 1);
    let desde = fechaRestada.toISOString().slice(0, 10);
    this.formFechas.patchValue({
      desde: desde,
      hasta: hasta,
    });
    let fDate = format(fechaActual, 'YYYY-MM-DD');
    /*     let date_f = date.toISOString().slice(0, 10);
    console.log(date); */
    console.log(fDate);
    this.desde = fDate;
    this.hasta = fDate;
  }

  colocaColor(colores: any) {
    document.documentElement.style.setProperty('--bgcolor1', colores[0]);
    const cabecera = document.querySelector('.cabecera');
    if (cabecera) cabecera.classList.add('nuevoBG1');
    document.documentElement.style.setProperty('--bgcolor2', colores[1]);
    const detalle = document.querySelector('.detalle');
    if (detalle) detalle.classList.add('nuevoBG2');
  }

  datosCaja() {
    this.cajaService.getById(this.idcaja).subscribe({
      next: (datos) => {
        console.log(datos);
        this.caja.idcaja = datos.idcaja;
        this.caja.codigo = datos.codigo;
        this.caja.descripcion = datos.descripcion;
        this.caja.ptoemi = datos.idptoemision_ptoemision.establecimiento;
        if (datos.idusuario_usuarios == null) {
          alert('NO PUEDE CONSULTAR DATOS EN ESTA CAJA');
          this.router.navigate(['cajas']);
        } else {
          this.usuario = datos.idusuario_usuarios;
        }
        this.caja.estado = 'Habilitado';
        if (datos.estado == 0) this.caja.estado = 'Inahibilitado';
        this.formFechas.patchValue({
          caja:
            datos.idptoemision_ptoemision.establecimiento +
            '-' +
            datos.codigo +
            ' ' +
            datos.descripcion,
        });
        this.recaudacionxcaja();
      },
      error: (err) => console.error(err.error),
    });
  }

  recaudacionxcaja() {
    this.recxcaja
      .getByIdcaja(
        this.idcaja,
        this.formFechas.value.desde,
        this.formFechas.value.hasta
      )
      .subscribe({
        next: (datos) => {
          this._recaudaxcaja = datos;
          // console.log('Busqueda ok: ', this._recaudaxcaja)
        },
        error: (err) => console.error(err.error),
      });
  }

  regresar() {
    this.router.navigate(['/cajas']);
  }

  modiCaja() {
    localStorage.setItem('idcajaToModi', this.caja.idcaja.toString());
    this.router.navigate(['modicaja', this.caja.idcaja]);
  }

  eliminarCaja() {
    if (this.caja.idcaja != null) {
      this.cajaService.deleteCaja(this.caja.idcaja).subscribe(
        (datos) => {
          this.router.navigate(['/cajas']);
        },
        (error) => console.log(error)
      );
    }
  }
  pdf() {
    console.log(this.usuario);
    console.log(this.caja);

    var datosBody: any = [];

    var i = 0;
    this.s_facturas
      .findByUsucobro(this.usuario.idusuario, this.desde, this.hasta)
      .subscribe({
        next: (datos: any) => {
          console.log(datos);

          datos.forEach(() => {
            console.log(datos[i]);
            let suma = 0;
            this.s_rubroxfac
              .getSumaValoresUnitarios(datos[i].idfactura)
              .subscribe({
                next: (val: any) => {
                  suma = val.toFixed(2);
                },
              });
            console.log(suma);
            datosBody.push([
              datos[i].nrofactura,
              datos[i].idcliente.nombre,
              datos[i].idmodulo.descripcion,
              suma,
              datos[i].fechacobro,
              datos[i].horacobro,
              this.usuario.nomusu,
            ]);
            i++;
          });
          setTimeout(() => {
            this.pdf2(datosBody);
          }, 3000);
        },
        error: (e) => console.error(e),
      });
  }
  pdf2(datosBody: any) {
    console.log(datosBody);
    //const nombreEmision = new NombreEmisionPipe(); // Crea una instancia del pipe
    let doc = new jsPDF('p', 'pt', 'a4');
    this._pdf.header('REPORTE INDIVIDUAL DE COBROS POR CAJA', doc);
    let m_izquierda = 10;

    /*             this._facturacion.forEach(() => {
                     let fecha = this._facturacion[i].feccrea.slice(8, 10).concat('-', this._facturacion[i].feccrea.slice(5, 7), '-', this._facturacion[i].feccrea.slice(0, 4))
                     datos.push([this._facturacion[i].idfacturacion, fecha,
                     this._facturacion[i].idcliente_clientes.nombre,
                     this._facturacion[i].descripcion, this._facturacion[i].total, this._facturacion[i].cuotas]);
                     i++;
                  }); */

    //datos.push(['', 'TOTAL', '', '', this.sumtotal]);

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
          'Nro Factura',
          'Nombre y Apellido',
          'Módulo',
          'Valor',
          'Fecha cobro',
          'Hora cobro',
          'Usuario',
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
      /*       columnStyles: {
              0: { halign: 'center', cellWidth: 10 },
              1: { halign: 'center', cellWidth: 18 },
              2: { halign: 'left', cellWidth: 60 },
              3: { halign: 'left', cellWidth: 80 },
              4: { halign: 'right', cellWidth: 15 },
              5: { halign: 'center', cellWidth: 14 },
            },
            margin: { left: m_izquierda - 1, top: 19, right: 4, bottom: 13 }, */
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
}

interface Caja {
  idcaja: number;
  codigo: String;
  descripcion: String;
  ptoemi: String;
  estado: String;
}
function getSuma(idfactura: any, number: any) {
  throw new Error('Function not implemented.');
}
