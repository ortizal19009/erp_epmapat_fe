import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface TrackingReader {
  idusuario: number;
  nomusu: string;
  alias: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class TrazabilidadService {
  private apiUrl = `${environment.API_URL}/tracking`;

  constructor(private http: HttpClient) { }

  getReaders(): Observable<TrackingReader[]> {
    return this.http.get<TrackingReader[]>(`${this.apiUrl}/readers`);
  }

  getSessions(readerId?: number, date?: string): Observable<any[]> {
    let url = `${this.apiUrl}/sessions`;
    const params: any = {};
    if (readerId) params.readerId = readerId;
    if (date) params.date = date;
    return this.http.get<any[]>(url, { params });
  }

  getSessionFullTrace(sessionId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/sessions/${sessionId}/full-trace`);
  }
}
