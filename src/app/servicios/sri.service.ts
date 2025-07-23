import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/api/sri`;

@Injectable({
  providedIn: 'root'
})
export class SriService {

  constructor(private http: HttpClient) { }
  sendEmailNotification(datos: any) {
    console.log(datos)
    return this.http.post(`${baseUrl}/sendMail`, datos)
  }
}
