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

  listar(filtros?: {
    idemision?: number | null;
    accion?: string | null;
    desde?: string | null;
    hasta?: string | null;
  }): Observable<any> {
    let params = new HttpParams();

    if (filtros?.idemision != null && `${filtros.idemision}`.trim() !== '') {
      params = params.set('idemision', String(filtros.idemision));
    }
    if (filtros?.accion) {
      params = params.set('accion', filtros.accion);
    }
    if (filtros?.desde) {
      params = params.set('desde', filtros.desde);
    }
    if (filtros?.hasta) {
      params = params.set('hasta', filtros.hasta);
    }

    return this.http.get<any>(baseUrl, { params });
  }
}
