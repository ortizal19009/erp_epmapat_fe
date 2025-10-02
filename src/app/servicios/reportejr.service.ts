import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/api/jasper`;

@Injectable({
  providedIn: 'root'
})
export class ReportejrService {

  
   constructor(private http: HttpClient) {}

  uploadReporte(nombre: string, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('nombre', nombre);
    formData.append('file', file);

    return this.http.post(`${baseUrl}/upload`, formData, {
      responseType: 'text'
    });
  }
}
