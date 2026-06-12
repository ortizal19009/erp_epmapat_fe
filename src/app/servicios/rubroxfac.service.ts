import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Rubroxfac } from '../modelos/rubroxfac.model';
import { Observable, catchError, firstValueFrom, map } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Facxrecauda } from '../modelos/facxrecauda.model';

const apiUrl = environment.API_URL.replace(/\/$/, '');
const apiBaseUrl = `${apiUrl}/api/rubroxfac`;
const legacyBaseUrl = `${apiUrl}/rubroxfac`;
const baseUrl = legacyBaseUrl;

@Injectable({
  providedIn: 'root',
})
export class RubroxfacService {
  constructor(private http: HttpClient) { }

  private toNumber(value: any): number {
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : 0;
    }

    if (typeof value === 'string') {
      const cleanValue = value.trim();
      if (!cleanValue) {
        return 0;
      }

      let normalized = cleanValue.replace(/[^0-9,.-]/g, '');
      const lastComma = normalized.lastIndexOf(',');
      const lastDot = normalized.lastIndexOf('.');

      if (lastComma >= 0 && lastDot >= 0) {
        normalized =
          lastComma > lastDot
            ? normalized.replace(/\./g, '').replace(',', '.')
            : normalized.replace(/,/g, '');
      } else if (lastComma >= 0) {
        normalized = normalized.replace(',', '.');
      }

      const parsed = Number(normalized);
      return Number.isFinite(parsed) ? parsed : 0;
    }

