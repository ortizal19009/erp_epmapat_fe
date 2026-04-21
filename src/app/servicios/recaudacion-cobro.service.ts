import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Recaudacion } from '../modelos/recaudacion.model';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/recaudacion-cobro`;

export interface RecaudacionCobroItem {
  idfactura: number;
  subtotal: number;
  total: number;
  interes: number;
  iva: number;
  numfacturas?: number;
  cuenta?: number;
  idcliente?: number;
  nombre?: string;
  cedula?: string;
  direccionubicacion?: string;
  modulo?: string;
  estado?: number;
  pagado?: number;
  nrofactura?: string;
  feccrea?: Date;
  formapago?: number;
}

export interface RecaudacionCajaDTO {
  idcaja?: number;
  idrecaudaxcaja?: number;
  estado?: number;
  username?: string;
  establecimiento?: string;
  codigo?: string;
  facinicio?: number;
  facfin?: number;
  secuencial?: number;
  siguienteSecuencial?: number;
}

export interface RecaudacionCobroRequest {
  facturas: number[];
  autentification: number;
  recaudacion: Recaudacion;
  idcaja?: number;
}

export interface RecaudacionCobroResponse {
  recaudacion: Recaudacion;
  caja: RecaudacionCajaDTO;
  facturas: RecaudacionCobroItem[];
  totalCalculado: number;
  numeroFacturaSiguiente?: string;
}

@Injectable({
  providedIn: 'root',
})
export class RecaudacionCobroService {
  constructor(private http: HttpClient) {}

  async getSincobroByCuenta(cuenta: number): Promise<RecaudacionCobroItem[]> {
    return await firstValueFrom(
      this.http.get<RecaudacionCobroItem[]>(
        `${baseUrl}/sincobro/cuenta?cuenta=${cuenta}`
      )
    );
  }

  async getSincobroByCliente(idcliente: number): Promise<RecaudacionCobroItem[]> {
    return await firstValueFrom(
      this.http.get<RecaudacionCobroItem[]>(
        `${baseUrl}/sincobro/cliente?idcliente=${idcliente}`
      )
    );
  }

  getCajaEstado(idusuario: number): Observable<RecaudacionCajaDTO> {
    return this.http.get<RecaudacionCajaDTO>(
      `${baseUrl}/caja/estado?idusuario=${idusuario}`
    );
  }

  abrirCaja(username: string, password: string): Observable<any> {
    return this.http.get(`${baseUrl}/caja/abrir?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`);
  }

  cerrarCaja(username: string): Observable<any> {
    return this.http.put(`${baseUrl}/caja/cerrar?username=${encodeURIComponent(username)}`, null);
  }

  cobrarFacturas(request: RecaudacionCobroRequest) {
    return this.http.post<RecaudacionCobroResponse>(
      `${baseUrl}/cobrar`,
      request
    );
  }
}
