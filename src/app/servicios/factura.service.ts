import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, firstValueFrom, map } from 'rxjs';
import { Facturas } from '../modelos/facturas.model';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/facturas`;

@Injectable({
  providedIn: 'root',
})
export class FacturaService {
  constructor(private http: HttpClient) {}

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
  getByIdcliente(idcliente: number) {
    return this.http.get<Facturas>(`${baseUrl}?idcliente=${idcliente}`);
  }
  //Lista de Facturas desde/hasta
  getDesdeHasta(desde: number, hasta: number) {
    return this.http.get<Facturas>(`${baseUrl}?desde=${desde}&hasta=${hasta}`);
  }
  //Pre Facturas por Abonado
  getByIdabonado(idabonado: number) {
    return this.http.get<Facturas[]>(`${baseUrl}/idabonado/${idabonado}`);
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
    d_fecha: Date,
    h_fecha: Date
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

  //Planillas sin Cobro de un Cliente
  getSinCobro(idcliente: number) {
    return this.http.get<Facturas[]>(`${baseUrl}/idcliente/${idcliente}`);
  }

  //IDs de las Planillas sin cobrar de un Abonado
  getSinCobroAbo(idabonado: number) {
    return this.http.get<number[]>(
      `${baseUrl}/sincobro?idabonado=${idabonado}`
    );
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
  async updateFacturaAsync(fac: Facturas): Promise<Object> {
    const observable = this.http.put(`${baseUrl}/${fac.idfactura}`, fac);
    return await firstValueFrom(observable);
  }

  getByNroFacturaModulo(nrofactura: String, idmodulo: number) {
    return this.http.get<Facturas>(
      `${baseUrl}/nrofmodulo?nrofactura=${nrofactura}&idmodulo=${idmodulo}`
    );
  }

  /*============================
  ------ REPORTES JASPER -------
  ============================*/

  reporteFacturas(v_dfecha: Date, v_hfecha: Date) {
    console.log(v_dfecha, v_hfecha);
    return this.http.get(
      `${baseUrl}/reportes/facturascobradas?v_dfecha=${v_dfecha}&v_hfecha=${v_hfecha}`, { responseType: 'blob' }
    );
  }
  reporteFacturasRubros(v_dfecha: Date, v_hfecha: Date, c_feccrea: Date) {
    return this.http.get(
      `${baseUrl}/reportes/facturascobradas?v_dfecha=${v_dfecha}&v_hfecha=${v_hfecha}&c_feccrea=${c_feccrea}`
    );
  }
}
