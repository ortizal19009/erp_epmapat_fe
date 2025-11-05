import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';
import { Rutasxemision } from '../modelos/rutasxemision.model';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/rutasxemision`;

@Injectable({
  providedIn: 'root',
})
export class RutasxemisionService {
  constructor(private http: HttpClient) {}

  getByIdEmision(idemision: Number) {
    return this.http.get<Rutasxemision>(`${baseUrl}?idemision=${idemision}`);
  }

  getByQuery(dato: String) {
    return this.http.get<Rutasxemision>(`${baseUrl}?consulta=${dato}`);
  }

  getLista1(): Observable<Rutasxemision[]> {
    return this.http.get<Rutasxemision[]>(`${baseUrl}`);
  }

  getById(idrutaxemision: number) {
    return this.http.get<Rutasxemision>(`${baseUrl}/${idrutaxemision}`);
  }

  countEstado(idemision_emisiones: number) {
    return this.http.get<Rutasxemision>(
      `${baseUrl}/conteo?idemision_emisiones=${idemision_emisiones}`
    );
  }

  // getById1(idrutaxemision: number) {
  //   return this.http.get<Rutasxemision>(baseUrl + "/" + idrutaxemision);
  // }

  saveRutaxemision(ruxemi: Rutasxemision): Observable<any> {
    return this.http.post(baseUrl, ruxemi);
  }

  //Save una rutaxemision async
  async saveRutaxemisionAsync(ruxemi: Rutasxemision): Promise<any> {
    const observable = this.http.post(baseUrl, ruxemi);
    return await firstValueFrom(observable);
  }

  updateRutaxemision(
    idrutaemision: number,
    rutaxemision: Rutasxemision
  ): Observable<Object> {
    return this.http.put(baseUrl + '/' + idrutaemision, rutaxemision);
  }

  // rutasxemision.service.ts
update_Rutaxemision(
  idrutaemision: number,
  cambios: Partial<Rutasxemision>
): Observable<object> {
  return this.http.patch(`${baseUrl}/${idrutaemision}`, cambios);
}


  getByEmisionRuta(idemision: number, idruta: number) {
    return this.http.get(
      `${baseUrl}/emiruta?idemision=${idemision}&idruta=${idruta}`
    );
  }
}
