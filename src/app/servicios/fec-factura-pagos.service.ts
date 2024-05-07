import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

const apiUrl = environment.FE_API_URL;
const baseUrl = `${apiUrl}/facturapagos`;
@Injectable({
  providedIn: 'root'
})
export class FecFacturaPagosService {
  constructor(private http: HttpClient) { }
  saveFacPago(pago: any) {
    return this.http.post(`${baseUrl}`, pago)
  }
  
}
