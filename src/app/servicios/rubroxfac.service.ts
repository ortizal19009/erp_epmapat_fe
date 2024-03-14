import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Rubroxfac } from '../modelos/rubroxfac.model';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/rubroxfac`;

@Injectable({
  providedIn: 'root',
})
export class RubroxfacService {
  constructor(private http: HttpClient) { }

  getListaRubroByFactura(idfactura: number) {
    return this.http.get<Rubroxfac[]>(`${baseUrl}?nrofactura=${idfactura}`);
  }

  getListaRubroByIdfactura(idfactura: number) {
    return this.http.get<Rubroxfac[]>(`${baseUrl}/idfactura/${idfactura}`);
  }

  getByIdfactura(idfactura: number) {
    return this.http.get<Rubroxfac[]>(`${baseUrl}?idfactura=${idfactura}`);
  }
  getByIdfactura1(idfactura: number) {
    return this.http.get<Rubroxfac[]>(
      `${baseUrl}/esiva?idfactura=${idfactura}`
    );
  }

  saveRubroxfac(rubroxFac: Rubroxfac): Observable<Object> {
    return this.http.post(`${baseUrl}`, rubroxFac);
  }

  getByIdrubro(idrubro: number) {
    return this.http.get<Rubroxfac[]>(`${baseUrl}/rubro/${idrubro}`);
  }
  //Está en add-convenio (cambiar a saveRubroxfac -sin f mayúscula-)
  saveRubroxFac(rubroxFac: Rubroxfac): Observable<Object> {
    return this.http.post(`${baseUrl}`, rubroxFac);
  }
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

  getMulta(idfactura: number): Observable<boolean> {
    // console.log(`${baseUrl}/multa?idfactura=${idfactura}`)
    return this.http.get<boolean>(`${baseUrl}/multa?idfactura=${idfactura}`);
  }

  getById(idrubroxfac: number) {
    return this.http.get<Rubroxfac>(baseUrl + "/" + idrubroxfac);
  }

  updateRubroxfac(idrubroxfac: number, rubroxfac: Rubroxfac): Observable<Object> {
    return this.http.put(baseUrl + "/" + idrubroxfac, rubroxfac);
  }
}