    return 0;
  }

  private normalizeDetalleItem(item: any): any {
    if (!item || typeof item !== 'object') {
      return item;
    }

    const rubro = item.idrubro_rubros && typeof item.idrubro_rubros === 'object'
      ? item.idrubro_rubros
      : {};

    const descripcion =
      rubro.descripcion ||
      rubro.nombre ||
      (typeof item.idrubro_rubros === 'string' ? item.idrubro_rubros : '') ||
      item.descripcion ||
      item.rubro ||
      item.nombre ||
      'Rubro';

    const cantidad =
      this.toNumber(
        item.cantidad ??
        item.cant ??
        item.qty ??
        item.cantidadrubro ??
        item.cantidad_rubro
      ) || 1;

    const valorunitario = this.toNumber(
      item.valorunitario ??
      item.valorUnitario ??
      item.preciounitario ??
      item.precioUnitario ??
      item.valor ??
      item.monto
    );

    const totalRubro = this.toNumber(
      item.totalRubro ??
      item.totalrubro ??
      item.subtotal ??
      item.total ??
      item.importe
    );

    return {
      ...item,
      cantidad,
      valorunitario: valorunitario || (cantidad > 0 ? totalRubro / cantidad : 0),
      totalRubro,
      estado: item.estado ?? 1,
      idrubro_rubros: {
        ...rubro,
        descripcion,
        nombre: rubro.nombre || descripcion,
        swiva: rubro.swiva ?? item.swiva ?? item.esIva ?? 0,
        esiva: rubro.esiva ?? item.esiva ?? item.es_rubro_iva ?? 0,
      },
      idfactura_facturas:
        item.idfactura_facturas ??
        (item.idfactura ? { idfactura: item.idfactura } : undefined),
    };
  }

  private normalizeDetalleResponse(items: any): Rubroxfac[] {
    if (!Array.isArray(items)) {
      return [];
    }

    return items.map((item) => this.normalizeDetalleItem(item));
  }

  private getWithFallback<T>(path: string, legacyPath: string = path): Observable<T> {
    return this.http
      .get<T>(`${legacyBaseUrl}${legacyPath}`)
      .pipe(catchError(() => this.http.get<T>(`${apiBaseUrl}${path}`)));
  }

  async getSumaValoresUnitarios(idfactura: number): Promise<any> {
    let res = await firstValueFrom(this.http.get<any>(`${baseUrl}/sumavalores?idfactura=${idfactura}`));
    return res;
  }
  getSumaRubros(d: Date, h: Date) {
    return this.http.get<Rubroxfac[]>(
      `${baseUrl}/reportes/fechaCobro?d=${d}&h=${h}`
    );
  }
  getByFechacobro(d: Date, h: Date) {
    return this.http.get<Rubroxfac[]>(
      `${baseUrl}/reportes/fecha?d=${d}&h=${h}`
    );
  }
  getSinCobroRF(cuenta: number) {
    return this.http.get<Rubroxfac[]>(
      `${baseUrl}/sincobro/rubxfa?cuenta=${cuenta}`
    );
  }

  getListaRubroByFactura(idfactura: number) {
    return this.http.get<Rubroxfac[]>(`${baseUrl}?nrofactura=${idfactura}`);
  }

  getListaRubroByIdfactura(idfactura: number) {
    return this.http.get<Rubroxfac[]>(`${baseUrl}/idfactura/${idfactura}`);
  }

  getByIdfactura(idfactura: number) {
    return this.http
      .get<Rubroxfac[]>(`${baseUrl}?idfactura=${idfactura}`)
      .pipe(map((items) => this.normalizeDetalleResponse(items)));
  }

  getDetalleByIdfactura(idfactura: number) {
    return this.getWithFallback<Rubroxfac[]>(`/detalle?idfactura=${idfactura}`).pipe(
      map((items) => this.normalizeDetalleResponse(items))
    );
  }

  async getDetalleByIdfacturaAsync(idfactura: number) {
    const response = await firstValueFrom(
      this.getWithFallback<Rubroxfac[]>(`/detalle?idfactura=${idfactura}`).pipe(
        map((items) => this.normalizeDetalleResponse(items))
      )
    );
    return response;
  }

  async getByIdfacturaAsync(idfactura: number) {
    const response = await firstValueFrom(
      this.http
        .get<Rubroxfac[]>(`${baseUrl}?idfactura=${idfactura}`)
        .pipe(map((items) => this.normalizeDetalleResponse(items)))
    );
    return response;
  }

  //Rubros por Factura sin el registro mal incluido de IVA ('esiva')
  getByIdfactura1(idfactura: number) {
    return this.http.get<Rubroxfac[]>(
      `${baseUrl}/esiva?idfactura=${idfactura}`
    );
  }

  getMulta(idfactura: number): Observable<boolean> {
    return this.http.get<boolean>(`${baseUrl}/multa?idfactura=${idfactura}`);
  }

  /* GLOBALES */

  //Recaudación diaria - Actual
  async getTotalRubrosActualAsync(fecha: Date, hasta: string): Promise<any[]> {
    const response = await firstValueFrom(
      this.http.get<any[]>(
        `${baseUrl}/totalrubrosactual?fecha=${fecha}&hasta=${hasta}`
      )
    );
    return response;
  }
  //Recaudación diaria - Actual
  async getTotalRubrosAnteriorAsync(
    fecha: Date,
    hasta: string
  ): Promise<any[]> {
    const response = await firstValueFrom(
      this.http.get<any[]>(
        `${baseUrl}/totalrubrosanterior?fecha=${fecha}&hasta=${hasta}`
      )
    );
    return response;
  }

  /* POR RANGOS */

  //Recaudación diaria - Actual
  async getTotalRubrosActualRangosAsync(
    d_fecha: Date,
    h_fecha: Date,
    hasta: string
  ): Promise<any[]> {
    const response = await firstValueFrom(
      this.http.get<any[]>(
        `${baseUrl}/totalrubrosactualrangos?d_fecha=${d_fecha}&h_fecha=${h_fecha}&hasta=${hasta}`
      )
    );
    return response;
  }
  //Recaudación diaria - Actual
  async getTotalRubrosAnteriorRangosAsync(
    d_fecha: Date,
    h_fecha: Date,
    hasta: string
  ): Promise<any[]> {
    const response = await firstValueFrom(
      this.http.get<any[]>(
        `${baseUrl}/totalrubrosanteriorrangos?d_fecha=${d_fecha}&h_fecha=${h_fecha}&hasta=${hasta}`
      )
    );
    return response;
  }

  /* POR RECAUDADOR */

  //Recaudación diaria - Actual
  async getTotalRubrosActualByRecaudadorAsync(
    d_fecha: Date,
    h_fecha: Date,
    hasta: string,
    idrecaudador: number
  ): Promise<any[]> {
    const response = await firstValueFrom(
      this.http.get<any[]>(
        `${baseUrl}/reportes/totalrubrosactual?d_fecha=${d_fecha}&h_fecha=${h_fecha}&hasta=${hasta}&idrecaudador=${idrecaudador}`
      )
    );
    return response;
  }

  //Recaudación diaria - Actual
  async getTotalRubrosAnteriorByRecaudadorAsync(
    d_fecha: Date,
    h_fecha: Date,
    hasta: string,
    idrecaudador: number
  ): Promise<any[]> {
    const response = await firstValueFrom(
      this.http.get<any[]>(
        `${baseUrl}/reportes/totalrubrosanterior?d_fecha=${d_fecha}&h_fecha=${h_fecha}&hasta=${hasta}&idrecaudador=${idrecaudador}`
      )
    );
    return response;
  }

  getByIdrubro(idrubro: number) {
    return this.getWithFallback<Rubroxfac[]>(`/rubro/${idrubro}`);
  }

  getById(idrubroxfac: number) {
    return this.http.get<Rubroxfac>(baseUrl + '/' + idrubroxfac);
  }

  saveRubroxfac(rubroxFac: Rubroxfac): Observable<Object> {
    return this.http.post(`${baseUrl}`, rubroxFac);
  }

  //Está en add-convenio (cambiar a saveRubroxfac -sin f mayúscula-)
  saveRubroxFac(rubroxFac: Rubroxfac): Observable<Object> {
    return this.http.post(`${baseUrl}`, rubroxFac);
  }

  //Grabacion async
  async saveRubroxfacAsync(x: Rubroxfac): Promise<Object> {
    const observable = this.http.post(baseUrl, x);
    return await firstValueFrom(observable);
  }

  updateRubroxfac(
    idrubroxfac: number,
    rubroxfac: Rubroxfac
  ): Observable<Object> {
    return this.http.put(baseUrl + '/' + idrubroxfac, rubroxfac);
  }
  getIva(iva: number, idfactura: number) {
    const response = this.http.get(
      `${baseUrl}/iva?iva=${iva}&idfactura=${idfactura}`
    );
    return response;
  }

  /* FACTURACIÓN ELECTRÓNICA */
  async getRubrosAsync(idfactura: number): Promise<any[]> {
    const response = this.http.get<any[]>(
      `${baseUrl}/feRubros?idfactura=${idfactura}`
    );
    return await firstValueFrom(response);
  }

  async getRubrosIdAbonado(idabonado: number): Promise<any[]> {
    const response = this.http.get<any[]>(
      `${baseUrl}/reportes/rsincobro?idabonado=${idabonado}`
    );
    return await firstValueFrom(response);
  }
  /* obtener multas por factura */
  async getMultaByIdFactura(idfactura: number): Promise<any> {
    return await firstValueFrom(
      this.http.get<any[]>(`${baseUrl}/multas?idfactura= ${idfactura}`)
    );
  }

  /* REPORTE CARTERA VENCIDA */
  getCarteraVencidaxRubros(fechacobro: Date) {
    return this.http.get(
      `${baseUrl}/reportes/carteravencida?fechacobro=${fechacobro}`
    );
  }

  /* RUBROS PARA REMISIONES */
  async getRubrosForRemisiones(idcliente: any, fechatope: any): Promise<any[]> {
    let rubros: any = await firstValueFrom(
      this.http.get<any>(
        `${baseUrl}/remisiones?idcliente=${idcliente}&fechatope=${fechatope}`
      )
    );
    return rubros;
  }

  //Recaudación diaria - Año Actual (firstValueFrom en el ts)
  getTotalRubrosActual(fecha: Date | string, hasta: string): Observable<any[]> {
    // Ojo: si fecha es Date → lo convertimos a string ISO o YYYY-MM-DD
    const fechaStr = fecha instanceof Date ? fecha.toISOString().split('T')[0] : fecha;
    return this.http.get<any[]>(`${baseUrl}/totalrubrosactual?fecha=${fechaStr}&hasta=${hasta}`);
  }
}
