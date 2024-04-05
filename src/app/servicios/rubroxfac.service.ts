import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Rubroxfac } from '../modelos/rubroxfac.model';
import { Observable, firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Facxrecauda } from '../modelos/facxrecauda.model';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/rubroxfac`;

@Injectable({
  providedIn: 'root',
})
export class RubroxfacService {
  constructor(private http: HttpClient) {}

  async getSumaValoresUnitarios(idfactura: number) {
    return this.http.get(`${baseUrl}/sumavalores?idfactura=${idfactura}`);
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
    return this.http.get<Rubroxfac[]>(`${baseUrl}?idfactura=${idfactura}`);
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
        `${baseUrl}/totalrubrosanterior?d_fecha=${d_fecha}&h_fecha=${h_fecha}&hasta=${hasta}`
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
    return this.http.get<Rubroxfac[]>(`${baseUrl}/rubro/${idrubro}`);
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
}
