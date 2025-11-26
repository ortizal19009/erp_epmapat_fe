import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { rejects } from 'assert';
import { truncate } from 'fs/promises';
import { resolve } from 'path';
import { interval, take } from 'rxjs';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { ColoresService } from 'src/app/compartida/colores.service';
import { Abonados } from 'src/app/modelos/abonados';
import { Fecfactura } from 'src/app/modelos/fecfactura.model';
import { AbonadosService } from 'src/app/servicios/abonados.service';
import { DefinirService } from 'src/app/servicios/administracion/definir.service';
import { UsuarioService } from 'src/app/servicios/administracion/usuario.service';
import { FacturaService } from 'src/app/servicios/factura.service';
import { FecFacturaDetallesImpuestosService } from 'src/app/servicios/fec-factura-detalles-impuestos.service';
import { FecFacturaDetallesService } from 'src/app/servicios/fec-factura-detalles.service';
import { FecFacturaPagosService } from 'src/app/servicios/fec-factura-pagos.service';
import { FecfacturaService } from 'src/app/servicios/fecfactura.service';
import { LecturasService } from 'src/app/servicios/lecturas.service';
import { RubroxfacService } from 'src/app/servicios/rubroxfac.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-fecfactura',
  templateUrl: './fecfactura.component.html',
  styleUrls: ['./fecfactura.component.css'],
})
export class FecfacturaComponent implements OnInit {
  empresa: any;
  formExportar: FormGroup;
  swbotones: boolean = false;
  swcalculando: boolean = false;
  txtcalculando = 'Calculando';
  _facturas: any;
  swexportar: boolean;
  swfacturas: boolean;
  claveacceso: string;
  sumaTotal: number = 0;
  tipocobro: string;
  fec_facturas: any;
  limit: number = 100;
  v_estado = 'A';
  datoBusqueda: any;
  factura: Fecfactura = new Fecfactura();
  _detalles: any;
  _pagos: any;
  impuestos: any = [];
  totalpreciounitario: number = 0;
  totalbaseimponible: number = 0;
  totalpagado: number = 0;
  estado: Boolean = false;
  btnRsend: Boolean = false;
  error: String = '';
  xml: String = '';
  txtDetails: boolean = true;
  porcNumber: number = 0;
  conter: number = 0;
  estados = [
    { nombre: 'Inicial', letra: 'I' },
    { nombre: 'Proceso', letra: 'P' },
    { nombre: 'Generado', letra: 'G' },
    { nombre: 'Error al Validar', letra: 'L' },
    { nombre: 'Error al Firmar', letra: 'M' },
    { nombre: 'Devuelta', letra: 'C' },
    { nombre: 'Error al Autorizar', letra: 'U' },
    { nombre: 'Autorizado/Enviado', letra: 'A' },
    { nombre: 'Autorizado/No Enviado', letra: 'O' },
    { nombre: 'Datos incompletos', letra: 'E' },
  ];

  filter: string;
  constructor(
    private router: Router,
    private fb: FormBuilder,
    public authService: AutorizaService,
    private defService: DefinirService,
    private coloresService: ColoresService,
    private facService: FacturaService,
    private fecfacService: FecfacturaService,
    private rxfService: RubroxfacService,
    private fec_facdetalleService: FecFacturaDetallesService,
    private fec_facdetimpService: FecFacturaDetallesImpuestosService,
    private fec_facPagosService: FecFacturaPagosService,
    private aboService: AbonadosService,
    private s_usuario: UsuarioService,
    private s_lecturas: LecturasService
  ) {}

