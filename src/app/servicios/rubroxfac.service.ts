import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Rubroxfac } from '../modelos/rubroxfac.model';
import { Observable, firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/rubroxfac`;

@Injectable({
  providedIn: 'root',
})
export class RubroxfacService {
  constructor(private http: HttpClient) { }

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
    return this.http.get<Rubroxfac[]>(`${baseUrl}/esiva?idfactura=${idfactura}`);
  }

  getMulta(idfactura: number): Observable<boolean> {
    // console.log(`${baseUrl}/multa?idfactura=${idfactura}`)
    return this.http.get<boolean>(`${baseUrl}/multa?idfactura=${idfactura}`);
  }

  getByIdrubro(idrubro: number) {
    return this.http.get<Rubroxfac[]>(`${baseUrl}/rubro/${idrubro}`);
  }

  getById(idrubroxfac: number) {
    return this.http.get<Rubroxfac>(baseUrl + "/" + idrubroxfac);
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

  updateRubroxfac(idrubroxfac: number, rubroxfac: Rubroxfac): Observable<Object> {
    return this.http.put(baseUrl + "/" + idrubroxfac, rubroxfac);
  }

  
}
