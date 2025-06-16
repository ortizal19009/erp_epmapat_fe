import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
import { Rubros } from '../modelos/rubros.model';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/rubros`;

@Injectable({
  providedIn: 'root',
})
export class RubrosService {
  constructor(private http: HttpClient) { }

  getAll(): Observable<Rubros[]> {
    return this.http.get<Rubros[]>(baseUrl);
  }

  //Rubros por módulo (Sección)
  getByIdmodulo(idmodulo: number) {
    return this.http.get<Rubros>(`${baseUrl}/modulo/${idmodulo}`);
  }

  //Rubros por módulo (Sección) y descripcion
  getByModulo(idmodulo: number, descripcion: String) {
    return this.http.get<Rubros>(
      `${baseUrl}/idmodulo?idmodulo=${idmodulo}&descripcion=${descripcion}`
    );
  }

  getRubroById(idrubro: number) {
    return this.http.get<Rubros>(`${baseUrl}/${idrubro}`);
  }

  //Validar por Módulo y nombre
  getByNombre(idmodulo: number, descripcion: String): Observable<any> {
    return this.http.get<Rubros>(
      `${baseUrl}?idmodulo=${idmodulo}&descripcion=${descripcion}`
    );
  }

  //Rubros de la Emisión
  getRubrosEmision(): Observable<Rubros[]> {
    return this.http.get<Rubros[]>(`${baseUrl}/emision`);
  }

  saveRubro(rubro: Rubros): Observable<Object> {
    return this.http.post(baseUrl, rubro);
  }

updateRubro(idrubro: number, rubro: any): Promise<any> {
  const headers = new HttpHeaders({
  'Content-Type': 'application/json'
});
  return firstValueFrom(this.http.put(`${baseUrl}/update?idrubro=${idrubro}`, rubro, { headers }));
}


  deleteRubro(idrubro: number): Observable<Object> {
    return this.http.delete(`${baseUrl}/${idrubro}`);
  }
  findByName(descripcion: string) {
    return this.http.get(`${baseUrl}/findByName?descripcion=${descripcion}`);
  }
}
