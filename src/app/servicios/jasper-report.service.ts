import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/jasperReports`;

@Injectable({
  providedIn: 'root'
})
export class JasperReportService {
  constructor(private http: HttpClient) { }
  getReporte(datos: any): Promise<any> {
    let resp = (firstValueFrom(this.http.post(`${baseUrl}/reportes`, datos,
      { responseType: 'blob' })))
    return resp;

  }
}
