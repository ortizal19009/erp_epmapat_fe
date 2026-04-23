import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { EmisionAuditEntry } from '../interfaces/emisiones/emision-audit-entry';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/emisiones/audit`;

@Injectable({
  providedIn: 'root',
})
export class EmisionAuditService {
  constructor(private http: HttpClient) {}

  registrar(entry: EmisionAuditEntry): Observable<Object> {
    return this.http.post(baseUrl, entry);
  }

  porEmision(idemision: number): Observable<any> {
    const params = new HttpParams().set('idemision', String(idemision));
    return this.http.get<any>(baseUrl, { params });
  }
}