  ngOnInit(): void {
    this.datosDefinir();
    sessionStorage.setItem('ventana', '/fecfactura');
    let coloresJSON = sessionStorage.getItem('/fecfactura');
    if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
    else this.buscaColor();

    const fechaActual = new Date();
    this.formExportar = this.fb.group({
      nrofactura: '',
      estab: '',
      ptoemi: '',
      desdeNum: '',
      hastaNum: '',
      desdeFecha: obtenerFechaActualString(fechaActual),
      hastaFecha: obtenerFechaActualString(fechaActual),
      ambiente: '',
    });
    // this.getFecFactura();
    this.getByEstado(this.v_estado, this.limit);
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
        'fecfactura'
      );
      const coloresJSON = JSON.stringify(datos);
      sessionStorage.setItem('/fecfactura', coloresJSON);
      this.colocaColor(datos);
    } catch (error) {
      console.error(error);
    }
  }

  async datosDefinirAsync() {
    try {
      const def = await this.defService.getByIddefinirAsync(1);
      this.empresa = def;
    } catch (error) {}
  }
  datosDefinir() {
    this.defService.getByIddefinir(1).subscribe({
      next: (datos) => {
        this.formExportar.patchValue({
          ambiente: datos.tipoambiente.toString(),
        });
      },
      error: (e) => console.error(e),
    });
  }

  regresar() {
    this.router.navigate(['/inicio']);
  }

  buscar() {
    this.conter = 0;
    this.datosDefinirAsync();
    this.swexportar = false;
    this.formExportar.value;
    if (
      this.formExportar.value.nrofactura != null &&
      this.formExportar.value.nrofactura != ''
    ) {
      let nrofactura = this.formExportar.value.nrofactura;
      this.facService.getByNrofactura(nrofactura).subscribe({
        next: (datos: any) => {
          this._facturas = datos;
          switch (this._facturas.length) {
            case 1:
              this.swexportar = true;
              this.swfacturas = true;
              break;
            case 0:
              //   this.s_abonados.getListaByNombreCliente(this.f_abonado.value.buscarAbonado).subscribe(datos => {
              //     this.abonado = datos;
              //   });
              break;
            default:
              break;
          }
        },
        error: (err) => console.error(err.error),
      });
    } else {
      let d = this.formExportar.value.desdeFecha;
      let h = this.formExportar.value.hastaFecha;
      this.facService.getFechaByCobro(d, h).subscribe({
        next: (datos: any) => {
          this._facturas = datos;
          if (this._facturas.length >= 1) {
            this.swexportar = true;
            this.swfacturas = true;
          }
          /*  datos.forEach((item: any) => {
          }); */
        },
      });
    }
  }
  exportar() {
    /* this._factu
    ras.forEach((item: any, index: number) => {
      //await this._exportar(index);
      // this.changeDato();
      }); */
    const numbers = interval(1000);
    const takeFourNumbers = numbers.pipe(take(this._facturas.length));
    takeFourNumbers.subscribe((x) => {
      this.fecfacService.expDesdeAbonados(this._facturas[x]).then((item: any) => {
        console.log('exportado', this._facturas[x].nrofactura);

      }) ;
      this.porcNumber = x;
      if (this._facturas.length - 1 === x) {
        this.swfacturas = false;
        this.swexportar = false;
      }
      this.conter = (x * 100) / this._facturas.length;
    });
    this._facturas.forEach(async (item: any) => {});
  }
  async _exportar(i: number) {
    let j = 0;
    let usuario = await this.s_usuario.getByIdusuarioAsync(
      this._facturas[i].usuariocobro
    );
    let fecfactura = {} as Fec_factura;

    fecfactura.idfactura = this._facturas[i].idfactura;
    this.claveAcceso(i);
    fecfactura.claveacceso = this.claveacceso;
    fecfactura.secuencial = this._facturas[i].nrofactura.slice(8, 18);
    fecfactura.estado = 'I';
    fecfactura.establecimiento = this._facturas[i].nrofactura.slice(0, 3);
    fecfactura.puntoemision = this._facturas[i].nrofactura.slice(4, 7);
    fecfactura.direccionestablecimiento = this.empresa.direccion;
    fecfactura.fechaemision = this._facturas[i].fechacobro;
    fecfactura.tipoidentificacioncomprador =
      this._facturas[i].idcliente.idtpidentifica_tpidentifica.codigo;
    if (
      (this._facturas[i].idmodulo.idmodulo === 3 &&
        this._facturas[i].idabonado > 0) ||
      this._facturas[i].idmodulo.idmodulo === 4
    ) {
      const abonado: Abonados = await this.getAbonado(
        this._facturas[i].idabonado
      );
      const _lectura = await this.getLectura(this._facturas[i].idfactura);
      let fecEmision: Date = new Date(_lectura[0].fechaemision);
      fecfactura.razonsocialcomprador = abonado.idresponsable.nombre;
      fecfactura.identificacioncomprador = abonado.idresponsable.cedula;
      fecfactura.referencia = this._facturas[i].idabonado;
      fecfactura.concepto = `${
        fecEmision.getMonth() + 1
      } del ${fecEmision.getFullYear()} Nro medidor: ${
        _lectura[0].idabonado_abonados.nromedidor
      }`;
    } else {
      fecfactura.razonsocialcomprador = this._facturas[i].idcliente.nombre;
      fecfactura.identificacioncomprador = this._facturas[i].idcliente.cedula;
      fecfactura.concepto = 'OTROS SERVICIOS';
      fecfactura.referencia = 'S/N';
    }
    fecfactura.direccioncomprador = this._facturas[i].idcliente.direccion;
    fecfactura.telefonocomprador = this._facturas[i].idcliente.telefono;
    fecfactura.emailcomprador = this._facturas[i].idcliente.email;
    fecfactura.referencia = this._facturas[i].idabonado;
    fecfactura.recaudador = usuario.nomusu;
    this.tipocobro = this._facturas[i].formapago;
    this.fecfacService.save(fecfactura).subscribe({
      next: async (resp: any) => {
        this.swexportar = false;
        this.formExportar.controls['nrofactura'].setValue('');
        this.swfacturas = false;
        let codImpuesto = 0;
        if (resp.fechacobro <= '2024-03-31') {
          codImpuesto = 2;
        } else {
          codImpuesto = 4;
        }
        /* CONSULTO LOS RUBROS DE LA FACTURA */
        await this.rxfService
          .getRubrosAsync(resp.idfactura)
          .then(async (item: any) => {
            let i = 0;
            this.sumaTotal = 0;
            /* POR CADA RUBRO QUE TIENE LA FACTURA ARMO EL OBJETO DETALLE PARA GUARDARLO */
            await item.forEach(async (rxf: any) => {
              let detalle = {} as Fec_factura_detalles;
              let basImponible: number = 0;
              detalle.idfacturadetalle = rxf.idrubroxfac;
              detalle.idfactura = rxf.idfactura_facturas.idfactura;
              detalle.codigoprincipal = rxf.idrubro_rubros.idrubro;
              detalle.descripcion = rxf.idrubro_rubros.descripcion;
              detalle.cantidad = rxf.cantidad;
              detalle.preciounitario = rxf.valorunitario;
              detalle.descuento = 0;
              basImponible += rxf.cantidad * rxf.valorunitario;
              /* GUARDO EL OBJETO DETALLE */
              this.fec_facdetalleService.saveFacDetalle(detalle).subscribe({
                next: (datos: any) => {
                  let iva = 0;
                  if (rxf.idrubro_rubros.swiva === true) {
                    if ((codImpuesto = 2)) {
                      iva = rxf.valorunitario * 0.12;
                    }
                    if ((codImpuesto = 4)) {
                      iva = rxf.valorunitario * 0.15;
                    }
                  } else {
                    codImpuesto = 0;
                  }
                  this.sumaTotal += rxf.cantidad * rxf.valorunitario + iva;
                  let secuencialImpuestos: String =
                    rxf.idrubroxfac.toString() + i;
                  /* MIENTRAS GUARDO EL DETALLE ARMO EL OBJETO DETALLE IMPUESTO */
                  let detalleImpuesto = {} as Fec_factura_detalles_impuestos;
                  detalleImpuesto.idfacturadetalleimpuestos =
                    +secuencialImpuestos!;
                  detalleImpuesto.idfacturadetalle = rxf.idrubroxfac;
                  detalleImpuesto.codigoimpuesto = '2';
                  detalleImpuesto.codigoporcentaje = codImpuesto.toString();
                  detalleImpuesto.baseimponible = basImponible;
                  /*          this.fec_facdetimpService
                    .saveFacDetalleImpuesto(detalleImpuesto)
                    .subscribe({
                      next: (detimpuesto) => {
                        j++;
                      },
                      error: (e) => console.error(e),
                    }); */
                  i++;
                },
                error: (e) => console.error(e),
              });
            });
            setTimeout(() => {
              this.pagos(resp, this.sumaTotal);
            }, 350);
          });
      },
      error: (err) => {
        console.error('Al guardar en Fec_factura: ', err.error);
      },
    });
  }
  expDesdeAbonados(factura: any) {
    console.log(factura);

    //this._facturas = factura;
    //this._exportar(0);
  }
  async getAbonado(idabonado: number): Promise<any> {
    console.log('tratando de imprimir ');
    const abo = await this.aboService.getById(idabonado).toPromise();
    return abo;
  }
  async getLectura(idfactura: number): Promise<any> {
    const lectura = await this.s_lecturas.getByIdfactura(idfactura).toPromise();
    return lectura;
  }
  claveAcceso(i: number) {
    this.claveacceso = '';
    let fecha = formatearFecha(1, this._facturas[i].feccrea); //1: Sin slash para la Clave de acceso
    let ruc = this.empresa.ruc;
    //let ambiente = this.empresa.tipoambiente.toString(); //1: Pruebas  2: Producción
    let ambiente = this.formExportar.value.ambiente.toString(); //1: Pruebas  2: Producción
    let estab = this._facturas[i].nrofactura.slice(0, 3);
    let ptoemi = this._facturas[i].nrofactura.slice(4, 7);
    let serie = estab + ptoemi;
    let secuencial = this._facturas[i].nrofactura.slice(8, 17);
    let codigonumerico = codigoNumerico(
      this._facturas[i].nrofactura.slice(9, 17)
    );
    let tipoemision = '1'; //1: Normal
    this.claveacceso =
      this.claveacceso +
      fecha +
      '01' +
      ruc +
      ambiente +
      serie +
      secuencial +
      codigonumerico +
      tipoemision;
    let verificador = modulo11(this.claveacceso);
    this.claveacceso = this.claveacceso + verificador; //Dígito Verificador (Módulo 11)
  }

  pagos = (resp: any, sumaTotal: number) => {
    let pagos = {} as Fec_factura_pagos;
    switch (this.tipocobro.toString()) {
      case '1':
        pagos.formapago = '01';
        break;
      case '3':
        pagos.formapago = '01';
        break;
      case '4':
        pagos.formapago = '20';
        break;
      case '5':
        pagos.formapago = '19';
        break;
      case '6':
        pagos.formapago = '01';
        break;
      case '7':
        pagos.formapago = '20';
        break;
    }
    let secuencialPagos: String = resp.idfactura.toString() + 0; //cambiar el 0 por un valor autoincrementable cuando sea mas de una factura
    pagos.idfacturapagos = +secuencialPagos!;
    pagos.idfactura = resp.idfactura;
    pagos.total = sumaTotal;
    pagos.plazo = 0;
    pagos.unidadtiempo = 'dias';
    this.fec_facPagosService.saveFacPago(pagos).subscribe({
      next: (datos) => {},
      error: (e) => console.error(e),
    });
  };
  getFecFactura() {
    this.fecfacService.getLista().subscribe({
      next: (datos: any) => {
        this.fec_facturas = datos;
      },
      error: (e) => {
        console.error(e);
      },
    });
  }
  changeDato() {
    this.getByEstado(this.v_estado, this.limit);
  }
  getByEstado(estado: String, limit: number) {
    this.fecfacService.getByEstado(estado, limit).subscribe({
      next: (datos: any) => {
        this.fec_facturas = datos;
      },
      error: (e) => console.error(e),
    });
  }
  getByClienteCuenta() {
    this.fecfacService
      .getByNombreCliente(this.datoBusqueda.toLowerCase())
      .subscribe({
        next: (dato: any) => {
          if (dato.length === 0) {
            this.fecfacService.getByCuenta(this.datoBusqueda).subscribe({
              next: (datos: any) => {
                this.fec_facturas = datos;
              },
              error: (e) => console.error(e),
            });
          } else {
            this.fec_facturas = dato;
          }
        },
        error: (e) => console.error(e),
      });
  }
  setFactura(factura: any) {
    this.txtDetails = true;
    this.totalpreciounitario = 0;
    this.totalbaseimponible = 0;
    this.totalpagado = 0;
    this.impuestos = [];
    this.factura = factura;
    this.fec_facdetalleService
      .getFecDetalleByIdfactura(factura.idfactura)
      .subscribe({
        next: (detalles: any) => {
          this._detalles = detalles;
          detalles.forEach((item: any, index: number) => {
            this.totalpreciounitario += item.preciounitario;
            this.fec_facdetimpService
              .getFecFacDetalleService(item.idfacturadetalle)
              .subscribe({
                next: (impuestos: any) => {
                  impuestos.forEach((item: any) => {
                    this.impuestos.push(item);
                    this.totalbaseimponible += item.baseimponible;
                  });
                },
                error: (e) => console.error(e),
              });
          });
        },
        error: (e) => console.error(e),
      });
    this.fec_facPagosService.getByIdfactura(factura.idfactura).subscribe({
      next: (pagos: any) => {
        pagos.forEach((item: any, index: number) => {
          this.totalpagado += item.total;
        });
        this._pagos = pagos;
      },
      error: (e) => console.error(e),
    });
  }
  deleteImpuesto(detalle: any) {
    this.fec_facdetimpService
      .deleteImpuesto(detalle.idfacturadetalleimpuestos)
      .subscribe({
        next: (datos) => {
          this.setFactura(this.factura);
        },
        error: (e) => console.error(e),
      });
  }
  showError() {
    this.error = '';
    this.error = this.factura.errores;
    this.txtDetails = !this.txtDetails;
  }
  showXml() {
    this.error = '';
    this.error = this.factura.xmlautorizado;
    this.txtDetails = !this.txtDetails;
  }
  validarEstado(estado: any) {
    switch (estado) {
      case 'A':
        this.estado = false;
        break;
      case 'O':
        this.estado = false;
        break;
      case 'U':
        if (this.totalbaseimponible === this.totalpagado) {
          this.btnRsend = true;
        } else {
          this.btnRsend = false;
        }
        this.estado = true;
        break;
      case 'C':
        this.estado = true;
        break;
    }
    return this.estado;
    /* factura.estado === 'A' || factura.estado === 'O' || factura.estado === 'C' */
  }

  reSend() {
    let fac: any = this.factura;
    fac.errores = '';
    fac.estado = 'I';
    this.fecfacService.save(fac).subscribe({
      next: (datos: any) => {},
      error: (e) => console.error(e),
    });
  }
  getXmlAutorizadoSri(fecfactura: any) {
    this.fecfacService.setxml(fecfactura).subscribe({
      next: (datos: any) => {
        console.log(datos);
      },
      error: (e: any) => console.error(e),
    });
  }
  async getFacturaPDF(idfactura: number) {
    try {
      // Espera la respuesta del backend (asegúrate de usar { responseType: 'blob' } en el servicio)
      const pdfBlob = await this.facService.generarPDF_FacElectronica(
        idfactura
      );

      // Crear una URL temporal del blob
      const fileURL = URL.createObjectURL(pdfBlob);

      // Crear un enlace invisible para forzar descarga
      const a = document.createElement('a');
      a.href = fileURL;
      a.download = `factura_${idfactura}.pdf`; // nombre del archivo
      document.body.appendChild(a);
      a.click();

      // Liberar recursos
      document.body.removeChild(a);
      URL.revokeObjectURL(fileURL);
    } catch (err) {
      console.error('Error al descargar la factura PDF:', err);
    }
  }

  swal(icon: any, mensaje: any) {
    Swal.fire({
      toast: true,
      icon: icon,
      title: mensaje,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
    });
  }
}

