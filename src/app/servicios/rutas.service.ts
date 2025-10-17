import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';
import { Rutas } from '../modelos/rutas.model';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/rutas`;

@Injectable({
  providedIn: 'root',
})
export class RutasService {
  constructor(private http: HttpClient) {}

  getListaRutas(): Observable<Rutas[]> {
    return this.http.get<Rutas[]>(`${baseUrl}`);
  }

  saveRuta(ruta: Rutas): Observable<Object> {
    return this.http.post(`${baseUrl}`, ruta);
  }

  deleteRuta(idruta: number): Observable<Object> {
    return this.http.delete(`${baseUrl}/${idruta}`);
  }

  updateRuta(ruta: Rutas) {
    return this.http.put(`${baseUrl}/${ruta.idruta}`, ruta);
  }

  getByIdruta(idruta: number) {
    return this.http.get<Rutas>(`${baseUrl}/${idruta}`);
  }

  getRutasByQuery(dato: String) {
    return this.http.get<Rutas>(`${baseUrl}?rutaConsulta=${dato}`);
  }

  //Valida el Código
  valCodigo(codigo: string): Observable<boolean> {
    return this.http.get<boolean>(`${baseUrl}/valCodigo?codigo=${codigo}`);
  }

  getNcuentasByRutas() {
    return this.http.get(`${baseUrl}/cuentasByRuta`);
  }
  async getDeudaOfCuentasByIdrutas(idruta: number):Promise<any> {
    return firstValueFrom (this.http.get(`${baseUrl}/deudas_ruta_cuentas?idruta=${idruta}`));
  }
  getDeudasOfAllCuentas() {
    return this.http.get(`${baseUrl}/deudas_cuentas`);
  }
  getDeudasOfRutas() {
    return this.http.get(`${baseUrl}/deudas_rutas`);
  }
}
