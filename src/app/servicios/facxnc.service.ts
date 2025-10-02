import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/facxnc`;
@Injectable({
  providedIn: 'root'
})
export class FacxncService {

  constructor(private http: HttpClient) { }
  saveFacxnc(facxnc: any) {
    return this.http.post(`${baseUrl}`, facxnc);
  }
  getByIdfactura(idfactura: number ) {
    return firstValueFrom(this.http.get(`${baseUrl}/factura?idfactura=${idfactura}`));
  }
}