interface Fec_factura {
  idfactura: number;
  claveacceso: String;
  secuencial: String;
  xmlautorizado: String;
  errores: String;
  estado: String;
  establecimiento: String;
  puntoemision: String;
  direccionestablecimiento: String;
  fechaemision: Date;
  tipoidentificacioncomprador: String;
  guiaremision: String;
  razonsocialcomprador: String;
  identificacioncomprador: String;
  direccioncomprador: String;
  telefonocomprador: String;
  emailcomprador: String;
  concepto: String;
  referencia: String;
  recaudador: String;
}
interface Fec_factura_detalles {
  idfacturadetalle: number;
  idfactura: number;
  codigoprincipal: String;
  descripcion: String;
  cantidad: number;
  preciounitario: number;
  descuento: number;
}
interface Fec_factura_detalles_impuestos {
  idfacturadetalleimpuestos: number;
  idfacturadetalle: number;
  codigoimpuesto: String;
  codigoporcentaje: String;
  baseimponible: number;
}
interface Fec_factura_pagos {
  idfacturapagos: number;
  idfactura: number;
  formapago: String;
  total: number;
  plazo: number;
  unidadtiempo: String;
}
function obtenerFechaActualString(fecha: Date) {
  const milisegundos = fecha.getTime(); // Obtener milisegundos desde la fecha
  const fechaActual = new Date(milisegundos);
  const anio = fechaActual.getFullYear();
  const mes = fechaActual.getMonth() + 1; // Los meses en JavaScript van de 0 a 11
  const dia = fechaActual.getDate();
  // Formatear la fecha a string con el formato deseado
  return `${anio}-${mes.toString().padStart(2, '0')}-${dia
    .toString()
    .padStart(2, '0')}`;
}

