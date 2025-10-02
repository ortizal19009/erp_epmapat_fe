import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Remision } from 'src/app/modelos/coactivas/remision';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/remisiones`;

@Injectable({
  providedIn: 'root',
})
export class RemisionService {
  constructor(private http: HttpClient) {}
  getAllRemisiones(page: number, size: number) {
    return this.http.get(`${baseUrl}?page=${page}&size=${size}`);
  }
  saveRemision(remision: any) {
    let newremision = this.http.post(`${baseUrl}`, remision);
    return newremision;
  }
  getByFechacrea(d: any, h: any) {
    return this.http.get(`${baseUrl}/reportes?d=${d}&h=${h}`);
  }
  getRemisionById(idremision: number) {
    return this.http.get(`${baseUrl}/one?idremision=${idremision}`);
  }
}
