import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/valoresnc`;
@Injectable({
  providedIn: 'root'
})
export class ValoresncService {

  constructor(private http: HttpClient) { }
  getAll() {
    return this.http.get(`${baseUrl}`);
  }
  getByIdvaloresnc(idvaloresnc: number) {
    return this.http.get(`${baseUrl}/${idvaloresnc}`);
  }
  saveValoresnc(valoresnc: any) {
    return this.http.post(`${baseUrl}`, valoresnc);
  }
}
