import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/facturadetalles
`;
@Injectable({
  providedIn: 'root',
})
export class FecFacturaDetallesService {
  constructor(private http: HttpClient) {}
  saveFacDetalle(detalle: any) {
    return this.http.post(`${baseUrl}`, detalle);
  }
  getFecDetalleByIdfactura(idfactura: number) {
    return this.http.get(`${baseUrl}/factura?idfactura=${idfactura}`);
  }
}
