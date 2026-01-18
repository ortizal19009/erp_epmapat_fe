import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/recargosxcuenta`;
@Injectable({
  providedIn: 'root'
})
export class RecargosxcuentaService {

  constructor(private http: HttpClient) { }
  getRecargosxcuentaByEmision(idemision: number) {
    return this.http.get(`${baseUrl}/byEmision?idemision=${idemision}`);
  }
  saveRecargoxCuenta(data: any) {
    return this.http.post(baseUrl, data);
  }
}
