import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class TrdApi {
  private base = `${((environment as any).GD_API_URL || environment.API_URL) + '/api'}/trd`;
  constructor(private http: HttpClient) {}

  list(entityCode: string) {
    const params = new HttpParams().set('entity_code', entityCode);
    return this.http.get<any[]>(this.base, { params });
  }

  upsert(entityCode: string, payload: any) {
    const params = new HttpParams().set('entity_code', entityCode);
    return this.http.post<any>(this.base, payload, { params });
  }
}

