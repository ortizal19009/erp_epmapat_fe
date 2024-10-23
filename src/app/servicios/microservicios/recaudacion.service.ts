import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/mrecaudacion`;
@Injectable({
  providedIn: 'root',
})
export class RecaudacionService {
  constructor(private http: HttpClient) {}

  async getSincobroByCuenta(cuenta: number):Promise<any>{
    return await this.http.get<any>(`${baseUrl}/sincobro/cuenta?cuenta=${cuenta}`).toPromise();
  }
}
