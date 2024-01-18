import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Certificaciones } from '../modelos/certificaciones';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/certificaciones`;

@Injectable({
  providedIn: 'root'
})

export class CertificacionesService {

  constructor(private http:HttpClient) { }

  getListaCertificaciones():Observable<Certificaciones[]>{
    return this.http.get<Certificaciones[]>(`${baseUrl}`);
  }

  getDesdeHasta(desde: number, hasta: number) {
    return this.http.get<Certificaciones[]>(`${baseUrl}?desde=${desde}&hasta=${hasta}`);
  }

  getByCliente(cliente: String) {
    return this.http.get<Certificaciones[]>(`${baseUrl}?cliente=${cliente}`);
  }

  ultima(): Observable<Certificaciones> {
    return this.http.get<Certificaciones>(`${baseUrl}/ultima`);
  }

  saveCertificaciones(certificaciones: Certificaciones):Observable<Object>{
    return this.http.post(`${baseUrl}`,certificaciones);
  }

  deleteCertificaciones(idcertificacion: number): Observable<Object>{
    return this.http.delete(`${baseUrl}/${idcertificacion}`);
  }

  getListaById(idcertificacion: number){
    return this.http.get<Certificaciones>(`${baseUrl}/${idcertificacion}`);
  }

  updateCertificacion(certificaciones: Certificaciones): Observable<Object>{
    return this.http.put(`${baseUrl}/${certificaciones.idcertificacion}`,certificaciones);
  }

  
}
