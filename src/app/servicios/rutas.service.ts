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

  getResumenRutas(estado?: boolean): Observable<Partial<Rutas>[]> {
    const query = estado === undefined ? '' : `?estado=${estado}`;
    return this.http.get<Partial<Rutas>[]>(`${baseUrl}/resumen${query}`);
  }

  getRutasAsignacion(idemision?: number, filtro = '', estado = true, limit = 200): Observable<any[]> {
    const params: string[] = [];
    if (idemision !== undefined && idemision !== null) {
      params.push(`idemision=${idemision}`);
    }
    if (estado !== undefined && estado !== null) {
      params.push(`estado=${estado}`);
    }
    if (filtro.trim()) {
      params.push(`filtro=${encodeURIComponent(filtro.trim())}`);
    }
    if (limit > 0) {
      params.push(`limit=${limit}`);
    }
    return this.http.get<any[]>(`${baseUrl}/asignacion${params.length ? `?${params.join('&')}` : ''}`);
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
