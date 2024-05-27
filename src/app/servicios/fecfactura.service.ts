import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Fecfactura } from '../modelos/fecfactura.model';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/fec_factura`;

@Injectable({
  providedIn: 'root',
})
export class FecfacturaService {
  constructor(private http: HttpClient) {}

  getLista(): Observable<Fecfactura[]> {
    return this.http.get<Fecfactura[]>(`${baseUrl}`);
  }

  getByEstado(estado: String, limit: number): Observable<Fecfactura[]> {
    return this.http.get<Fecfactura[]>(
      `${baseUrl}/estado?estado=${estado}&limit=${limit}`
    );
  }

  getByCuenta(cuenta: String): Observable<Fecfactura[]> {
    return this.http.get<Fecfactura[]>(
      `${baseUrl}/referencia?referencia=${cuenta}`
    );
  }

  getByNombreCliente(cliente: string): Observable<Fecfactura[]> {
    return this.http.get<Fecfactura[]>(`${baseUrl}/cliente?cliente=${cliente}`);
  }

  //Save
  save(f: Fecfactura): Observable<Object> {
    return this.http.post(`${baseUrl}`, f);
  }
  updateFecFactura(fecfactura: any){
    return this.http.put(`${baseUrl}/${fecfactura.idfactura}`, fecfactura);
  }
}
