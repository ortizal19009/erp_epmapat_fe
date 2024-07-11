import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Convenios } from '../modelos/convenios.model';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/convenios`;

@Injectable({
  providedIn: 'root',
})
export class ConvenioService {
  constructor(private http: HttpClient) {}

  getAll(): Observable<Convenios[]> {
    return this.http.get<Convenios[]>(baseUrl);
  }

  conveniosDesdeHasta(desde: number, hasta: number) {
    return this.http.get<Convenios>(
      `${baseUrl}/DesdeHasta?desde=${desde}&hasta=${hasta}`
    );
  }

  //Último Nroconvenio
  ultimoNroconvenio(): Observable<Convenios> {
    return this.http.get<Convenios>(`${baseUrl}/ultimo`);
  }

  //Siguiente Nroconvenio
  siguienteNroconvenio(): Observable<number> {
    return this.http.get<number>(`${baseUrl}/siguiente`);
  }

  //Valida Nroconvenio
  valNroconvenio(nroconvenio: number): Observable<boolean> {
    return this.http.get<boolean>(
      `${baseUrl}/valNroconvenio?nroconvenio=${nroconvenio}`
    );
  }

  getConveniosQuery(dnro: number, hnro: number) {
    return this.http.get<Convenios>(`${baseUrl}?dnro=${dnro}&hnro=${hnro}`);
  }

  getNroconvenio(nroconvenio: number) {
    return this.http.get<Convenios>(`${baseUrl}?nroconvenio=${nroconvenio}`);
  }

  getById(idconvenio: number): Observable<Convenios> {
    return this.http.get<Convenios>(`${baseUrl}/${idconvenio}`);
  }

  saveConvenio(convenio: Convenios): Observable<Object> {
    return this.http.post(baseUrl, convenio);
  }

  update(idconvenio: number, convenio: Convenios): Observable<Object> {
    return this.http.put(`${baseUrl}/${idconvenio}`, convenio);
  }

  deleteConvenio(idconvenio: number): Observable<Object> {
    return this.http.delete(`${baseUrl}/${idconvenio}`);
  }
  getByReferencia(referencia: string) {
    return this.http.get<Convenios>(
      `${baseUrl}/referencia?referencia=${referencia}`
    );
  }
}
