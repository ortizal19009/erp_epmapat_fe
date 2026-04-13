import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

const baseUrl = `${environment.API_URL}/cliente-merge-monitor`;

export interface ClienteMergeMonitorRow {
  idMerge: number;
  masterId: number;
  masterNombre: string;
  masterCedula: string;
  fechaMerge: string;
  usuarioMerge: number;
  observacion: string;
  clientesCount: number;
  abonadosCount: number;
  facturasCount: number;
  lecturasCount: number;
}

export interface ClienteMergeMonitorPage {
  content: ClienteMergeMonitorRow[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
}

export interface ClienteMergeMonitorDetalle {
  merge: any;
  clientes: any[];
  abonados: any[];
  facturas: any[];
  lecturas: any[];
}

@Injectable({
  providedIn: 'root',
})
export class ClienteMergeMonitorService {
  constructor(private http: HttpClient) {}

  listar(filtros: {
    q?: string;
    masterId?: string | number | null;
    usuario?: string | number | null;
    desde?: string | null;
    hasta?: string | null;
    page: number;
    size: number;
  }): Observable<ClienteMergeMonitorPage> {
    let params = new HttpParams()
      .set('page', String(filtros.page))
      .set('size', String(filtros.size));

    ['q', 'masterId', 'usuario', 'desde', 'hasta'].forEach((key) => {
      const value = (filtros as any)[key];
      if (value !== null && value !== undefined && String(value).trim() !== '') {
        params = params.set(key, String(value).trim());
      }
    });

    return this.http.get<ClienteMergeMonitorPage>(baseUrl, { params });
  }

  detalle(idMerge: number): Observable<ClienteMergeMonitorDetalle> {
    return this.http.get<ClienteMergeMonitorDetalle>(`${baseUrl}/${idMerge}`);
  }
}
