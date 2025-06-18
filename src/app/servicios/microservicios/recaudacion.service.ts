import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/api/rec/cajas`;
@Injectable({
  providedIn: 'root',
})
export class RecaudacionService {
  constructor(private http: HttpClient) {}

  async getSincobroByCuenta(cuenta: number): Promise<any> {
    return await this.http
      .get<any>(`${baseUrl}/sincobro/cuenta?cuenta=${cuenta}`)
      .toPromise();
  }
  async getSincobroByCliente(idcliente: number): Promise<any> {
    return await this.http
      .get<any>(`${baseUrl}/sincobro/cliente?idcliente=${idcliente}`)
      .toPromise();
  }
  cobrarFacturas(obj: any) {
    return this.http.put(`${baseUrl}/cobrar`, obj);
  }
  testConnection(user: number) {
    return this.http.get(`${baseUrl}/test_connection?user=${user}`);
  }
  logincajas(username: string, password: string) {
    return this.http.get(
      `${baseUrl}/login?username=${username}&password=${password}`
    );
  }
  singOutCaja(username: string) {
    return this.http.put(`${baseUrl}/logout?username=${username}`, null);
  }
  async getInteres(idfactura: number) {
    return await firstValueFrom(
      this.http.get(`${baseUrl}/interes?idfactura=${idfactura}`)
    );
  }
  async getImpuestos(idfactura: number) {
    return await firstValueFrom(
      this.http.get(`${baseUrl}/impuestos?idfactura=${idfactura}`)
    );
  }
}
