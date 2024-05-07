import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
const apiUrl = environment.FE_API_URL;
const baseUrl = `${apiUrl}/facdetallesimpuestos`;
@Injectable({
  providedIn: 'root'
})
export class FecFacturaDetallesImpuestosService {

  constructor(private http: HttpClient) { }
  saveFacDetalleImpuesto(detalleim: any) {
    return this.http.post(`${baseUrl}`, detalleim)
  }
}
