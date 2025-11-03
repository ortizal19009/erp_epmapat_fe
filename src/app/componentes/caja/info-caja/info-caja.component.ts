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
import { FacxrecaudaService } from 'src/app/servicios/facxrecauda.service';
import { RecaudacionService } from 'src/app/servicios/recaudacion.service';

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
    private s_rubroxfac: RubroxfacService,
    private s_facxrecauda: FacxrecaudaService,
    private s_recaudacion: RecaudacionService
  ) { }

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
    var datosBody: any = [];
    this.s_facxrecauda
      .getByUsuFecha(this.usuario.idusuario, this.desde, this.hasta)
      .subscribe({
        next: (datos: any) => {
          this.s_recaudacion
            .getByRecaudador(this.usuario.idusuario, this.desde, this.hasta)
            .subscribe({
              next: (_datos: any) => {
                let total_pagar: any = 0;
                let i = 0;
                _datos.forEach((item: any) => {
                  total_pagar += item.totalpagar;
                  //i++;
                });
                let total = 0;
                datos.forEach((item: any) => {
                  let com: number = 0;
                  let totTarifa: number = +item.idfactura.totaltarifa!;
                  let suma: number = 0;
      
                  if (
                    +item.idfactura.idmodulo.idmodulo! == 3 &&
                    item.idfactura.idabonado > 0
                  ) {
                    com = 1;
                  }
                  if (+item.idfactura.idmodulo.idmodulo! != 8) {
                    suma += +item.idfactura.interescobrado! + com + +totTarifa!;
                  } else {
                    suma +=
                      item.idfactura.valorbase + item.idfactura.interescobrado;
                  }
                  datosBody.push([
                    item.idfactura.nrofactura,
                    item.idfactura.idcliente.nombre,
                    item.idfactura.idmodulo.descripcion,
                    suma.toFixed(2),
                    item.idfactura.fechacobro,
                    item.idrecaudacion.idrecaudacion,
                    this.usuario.nomusu,
                  ]);
                  //console.log(i);
                  i++;
                  total += item.idrecaudacion.totalpagar;
                });
                this.pdf2(datosBody, total_pagar, i);
              },
              error: (e) => console.error(e),
            });
        },
        error: (e) => console.error,
      });
  }
  pdf2(datosBody: any, total: number, totalfacturas: number) {
    let _total = total.toFixed(2);
    //const nombreEmision = new NombreEmisionPipe(); // Crea una instancia del pipe
    let doc = new jsPDF('p', 'pt', 'a4');
    this._pdf.header('REPORTE INDIVIDUAL DE COBROS POR CAJA', doc);
    let m_izquierda = 10;
    const addPageNumbers = function () {
      const pageCount = doc.internal.pages.length;
      for (let i = 1; i <= pageCount - 1; i++) {
        doc.setPage(i);
        doc.setFontSize(12);
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
          'Nro recaudacion',
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

      body: datosBody,
      didParseCell: function (data) {
        var fila = data.row.index;
        var columna = data.column.index;
      },
    });
    autoTable(doc, {
      body: [['TOTAL: ', totalfacturas, _total]],
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
  imprimirReportes() {
    sessionStorage.setItem('idrecaudador', this.usuario.idusuario.toString());
    this.router.navigate(['/imp-inf-caja']);
  }
}

interface Caja {
  idcaja: number;
  codigo: String;
  descripcion: String;
  ptoemi: String;
  estado: String;
}
