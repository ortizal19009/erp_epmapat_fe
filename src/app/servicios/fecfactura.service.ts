import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Fecfactura } from '../modelos/fecfactura.model';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Router } from '@angular/router';
import { FormBuilder } from '@angular/forms';
import { AutorizaService } from '../compartida/autoriza.service';
import { DefinirService } from './administracion/definir.service';
import { ColoresService } from '../compartida/colores.service';
import { FacturaService } from './factura.service';
import { RubroxfacService } from './rubroxfac.service';
import { FecFacturaDetallesService } from './fec-factura-detalles.service';
import { FecFacturaDetallesImpuestosService } from './fec-factura-detalles-impuestos.service';
import { FecFacturaPagosService } from './fec-factura-pagos.service';
import { AbonadosService } from './abonados.service';
import { UsuarioService } from './administracion/usuario.service';
import { LecturasService } from './lecturas.service';
import { Abonados } from '../modelos/abonados';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/fec_factura`;

@Injectable({
  providedIn: 'root',
})
export class FecfacturaService {
  empresa: any;
  //formExportar: FormGroup;
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
  constructor(
    private http: HttpClient,
    private router: Router,
    private fb: FormBuilder,
    public authService: AutorizaService,
    private defService: DefinirService,
    private coloresService: ColoresService,
    private facService: FacturaService,
    private rxfService: RubroxfacService,
    private fec_facdetalleService: FecFacturaDetallesService,
    private fec_facdetimpService: FecFacturaDetallesImpuestosService,
    private fec_facPagosService: FecFacturaPagosService,
    private aboService: AbonadosService,
    private s_usuario: UsuarioService,
    private s_lecturas: LecturasService
  ) {}

  getLista(): Observable<Fecfactura[]> {
    return this.http.get<Fecfactura[]>(`${baseUrl}`);
  }

  getByEstado(estado: String, limit: number): Observable<Fecfactura[]> {
    return this.http.get<Fecfactura[]>(
      `${baseUrl}/estado?estado=${estado}&limit=${limit}`
    );
  }

  getByCuenta(cuenta: String): Observable<Fecfactura[]> {
    return this.http.get<Fecfactura[]>(
      `${baseUrl}/referencia?referencia=${cuenta}`
    );
  }

  getByNombreCliente(cliente: string): Observable<Fecfactura[]> {
    return this.http.get<Fecfactura[]>(`${baseUrl}/cliente?cliente=${cliente}`);
  }

  //Save
  save(f: Fecfactura): Observable<Object> {
    return this.http.post(`${baseUrl}`, f);
  }
  updateFecFactura(fecfactura: any) {
    console.log(fecfactura);
    return this.http.put(`${baseUrl}/${fecfactura.idfactura}`, fecfactura);
  }

  /* Exportar datos */
  async datosDefinirAsync() {
    try {
      const def = await this.defService.getByIddefinirAsync(1);
      this.empresa = def;
    } catch (error) {}
  }
  async _exportar(i: number, factura: any) {
    this._facturas = factura;
    let j = 0;
    let usuario = await this.s_usuario.getByIdusuarioAsync(
      this._facturas.usuariocobro
    );
    let fecfactura = {} as Fec_factura;

    fecfactura.idfactura = this._facturas.idfactura;
    this.claveAcceso(i);
    fecfactura.claveacceso = this.claveacceso;
    fecfactura.secuencial = this._facturas.nrofactura.slice(8, 18);
    fecfactura.estado = 'I';
    fecfactura.establecimiento = this._facturas.nrofactura.slice(0, 3);
    fecfactura.puntoemision = this._facturas.nrofactura.slice(4, 7);
    fecfactura.direccionestablecimiento = this.empresa.direccion;
    fecfactura.fechaemision = this._facturas.fechacobro;
    fecfactura.tipoidentificacioncomprador =
      this._facturas.idcliente.idtpidentifica_tpidentifica.codigo;
    if (
      (this._facturas.idmodulo.idmodulo === 3 &&
        this._facturas.idabonado != 0) ||
      this._facturas.idmodulo.idmodulo === 4
    ) {
      const abonado: Abonados = await this.getAbonado(this._facturas.idabonado);
      const _lectura = await this.getLectura(this._facturas.idfactura);
      let fecEmision: Date = new Date(_lectura[0].fechaemision);
      fecfactura.razonsocialcomprador = abonado.idresponsable.nombre;
      fecfactura.identificacioncomprador = abonado.idresponsable.cedula;
      fecfactura.referencia = this._facturas.idabonado;
      fecfactura.concepto = `${
        fecEmision.getMonth() + 1
      } del ${fecEmision.getFullYear()} Nro medidor: ${
        _lectura[0].idabonado_abonados.nromedidor
      }`;
    } else {
      fecfactura.razonsocialcomprador = this._facturas.idcliente.nombre;
      fecfactura.identificacioncomprador = this._facturas.idcliente.cedula;
      fecfactura.concepto = 'OTROS SERVICIOS';
      fecfactura.referencia = 'S/N';
    }
    fecfactura.direccioncomprador = this._facturas.idcliente.direccion;
    fecfactura.telefonocomprador = this._facturas.idcliente.telefono;
    fecfactura.emailcomprador = this._facturas.idcliente.email;
    fecfactura.referencia = this._facturas.idabonado;
    fecfactura.recaudador = usuario.nomusu;
    this.tipocobro = this._facturas.formapago;
    this.save(fecfactura).subscribe({
      next: async (resp: any) => {
        this.swexportar = false;
        //this.formExportar.controls['nrofactura'].setValue('');
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
            item.forEach(async (rxf: any) => {
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
                next: async (datos: any) => {
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
                  await this.fec_facdetimpService
                    .saveFacDetalleImpuesto(detalleImpuesto)
                    .subscribe({
                      next: (detimpuesto) => {
                        console.log('guardar detalle');
                        j++;
                      },
                      error: (e) => console.error(e),
                    });
                  i++;
                },
                error: (e) => console.error(e),
              });
            });
            await this.pagos(resp, this.sumaTotal);
          });
      },
      error: (err) => {
        console.error('Al guardar en Fec_factura: ', err.error);
      },
    });
    console.log('Guardado');
  }
  async expDesdeAbonados(factura: any) {
    await this.datosDefinirAsync();
    console.log(factura);

    //this._facturas = factura;
    await this._exportar(0, factura);
  }
  async getAbonado(idabonado: number): Promise<any> {
    const abo = await this.aboService.getById(idabonado).toPromise();
    return abo;
  }
  async getLectura(idfactura: number): Promise<any> {
    const lectura = await this.s_lecturas.getByIdfactura(idfactura).toPromise();
    return lectura;
  }

  claveAcceso(i: number) {
    this.claveacceso = '';
    let fecha = formatearFecha(1, this._facturas.fechacobro); //1: Sin slash para la Clave de acceso
    let ruc = this.empresa.ruc;
    let ambiente = this.empresa.tipoambiente.toString(); //1: Pruebas  2: Producción
    //let ambiente = this.formExportar.value.ambiente.toString(); //1: Pruebas  2: Producción
    let estab = this._facturas.nrofactura.slice(0, 3);
    let ptoemi = this._facturas.nrofactura.slice(4, 7);
    let serie = estab + ptoemi;
    let secuencial = this._facturas.nrofactura.slice(8, 17);
    let codigonumerico = codigoNumerico(this._facturas.nrofactura.slice(9, 17));
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

  pagos = async (resp: any, sumaTotal: number) => {
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
    await this.fec_facPagosService.saveFacPago(pagos).subscribe({
      next: (datos) => {
        console.log('Guardado pago');
      },
      error: (e) => console.error(e),
    });
  };
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
