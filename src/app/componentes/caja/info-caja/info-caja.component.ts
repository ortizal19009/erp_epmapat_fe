import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { Cajas } from 'src/app/modelos/cajas.model';
import { Recaudaxcaja } from 'src/app/modelos/recaudaxcaja.model';
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
import { AutorizaService } from '@compartida/autoriza.service';

@Component({
  selector: 'app-info-caja',
  templateUrl: './info-caja.component.html',
  styleUrls: ['./info-caja.component.css'],
})
export class InfoCajaComponent implements OnInit {
  caja = {} as Caja; //Interface para los datos de la Caja
  cajaData: Cajas | null = null;
  elimdisabled: boolean = false;
  idcaja: number;
  _recaudaxcaja: any[] = [];
  formFechas: FormGroup;
  formCaja: FormGroup;
  filtro: string;
  otraPagina: boolean = false;
  usuario: Usuarios = new Usuarios();
  desde: any;
  hasta: any;
  sinHistorial: boolean = false;
  creandoPrimerRegistro: boolean = false;
  ordenColumna:
    | 'fechainiciolabor'
    | 'fechafinlabor'
    | 'facinicio'
    | 'facfin'
    | 'horainicio'
    | 'horafin'
    | 'estado' = 'fechainiciolabor';
  ordenAscendente: boolean = false;

  idusuario: number;

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private cajaService: CajaService,
    private recxcaja: RecaudaxcajaService,
    private _pdf: PdfService,
    private s_facturas: FacturaService,
    private s_rubroxfac: RubroxfacService,
    private s_facxrecauda: FacxrecaudaService,
    private s_recaudacion: RecaudacionService, 
    private authorizaService: AutorizaService
  ) { }

  ngOnInit(): void {
    this.idusuario = this.authorizaService.idusuario;
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
    const primerDiaMes = new Date(
      fechaActual.getFullYear(),
      fechaActual.getMonth(),
      1
    );
    const hasta = fechaActual.toISOString().slice(0, 10);
    const desde = primerDiaMes.toISOString().slice(0, 10);
    this.formFechas.patchValue({
      desde: desde,
      hasta: hasta,
    });
    this.desde = desde;
    this.hasta = hasta;
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
        this.cajaData = datos;
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
        this.cargarUltimaConexionPorDefecto();
      },
      error: (err) => console.error(err.error),
    });
  }

  cargarUltimaConexionPorDefecto() {
    this.recxcaja.getLastConexion(this.idcaja).subscribe({
      next: (dato) => {
        const registros = dato ? [dato] : [];
        this._recaudaxcaja = this.ordenarRecaudaciones(registros);
        this.sinHistorial = this._recaudaxcaja.length === 0;
      },
      error: (err) => {
        this._recaudaxcaja = [];
        this.sinHistorial = true;
        console.error(err.error ?? err);
      },
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
          const registros = Array.isArray(datos) ? datos : datos ? [datos] : [];
          this._recaudaxcaja = this.ordenarRecaudaciones(registros);
          this.sinHistorial = this._recaudaxcaja.length === 0;
        },
        error: (err) => {
          this._recaudaxcaja = [];
          this.sinHistorial = true;
          console.error(err.error ?? err);
        },
      });
  }

  ordenarPor(
    columna:
      | 'fechainiciolabor'
      | 'fechafinlabor'
      | 'facinicio'
      | 'facfin'
      | 'horainicio'
      | 'horafin'
      | 'estado'
  ): void {
    if (this.ordenColumna === columna) {
      this.ordenAscendente = !this.ordenAscendente;
    } else {
      this.ordenColumna = columna;
      this.ordenAscendente = columna === 'fechainiciolabor' ? false : true;
    }

    this._recaudaxcaja = this.ordenarRecaudaciones(this._recaudaxcaja);
  }

  crearPrimerRecaudaxcaja() {
    if (!this.cajaData || !this.cajaData.idusuario_usuarios) {
      return;
    }

    this.creandoPrimerRegistro = true;
    const fecha = new Date();
    const primerRegistro = {
      estado: 1,
      facinicio: 1,
      facfin: 1,
      fechainiciolabor: fecha,
      horainicio: fecha,
      idcaja_cajas: this.cajaData,
      idusuario_usuarios: this.cajaData.idusuario_usuarios,
    } as Recaudaxcaja;

    this.recxcaja.saveRecaudaxcaja(primerRegistro).subscribe({
      next: () => {
        this.creandoPrimerRegistro = false;
        this.cargarUltimaConexionPorDefecto();
      },
      error: (err) => {
        this.creandoPrimerRegistro = false;
        console.error(err.error ?? err);
      },
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
        (error) => console.error(error)
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

  private ordenarRecaudaciones(registros: any[]): any[] {
    return [...registros].sort((a: any, b: any) => {
      const valorA = this.obtenerValorOrden(a);
      const valorB = this.obtenerValorOrden(b);

      if (valorA == null && valorB == null) return 0;
      if (valorA == null) return 1;
      if (valorB == null) return -1;

      let comparacion = 0;
      if (typeof valorA === 'number' && typeof valorB === 'number') {
        comparacion = valorA - valorB;
      } else {
        comparacion = String(valorA).localeCompare(String(valorB), 'es', {
          numeric: true,
          sensitivity: 'base',
        });
      }

      return this.ordenAscendente ? comparacion : -comparacion;
    });
  }

  private obtenerValorOrden(registro: any): string | number | null {
    switch (this.ordenColumna) {
      case 'facinicio':
        return Number(registro?.facinicio ?? 0);
      case 'facfin':
        return Number(registro?.facfin ?? 0);
      case 'estado':
        return Number(registro?.estado ?? 0);
      case 'fechafinlabor':
      case 'horainicio':
      case 'horafin':
      case 'fechainiciolabor':
      default:
        return registro?.[this.ordenColumna]
          ? new Date(registro[this.ordenColumna]).getTime()
          : null;
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
