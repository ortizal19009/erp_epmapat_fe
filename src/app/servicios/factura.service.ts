import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Facturas } from '../modelos/facturas.model';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/facturas`;

@Injectable({
  providedIn: 'root',
})
export class FacturaService {
  constructor(private http: HttpClient) {}

  getLista(): Observable<Facturas[]> {
    return this.http.get<Facturas[]>(`${baseUrl}`);
  }

  getListaFacturas(): Observable<Facturas[]> {
    return this.http.get<Facturas[]>(`${baseUrl}`);
  }

  getListaByNroFactura(nrofactura: String) {
    return this.http.get<Facturas>(`${baseUrl}?nrofactura=${nrofactura}`);
  }
  //Facturas por Cliente
  getByIdcliente(idcliente: number) {
    return this.http.get<Facturas>(`${baseUrl}?idcliente=${idcliente}`);
  }
  //Lista de Facturas desde/hasta
  getDesdeHasta(desde: number, hasta: number) {
    return this.http.get<Facturas>(`${baseUrl}?desde=${desde}&hasta=${hasta}`);
  }
  //Pre Facturas por Abonado
  getByIdabonado(idabonado: number) {
    return this.http.get<Facturas[]>(`${baseUrl}/idabonado/${idabonado}`);
  }

  getFacturaByAbonado(idabonado: number) {
    return this.http.get<Facturas[]>(`${baseUrl}/f_abonado/${idabonado}`);
  }

  saveFactura(f: Facturas): Observable<Object> {
    return this.http.post(`${baseUrl}`, f);
  }

  getById(idfactura: number): Observable<Facturas> {
    return this.http.get<Facturas>(`${baseUrl}/${idfactura}`);
  }
  //Planillas sin Cobro de un Cliente
  getSinCobro(idcliente: number) {
    return this.http.get<Facturas[]>(`${baseUrl}/idcliente/${idcliente}`);
  }
  getDeudaConsumo(idabonado: number) {
    return this.http.get<Facturas[]>(
      `${baseUrl}/deudaconsumo?idabonado=${idabonado}`
    );
  }
  getDeuda(idcliente: number) {
    return this.http.get<Facturas[]>(`${baseUrl}/deuda?idcliente=${idcliente}`);
  }
  updateFacturas(fac: Facturas) {
    return this.http.put(`${baseUrl}/${fac.idfactura}`, fac);
  }
  valLastFac(codrecaudador: string) {
    return this.http.get(`${baseUrl}/validador/-${codrecaudador}-`);
  }

  findByUsucobro(idusuario: number, d: Date, h: Date) {
    return this.http.get(
      `${baseUrl}/reportes/individual?idusuario=${idusuario}&dfecha=${d}&hfecha=${h}`
    );
  }
  findByfechacobro(fechacobro: Date) {
    return this.http.get(
      `${baseUrl}/reportes/fechacobro?fechacobro=${fechacobro}`
    );
  }
}
