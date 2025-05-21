import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/ntacredito`;
@Injectable({
  providedIn: 'root'
})
export class NtacreditoService {

  constructor(private http: HttpClient) { }
  saveNtacredito(ntacredito: any) {
    return this.http.post(`${baseUrl}`, ntacredito)
  }
  getAllPageable(page: number, size: number) {
    return this.http.get(`${baseUrl}/all?page=${page}&size=${size}`)
  }
  getSaldosNC(cuenta: number) {
    return this.http.get(`${baseUrl}/saldosNC?cuenta=${cuenta}`)
  }
  updateNotaCredito(ntacredito: any) {
    return this.http.put(`${baseUrl}/up?idntacredito=${ntacredito.idntacredito}`, ntacredito);
  }
  getByIdNtaCredito(idntacredito: number): Promise<any> {
    let resp = firstValueFrom(this.http.get(`${baseUrl}/${idntacredito}`))
    return resp
  }
}
