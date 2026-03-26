import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CcdApi {
  private base = `${((environment as any).GD_API_URL || environment.API_URL) + '/api'}/ccd`;
  constructor(private http: HttpClient) {}

  listSeries(entityCode: string) {
    const params = new HttpParams().set('entity_code', entityCode);
    return this.http.get<any[]>(`${this.base}/series`, { params });
  }

  createSeries(entityCode: string, code: string, name: string) {
    const params = new HttpParams().set('entity_code', entityCode);
    return this.http.post<any>(`${this.base}/series`, { code, name }, { params });
  }

  listSubseries(seriesId: string) {
    return this.http.get<any[]>(`${this.base}/series/${seriesId}/subseries`);
  }

  createSubseries(seriesId: string, code: string, name: string) {
    return this.http.post<any>(`${this.base}/series/${seriesId}/subseries`, { code, name });
  }
}

