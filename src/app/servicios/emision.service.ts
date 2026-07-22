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

  findAllEmisionesBasic() {
    return this.http.get<Emisiones[]>(`${baseUrl}/findall-basic`);
  }
  getResumenEmision(limit: number) {
    let resp = firstValueFrom(
      this.http.get(`${baseUrl}/resumen?limit=${limit}`)
    );
    return resp;
  }

  getControlDashboard(limit = 24) {
    return this.http.get<any>(`${baseUrl}/control/dashboard?limit=${limit}`);
  }

  getControlRango(desde: string, hasta: string) {
    return this.http.get<any[]>(`${baseUrl}/control/rango?desde=${desde}&hasta=${hasta}`);
  }

  getControlDetalle(idemision: number) {
    return this.http.get<any>(`${baseUrl}/${idemision}/control-detalle`);
  }
  getAllEmisiones(): Promise<any> {
    let resp = this.http.get(`${baseUrl}/findall`);
    return firstValueFrom(resp);
  }

  recalcularMultaBasura1011(idemision: number, idruta: number) {
    const url = `${baseUrl}/${idemision}/rutaxemision/${idruta}/multa-basura/recalcular`;
    return this.http.post<any[]>(url, {});
  }

  generarPendientes(idemision: number, idusuario: number) {
    return this.http.post<any>(
      `${baseUrl}/${idemision}/generar-pendientes?idusuario=${idusuario}`,
      {}
    );
  }

  validarApertura(idemision: number) {
    return this.http.get<any>(`${baseUrl}/${idemision}/validar-apertura`);
  }

  generarFacturasCabeceraUltimaEmisionAbierta(idusuario: number) {
    return this.http.post<any>(
      `${baseUrl}/ultima-abierta/generar-facturas-cabecera?idusuario=${idusuario}`,
      {}
    );
  }

  reabrirEmision(idemision: number, usumodi: number) {
    return this.http.post<any>(`${baseUrl}/${idemision}/reabrir?usumodi=${usumodi}`, {});
  }

  eliminarEmision(idemision: number, usumodi: number) {
    return this.http.post<any>(`${baseUrl}/${idemision}/eliminar?usumodi=${usumodi}`, {});
  }

  anularEmision(
    idemision: number,
    payload: { iddocumento: number; motivo: string; referenciaDocumento?: string }
  ) {
    return this.http.post<any>(`${baseUrl}/${idemision}/anular`, payload);
  }

  // Si prefieres async/await
  async recalcularMultaBasura1011Async(idemision: number, idruta: number) {
    return await firstValueFrom(this.recalcularMultaBasura1011(idemision, idruta));
  }
}
