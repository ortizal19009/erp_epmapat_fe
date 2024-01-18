import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ConciliaBan } from 'src/app/modelos/contabilidad/concilia-ban.model';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/conciliaban`;

@Injectable({
  providedIn: 'root',
})

export class ConciliaBanService {

  constructor(private http: HttpClient) { }

  getAllConciliaBancos() {
    return this.http.get(`${baseUrl}`);
  }

  getByCuentaMes(idcuenta: number, mes: number) {
    return this.http.get(`${baseUrl}/ban-mes?idcuenta=${idcuenta}&mes=${mes}`);
  }

  updateConciliaBan(conciliaban: ConciliaBan) {
    return this.http.put(`${baseUrl}/${conciliaban.idconcilia}`, conciliaban);
  }

  saveConciliaBan(conciliaban: ConciliaBan) {
    return this.http.post(`${baseUrl}/saveconcilia`, conciliaban);
  }

}
