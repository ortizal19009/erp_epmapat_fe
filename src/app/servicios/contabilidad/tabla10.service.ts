import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Tabla10 } from 'src/app/modelos/contabilidad/tabla10.model';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/tabla10`;

@Injectable({
  providedIn: 'root',
})

export class Tabla10Service {

  constructor(private http: HttpClient) { }

  getListaTabla10(): Observable<Tabla10[]> {
    return this.http.get<Tabla10[]>(baseUrl);
  }

  getByCodretair(codretair: String): Observable<Tabla10[]> {
    return this.http.get<Tabla10[]>(`${baseUrl}?codretair=${codretair}`);
  }


  saveCertiPresu(tabla10: any) {
    return this.http.post(`${baseUrl}`, tabla10);
  }

  getById(idtabla10: number) {
    return this.http.get<Tabla10>(baseUrl + "/" + idtabla10);
  }

  updateCerti(idtabla10: number, tabla10: Tabla10): Observable<Object> {
    return this.http.put(`${baseUrl}/${idtabla10}`, tabla10);
  }

  deleteTabla10(idtabla10: number) {
    return this.http.delete(`${baseUrl}/${idtabla10}`);
  }

}