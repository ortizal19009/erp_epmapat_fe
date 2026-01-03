import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, Observable } from 'rxjs';
import { Emisiones } from '../modelos/emisiones.model';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/emisiones`;

@Injectable({
  providedIn: 'root',
})
export class EmisionService {
  constructor(private http: HttpClient) {}

  getDesdeHasta(desde: String, hasta: String): Observable<Emisiones[]> {
    return this.http.get<Emisiones[]>(
      `${baseUrl}?desde=${desde}&hasta=${hasta}`
    );
  }

  getByIdemision_ori(idemision: number): Observable<Emisiones[]> {
    return this.http.get<Emisiones[]>(`${baseUrl}/${idemision}`);
  }

  getByIdemision(idemision: number){
    return this.http.get<Emisiones>(`${baseUrl}/${idemision}`);
  }

  ultimo(): Observable<Emisiones> {
    return this.http.get<Emisiones>(`${baseUrl}/ultimo`);
  }

  saveEmision(emi: Emisiones): Observable<Object> {
    return this.http.post(baseUrl, emi);
  }

  // saveEmision(emi: Emisiones): id<number> {
  //    this.http.post(baseUrl, emi);
  //    return id;
  // }

  update(id: number, emi: Emisiones): Observable<Object> {
    return this.http.put(`${baseUrl}/${id}`, emi);
  }
  findAllEmisiones() {
    return this.http.get<Emisiones[]>(`${baseUrl}/findall`);
  }
  getResumenEmision(limit: number) {
    let resp = firstValueFrom(
      this.http.get(`${baseUrl}/resumen?limit=${limit}`)
    );
    return resp;
  }
  getAllEmisiones(): Promise<any> {
    let resp = this.http.get(`${baseUrl}/findall`);
    return firstValueFrom(resp);
  }
}
