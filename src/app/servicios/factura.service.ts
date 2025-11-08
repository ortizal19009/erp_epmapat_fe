import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, firstValueFrom, map } from 'rxjs';
import { Facturas } from '../modelos/facturas.model';
import { environment } from 'src/environments/environment';
import { InteresesService } from './intereses.service';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/facturas`;

@Injectable({
  providedIn: 'root',
})
export class FacturaService {
  constructor(private http: HttpClient, private s_interes: InteresesService) { }

  getListaByNroFactura(nrofactura: String) {
    return this.http.get<Facturas>(`${baseUrl}?nrofactura=${nrofactura}`);
  }
  //Pre Facturas por Abonado

  valLastFac(codrecaudador: string) {
    return this.http.get(`${baseUrl}/validador/-${codrecaudador}-`);
  }

  findByUsucobro(idusuario: number, d: Date, h: Date) {
    return this.http.get(
      `${baseUrl}/reportes/individual?idusuario=${idusuario}&dfecha=${d}&hfecha=${h}`
    );
  }
  findByfechacobro(fechacobro: Date) {
    return this.http.get(
      `${baseUrl}/reportes/fechacobro?fechacobro=${fechacobro}`
    );
  }

  getLista(): Observable<Facturas[]> {
    return this.http.get<Facturas[]>(`${baseUrl}`);
  }

  getListaFacturas(): Observable<Facturas[]> {
    return this.http.get<Facturas[]>(`${baseUrl}`);
  }

  getByNrofactura(nrofactura: String) {
    return this.http.get<Facturas>(
      `${baseUrl}/nrofactura?nrofactura=${nrofactura}`
    );
  }

  //Facturas por Cliente
  getByIdcliente(idcliente: number, long: number) {
    return this.http.get<Facturas>(`${baseUrl}?idcliente=${idcliente}&limit=${long}`);
  }
  //Lista de Facturas desde/hasta
  getDesdeHasta(desde: number, hasta: number) {
    return this.http.get<Facturas>(`${baseUrl}?desde=${desde}&hasta=${hasta}`);
  }
  //Pre Facturas por Abonado
  getByIdabonado(idabonado: number) {
    return this.http.get<Facturas[]>(`${baseUrl}/idabonado/${idabonado}`);
  }
  getByIdabonadorango(idabonado: number, limit: number) {
    return this.http.get<Facturas[]>(
      `${baseUrl}/abonado/${idabonado}/${limit}`
    );
  }

  //Una Planilla (como lista)
  getPlanilla(idfactura: number) {
    return this.http.get<Facturas[]>(
      `${baseUrl}/planilla?idfactura=${idfactura}`
    );
  }

  //Planillas por idabonado y fechas
  getPorabonado(
    idabonado: number,
    fechaDesde: Date,
    fechaHasta: Date
  ): Observable<Facturas[]> {
    return this.http.get<Facturas[]>(
      `${baseUrl}/porabonado?idabonado=${idabonado}&fechaDesde=${fechaDesde}&fechaHasta=${fechaHasta}`
    );
  }
  /* GLOBALES */
  //Recaudación diaria - Facturas cobradas async
  async getByFechacobroAsync(fecha: Date): Promise<any[]> {
    const response = await firstValueFrom(
      this.http.get<any[]>(`${baseUrl}/cobradastot?fecha=${fecha}`)
    );
    return response;
  }
  //Recaudación diaria - Facturas cobradas async (sumando los rubros)
  async getByFechacobroTotAsync(fecha: Date): Promise<any[]> {
    const response = await firstValueFrom(
      this.http.get<any[]>(`${baseUrl}/cobradastot?fecha=${fecha}`)
    );
    return response;
  }
  //Recaudación diaria - Resumen: Por Forma de cobro
  async totalFechaFormacobroAsync(fecha: Date): Promise<any[]> {
    const response = await firstValueFrom(
      this.http.get<any[]>(`${baseUrl}/totalformacobro?fecha=${fecha}`)
    );
    return response;
  }
  /* POR RANGOS */
  //Recaudación diaria - Facturas cobradas async (sumando los rubros)
  async getByFechacobroTotRangosAsync(
    d_fecha: any,
    h_fecha: any
  ): Promise<any[]> {
    const response = await firstValueFrom(
      this.http.get<any[]>(
        `${baseUrl}/reportes/cobradastotrangos?d_fecha=${d_fecha}&h_fecha=${h_fecha}`
      )
    );
    return response;
  }
  //Recaudación diaria - Resumen: Por Forma de cobro
  async totalFechaFormacobroRangosAsync(
    d_fecha: Date,
    h_fecha: Date
  ): Promise<any[]> {
    const response = await firstValueFrom(
      this.http.get<any[]>(
        `${baseUrl}/reportes/totalformacobrorangos?d_fecha=${d_fecha}&h_fecha=${h_fecha}`
      )
    );
    return response;
  }
  /* POR RECAUDADOR */

  //Recaudación diaria - Facturas cobradas async (sumando los rubros)
  async getByFechacobroTotByRecaudadorAsync(
    d_fecha: Date,
    h_fecha: Date,
    idrecaudador: number
  ): Promise<any[]> {
    const response = await firstValueFrom(
      this.http.get<any[]>(
        `${baseUrl}/reportes/cobradastot?d_fecha=${d_fecha}&h_fecha=${h_fecha}&idrecaudador=${idrecaudador}`
      )
    );
    return response;
  }

  //Recaudación diaria - Resumen: Por Forma de cobro
  async totalFechaFormacobroByRecaudadorAsync(
    d_fecha: Date,
    h_fecha: Date,
    idrecaudador: number
  ): Promise<any[]> {
    const response = await firstValueFrom(
      this.http.get<any[]>(
        `${baseUrl}/reportes/totalformacobro?d_fecha=${d_fecha}&h_fecha=${h_fecha}&idrecaudador=${idrecaudador}`
      )
    );
    return response;
  }

  getFacturaByAbonado(idabonado: number) {
    return this.http.get<Facturas[]>(`${baseUrl}/f_abonado/${idabonado}`);
  }

  //Save
  saveFactura(f: Facturas): Observable<Object> {
    return this.http.post(`${baseUrl}`, f);
  }

  //Save async
  async saveFacturaAsync(factura: Facturas): Promise<any> {
    const observable = this.http.post(baseUrl, factura);
    return await firstValueFrom(observable);
  }

  //Save async devuelve el idfactura generado
  async saveFacturaAsyncId(factura: any): Promise<number> {
    const observable = this.http.post<Facturas>(baseUrl, factura);
    return await firstValueFrom(
      observable.pipe(map((response) => response.idfactura))
    );
  }

  getById(idfactura: number): Observable<Facturas> {
    return this.http.get<Facturas>(`${baseUrl}/${idfactura}`);
  }
  async getByIdAsync(idfactura: number): Promise<any> {
    let response = firstValueFrom(
      this.http.get<any>(`${baseUrl}/${idfactura}`)
    );
    return response;
  }

  //Planillas sin Cobro de un Cliente
  getSinCobro(idcliente: number) {
    return this.http.get<Facturas[]>(`${baseUrl}/idcliente/${idcliente}`);
  }
  getFacturasCVClientes(idcliente: number, date: any) {
    return this.http.get<Facturas[]>(`${baseUrl}/factCarteraVencida?idcliente=${idcliente}&date=${date}`);
  }
  getFacSincobro(idcliente: number) {
    return this.http.get<Facturas[]>(
      `${baseUrl}/facSincobrar?idcliente=${idcliente}`
    );
  }
  getFacSincobroBycuenta(cuenta: number) {
    return this.http.get<Facturas[]>(
      `${baseUrl}/facSincobrar/cuenta?cuenta=${cuenta}`
    );
  }

  //IDs de las Planillas sin cobrar de un Abonado
  getSinCobroAbo(idabonado: number) {
    return this.http.get<number[]>(
      `${baseUrl}/sincobro?idabonado=${idabonado}`
    );
  }
  /* opcion para cambio de propietario */
  async getAllFacturasByCuenta(idabonado: number): Promise<any> {
    let resp = await firstValueFrom(this.http.get<any>(
      `${baseUrl}/byCuenta?cuenta=${idabonado}`
    ))
    return resp;
  }

  //Cuenta las Planillas pendientes de un Abonado
  // getPendientesAbonado(idabonado: number) {
  //    return this.http.get<number>(`${baseUrl}/pendientesabonado?idabonado=${idabonado}`);
  // }

  //Cuenta las Planillas pendientes de un Abonado Async
  async getPendientesAbonadoAsync(idabonado: number): Promise<number> {
    const observable = this.http.get<number>(
      `${baseUrl}/pendientesabonado?idabonado=${idabonado}`
    );
    return await firstValueFrom(observable);
  }

  //Planillas sin Cobrar por Modulo y Abonado (Para Convenios)
  getSinCobrarAbo(idmodulo: number, idabonado: number) {
    return this.http.get<Facturas[]>(
      `${baseUrl}/sincobrarAbo?idmodulo=${idmodulo}&idabonado=${idabonado}`
    );
  }
  //Planillas sin Cobrar por Modulo y Abonado (Para Convenios)
  getSinCobrarAboMod(idabonado: number) {
    return this.http.get<Facturas[]>(
      `${baseUrl}/?idabonado=${idabonado}`
    );
  }
  getSinCobrar(idabonado: number) {
    return this.http.get<Facturas[]>(
      `${baseUrl}/sincobrar/cuenta?cuenta=${idabonado}`
    );
  }
  async countSinCobrarAbo(idabonado: number) {
    const resp = this.http.get<Facturas[]>(
      `${baseUrl}/sincobrarAboMod/count?idabonado=${idabonado}`
    );
    return await firstValueFrom(resp);
  }

  getDeudaConsumo(idabonado: number) {
    return this.http.get<Facturas[]>(
      `${baseUrl}/deudaconsumo?idabonado=${idabonado}`
    );
  }

  getDeuda(idcliente: number) {
    return this.http.get<Facturas[]>(`${baseUrl}/deuda?idcliente=${idcliente}`);
  }

  updateFacturas(fac: Facturas) {
    return this.http.put(`${baseUrl}/${fac.idfactura}`, fac);
  }

  //Update async
  async updateFacturaAsync(fac: any): Promise<Object> {
    const observable = this.http.put(`${baseUrl}/${fac.idfactura}`, fac);
    return await firstValueFrom(observable);
  }

  getByNroFacturaModulo(nrofactura: String, idmodulo: number) {
    return this.http.get<Facturas>(
      `${baseUrl}/nrofmodulo?nrofactura=${nrofactura}&idmodulo=${idmodulo}`
    );
  }
  /* reporte de eliminacionwes */

  getByFecEliminacion(d: Date, h: Date) {
    return this.http.get<Facturas>(
      `${baseUrl}/eliminaciones/fechas?d=${d}&h=${h}`
    );
  }
  findByFecEliminacion(d: Date, h: Date) {
    return this.http.get<any>(
      `${baseUrl}/reportes/facturasEliminadas?d=${d}&h=${h}`
    );
  }
  findByFecAnuladas(d: Date, h: Date) {
    return this.http.get<any>(
      `${baseUrl}/reportes/facturasanuladas?d=${d}&h=${h}`
    );
  }
  /* reporte de anulaciones */
  getByFecAnulaciones(d: Date, h: Date) {
    return this.http.get<Facturas>(
      `${baseUrl}/anulaciones/fechas?d=${d}&h=${h}`
    );
  }

  /*============================
  ------ REPORTES JASPER -------
  ============================*/

  reporteFacturas(v_dfecha: Date, v_hfecha: Date) {
    console.log(v_dfecha, v_hfecha);
    return this.http.get(
      `${baseUrl}/reportes/facturascobradas?v_dfecha=${v_dfecha}&v_hfecha=${v_hfecha}`,
      { responseType: 'blob' }
    );
  }
  reporteFacturasRubros(v_dfecha: Date, v_hfecha: Date, c_feccrea: Date) {
    console.log(v_dfecha, v_hfecha, c_feccrea);
    return this.http.get(
      `${baseUrl}/reportes/facturasrubros?v_dfecha=${v_dfecha}&v_hfecha=${v_hfecha}&c_feccrea=${c_feccrea}`,
      { responseType: 'blob' }
    );
  }
  reporteFacturasCaja(v_dfecha: Date, v_hfecha: Date, usuariocobro: number) {
    return this.http.get(
      `${baseUrl}/reportes/facturascobradascaja?v_dfecha=${v_dfecha}&v_hfecha=${v_hfecha}&usuariocobro=${usuariocobro}`,
      { responseType: 'blob' }
    );
  }
  reporteFacturasRubrosCaja(
    v_dfecha: Date,
    v_hfecha: Date,
    c_feccrea: Date,
    usuariocobro: number
  ) {
    return this.http.get(
      `${baseUrl}/reportes/facturasrubroscaja?v_dfecha=${v_dfecha}&v_hfecha=${v_hfecha}&c_feccrea=${c_feccrea}&usuariocobro=${usuariocobro}`,
      { responseType: 'blob' }
    );
  }

  //ANULACIONES
  findAnulaciones(limit: number) {
    return this.http.get<Facturas[]>(`${baseUrl}/anulaciones?limit=${limit}`);
  }
  findCobradas(idcliente: number) {
    return this.http.get<Facturas[]>(
      `${baseUrl}/cobradas/cliente?idcliente=${idcliente}`
    );
  }
  //ELIMICAIONES
  findEliminadas(limit: number) {
    return this.http.get<Facturas[]>(`${baseUrl}/eliminaciones?limit=${limit}`);
  }
  /* transferencias cobradas */
  async transferenciasCobradas(v_dfecha: Date, v_hfecha: Date): Promise<any[]> {
    const response = await firstValueFrom(
      this.http.get<any[]>(
        `${baseUrl}/transferencias?v_dfecha=${v_dfecha}&v_hfecha=${v_hfecha}`
      )
    );
    return response;
  }
  getFechaByCobro(d: Date, h: Date) {
    return this.http.get<Facturas>(`${baseUrl}/rangofeccobro?d=${d}&h=${h}`);
  }
  /* CALCULAR INTERESES */
  calcularIntereses(idfactura: number) {
    this.s_interes.getListaIntereses().subscribe({
      next: (_intereses: any) => {
        console.log(_intereses);
      },
    });
  }
  // Cartera de un cliente a una fecha Async (Facturas)
  async getCarteraClienteAsync(idcliente: number, hasta: Date): Promise<any[]> {
    // console.log( `${baseUrl}/carteraCliente?idcliente=${idcliente}&hasta=${hasta}` )
    const response = await firstValueFrom(
      this.http.get<any[]>(
        `${baseUrl}/carteraCliente?idcliente=${idcliente}&hasta=${hasta}`
      )
    );
    return response;
  }
  // Cartera de un cliente a una fecha Async (Total, el Backend ya devuelve sumado 1 a los del modulo 3)
  async getTotCarteraClienteAsync(
    idcliente: number,
    hasta: Date
  ): Promise<any[]> {
    // console.log( `${baseUrl}/totCarteraCliente?idcliente=${idcliente}&hasta=${hasta}` );
    const response = await firstValueFrom(
      this.http.get<any[]>(
        `${baseUrl}/totCarteraCliente?idcliente=${idcliente}&hasta=${hasta}`
      )
    );
    return response;
  }
  async getFacAllTransferidas(d: Date, h: Date) {
    return this.http
      .get(`${baseUrl}/reportes/alltransferencias?d=${d}&h=${h}`)
      .toPromise();
  }
  async getFacPagadasTransferidas(d: Date, h: Date) {
    return this.http
      .get(`${baseUrl}/reportes/pagadastransferencias?d=${d}&h=${h}`)
      .toPromise();
  }
  async getFacNoPagadasTransferidas(d: Date, h: Date) {
    return this.http
      .get(`${baseUrl}/reportes/nopagadastransferencias?d=${d}&h=${h}`)
      .toPromise();
  }
  getCVFacturaconsumo(fecha: any) {
    return this.http.get(`${baseUrl}/reportes/CV_consumo?fecha=${fecha}`);
  }
  getCVFacturasNOconsumo(fecha: any) {
    return this.http.get(`${baseUrl}/reportes/CV_noconsumo?fecha=${fecha}`);
  }
  getCVconsumo(fecha: any, page: number, size: number) {
    return this.http.get(`${baseUrl}/CV_consumo?fecha=${fecha}&page=${page}&size=${size}`);
  }
  getCVNOconsumo(fecha: any, page: number, size: number) {
    return this.http.get(`${baseUrl}/CV_noconsumo?fecha=${fecha}&page=${page}&size=${size}`);
  }
  getCvFacturasByRubro(idrubro: number, fecha: any) {
    return this.http.get(
      `${baseUrl}/reportes/cv_facxrubro?idrubro=${idrubro}&fecha=${fecha}`
    );
  }
  async getFacturasForRemision(idcliente: any, fechatope: any): Promise<any[]> {
    let facturas = await firstValueFrom(
      this.http.get<any[]>(
        `${baseUrl}/remisiones?idcliente=${idcliente}&fechatope=${fechatope}`
      )
    );
    return facturas;
  }
  async getFacturasForRemisionabonados(idcliente: any, cuenta: any, fechatope: any): Promise<any[]> {
    let facturas = await firstValueFrom(
      this.http.get<any[]>(
        `${baseUrl}/remisiones/cuenta?idcliente=${idcliente}&cuenta=${cuenta}&fechatope=${fechatope}`
      )
    );
    return facturas;
  }
  updateFacturatoRemision(idfactura: number, factura: any) {
    return this.http.put(
      `${baseUrl}/remisionfactura?idfactura=${idfactura}`,
      factura
    );
  }
  /* OBTENER LOS VALORES DE UNA FACTUA POR CUENTA */
  async getValoresCuenta(cuenta: number) {
    let resp = this.http.get(`${baseUrl}/sincobrar/cuentas?cuenta=${cuenta}`)
    return await firstValueFrom(resp);
  }
  async getValorTotalCuenta(cuenta: number) {
    let resp = this.http.get(`${baseUrl}/sincobrar/total?cuenta=${cuenta}`)
    return await firstValueFrom(resp);

  }
  generarPDF_FacElectronica(idfactura: number): Promise<any> {
    //let resp = firstValueFrom(this.http.get(`${apiUrl}/api/singsend/generar-pdf?idfactura=${idfactura}`,
    let resp = firstValueFrom(this.http.get(`${apiUrl}/api/sri/generar-pdf?idfactura=${idfactura}`,
      { responseType: 'blob' }));
    return resp;
  }
  sendEmail(
    emisor: string,
    password: string,
    receptores: string[], // Ejemplo: ['correo1@gmail.com', 'correo2@hotmail.com']
    asunto: string,
    mensaje: string,
    file?: File
  ): Observable<any> {
    const formData = new FormData();
    formData.append('emisor', emisor);
    formData.append('password', password);
    receptores.forEach(email => formData.append('receptores', email));
    formData.append('asunto', asunto);
    formData.append('mensaje', mensaje);
    if (file) {
      formData.append('file', file);
    }

    return this.http.post(`${apiUrl}/api/sri/send`, formData);
  }
  calculateMultaAsync(idfactura: number): Promise<any> {
    let resp = firstValueFrom(this.http.get(`${baseUrl}/multas?idfactura=${idfactura}`));
    return resp;
  }
}
