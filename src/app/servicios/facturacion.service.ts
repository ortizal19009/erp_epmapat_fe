import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Facturacion } from '../modelos/facturacion.model';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/facturacion`;

@Injectable({
  providedIn: 'root'
})

export class FacturacionService {

  constructor(private http: HttpClient) { }

  getDesdeHasta(desde: number, hasta: number, del: Date, al: Date) {
    return this.http.get<Facturacion>(`${baseUrl}?desde=${desde}&hasta=${hasta}&del=${del}&al=${al}`);
  }
  
  getByCliente(cliente: String, del: Date, al: Date) {
    return this.http.get<Facturacion>(`${baseUrl}?cliente=${cliente}&del=${del}&al=${al}`);
  }

  ultimo(): Observable<Facturacion> {
    return this.http.get<Facturacion>(`${baseUrl}/ultimo`);
  }

  getById(idfacturacion: number): Observable<Facturacion> {
    return this.http.get<Facturacion>(`${baseUrl}/${idfacturacion}`);
  }

  //Original (Funciona pero no se puede obtener el Id)
  // save(facturacion: Facturacion):Observable<Object>{
  //   return this.http.post(baseUrl, facturacion);
  // }

  //Este funciona y permite obtener el Id
  save(facturacion: Facturacion) {
    return this.http.post<any>(baseUrl, facturacion);
  }

  //Esta también funciona (con any)
  // save(facturacion: any){
  //   return this.http.post<any>(baseUrl, facturacion);
  // }

  update(idfacturacion: number, factu: Facturacion): Observable<Object> {
    return this.http.put(`${baseUrl}/${idfacturacion}`, factu);
  }

  delete(idfacturacion: number): Observable<Object> {
    return this.http.delete(`${baseUrl}/${idfacturacion}`);
  }

  getListaById(idfacturacion: number) {
    return this.http.get<Facturacion>(`${baseUrl}/${idfacturacion}`);
  }

}
