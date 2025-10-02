import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Tabla4 } from '../../modelos/administracion/tabla4.model'
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/tabla4`;

@Injectable({
  providedIn: 'root'
})

export class Tabla4Service {

  constructor(private http: HttpClient) { }

  getListaTabla4(): Observable<Tabla4[]> {
    return this.http.get<Tabla4[]>(baseUrl);
  }

  saveTabla4(tabla4: Tabla4): Observable<Object> {
    return this.http.post(baseUrl, tabla4);
  }

  deleteTabla4(idtabla4: number): Observable<Object> {
    return this.http.delete(`${baseUrl}/${idtabla4}`);
  }

  getById(idtabla4: number) {
    return this.http.get<Tabla4>(baseUrl + "/" + idtabla4);
  }

  // updateTabla4(tabla4: Tabla4): Observable<Object> {
  //   return this.http.put(`${baseUrl}/${tabla4.idtabla4}`, tabla4);
  // }

  // update(id: number, tabla4: Tabla4): Observable<Object> {
  //   return this.http.put(baseUrl + "/" + id, tabla4);
  // }

  updateTabla4(idtabla4: number, tabla4: Tabla4): Observable<Object> {
    return this.http.put(baseUrl + "/" + idtabla4, tabla4);
  }

  //Validar por código de comprobante
  getByTipocomprobante(tipocomprobante: String): Observable<any> {
    return this.http.get<Tabla4>(`${baseUrl}?tipocomprobante=${tipocomprobante}`);
  }
  //Validar por nombre de comprobante
  getByNomcomprobante(nomcomprobante: String): Observable<any> {
    return this.http.get<Tabla4>(`${baseUrl}?nomcomprobante=${nomcomprobante}`);
  }

}
