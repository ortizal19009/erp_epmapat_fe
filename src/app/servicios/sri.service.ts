import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/api/sri`;

@Injectable({
  providedIn: 'root',
})
export class SriService {
  constructor(private http: HttpClient) {}
  sendEmailNotification(datos: any) {
    console.log(datos);
    return this.http.post(`${baseUrl}/sendMail`, datos);
  }
  sendRetencion(xmlString: string): Observable<string> {
    return this.http.post('http://192.168.0.165:8080/retencion', xmlString, {
      headers: {
        'Content-Type': 'application/xml',
      },
      responseType: 'text',
    });
  }
  sendFacturaElectronica(xmlPlano: string) {
    return this.http.post(`${apiUrl}/api/singsend/factura`, xmlPlano,    {
      responseType: 'json' // 👈 MUY IMPORTANTE
    });
  }
}
