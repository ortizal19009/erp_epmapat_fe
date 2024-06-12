import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/facdetallesimpuestos`;
@Injectable({
  providedIn: 'root',
})
export class FecFacturaDetallesImpuestosService {
  constructor(private http: HttpClient) {}
  async saveFacDetalleImpuesto(detalleim: any) {
    const observable = this.http.post(`${baseUrl}`, detalleim);
    return await firstValueFrom(observable);
  }
  getFecFacDetalleService(iddetalle: number) {
    return this.http.get(`${baseUrl}/factura_detalle?iddetalle=${iddetalle}`);
  }
  deleteImpuesto(idimpuesto: number) {
    return this.http.delete(`${baseUrl}?idimpuesto=${idimpuesto}`);
  }
}