//Transforma la fecha: opcion 1: para la clave de acceso sin slash opcion=2 para el XML con slash
function formatearFecha(opcion: number, fecha: string): string {
  const dia = fecha.slice(8, 11);
  const mes = fecha.slice(5, 7);
  const año = fecha.slice(0, 4);
  if (opcion == 1) return `${dia}${mes}${año}`;
  else return `${dia}/${mes}/${año}`;
}

//Código numérico de la Clave de acceso
function codigoNumerico(as_numero: string): string {
  let ls_rtn = '';
  for (let li_i = as_numero.length - 1; li_i >= 0; li_i--) {
    ls_rtn += as_numero.charAt(li_i);
  }
  return ls_rtn;
}

function modulo11(as_clave: string): string {
  //Clave al reves
  let ls_evalc = '';
  for (let li_i = 47; li_i >= 0; li_i--) {
    ls_evalc += as_clave.charAt(li_i);
  }

  //Multiplica cada caracter por (2,3,4,5,6,7) y acumula
  let ll_kont = 0;
  let ll_total = 0;
  const multiplicadores = [2, 3, 4, 5, 6, 7]; // Arreglo de multiplicadores
  for (let li_i = 0; li_i < ls_evalc.length; li_i++) {
    const ll_numero = parseInt(ls_evalc.charAt(li_i), 10);
    const ll_producto = ll_numero * multiplicadores[ll_kont]; // Aplica el multiplicador
    ll_total += ll_producto;
    ll_kont = (ll_kont + 1) % 6; // Actualiza el contador cíclico (0-5)
  }

  //Calcula el Residuo y el Dígito verificador
  let ll_residuo = ll_total % 11;
  let ll_rtn = 11 - ll_residuo;

  //Cambia 11 a 0 y 10 a 1
  let ls_rtn: string;
  switch (ll_rtn) {
    case 11:
      ls_rtn = '0';
      break;
    case 10:
      ls_rtn = '1';
      break;
    default:
      ls_rtn = ll_rtn.toString();
  }
  return ls_rtn;
}
