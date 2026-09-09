import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Condmultaintereses } from '../modelos/condmultasintereses';
const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/condmultasintereses`;
@Injectable({
  providedIn: 'root',
})
export class CondmultasinteresesService {
  constructor(private http: HttpClient) {}

  crearSolicitud(payload: any, idusuario: number): Observable<any> {
    return this.http.post(`${baseUrl}?idusuario=${idusuario}`, payload);
  }

  listar(filtros: {
    estado?: string;
    idfactura?: number | null;
    idcliente?: number | null;
    cuenta?: number | null;
    nrofactura?: string;
    usucrea?: number | null;
    feccreaDesde?: string;
    feccreaHasta?: string;
  }): Observable<Condmultaintereses[]> {
    const params = new URLSearchParams();
    Object.entries(filtros || {}).forEach(([key, value]) => {
      if (value !== null && value !== undefined && `${value}`.trim() !== '') {
        params.set(key, `${value}`);
      }
    });
    const query = params.toString();
    return this.http.get<Condmultaintereses[]>(query ? `${baseUrl}?${query}` : baseUrl);
  }

  listarPendientes(): Observable<Condmultaintereses[]> {
    return this.http.get<Condmultaintereses[]>(`${baseUrl}/pendientes`);
  }

  getById(id: number): Observable<Condmultaintereses> {
    return this.http.get<Condmultaintereses>(`${baseUrl}/${id}`);
  }

  aprobar(id: number, idusuario: number, observacion?: string): Observable<Condmultaintereses> {
    return this.http.put<Condmultaintereses>(`${baseUrl}/${id}/aprobar?idusuario=${idusuario}`, {
      observacion: observacion || null,
    });
  }

  aprobarLote(ids: number[], idusuario: number, observacion?: string): Observable<any> {
    return this.http.put(`${baseUrl}/aprobar-lote?idusuario=${idusuario}`, {
      ids,
      observacion: observacion || null,
    });
  }

  rechazar(id: number, idusuario: number, observacion: string): Observable<Condmultaintereses> {
    return this.http.put<Condmultaintereses>(`${baseUrl}/${id}/rechazar?idusuario=${idusuario}`, {
      observacion,
    });
  }

  async getPendientesPromise(): Promise<Condmultaintereses[]> {
    return await firstValueFrom(this.listarPendientes());
  }

  saveCondonacion(condonacion: any) {
    const payload = {
      razonExoneracion: condonacion?.razonExoneracion ?? condonacion?.razoncondonacion ?? '',
      items: [
        {
          idfactura: condonacion?.idfactura_facturas?.idfactura ?? condonacion?.idfactura,
          totalinteres: condonacion?.totalinteres ?? 0,
          totalmultas: condonacion?.totalmultas ?? 0,
        },
      ],
    };
    const idusuario = Number(condonacion?.usucrea ?? 0);
    return this.crearSolicitud(payload, idusuario);
  }
}
