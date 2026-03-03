import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SystemSettingsApi {
  private base = `${((environment as any).GD_API_URL || environment.API_URL) + '/api'}/settings/system`;
  constructor(private http: HttpClient) {}

  list(entityCode: string) {
    const params = new HttpParams().set('entity_code', entityCode);
    return this.http.get<any[]>(this.base, { params });
  }

  upsert(entityCode: string, setting_key: string, setting_value: string | null) {
    const params = new HttpParams().set('entity_code', entityCode);
    return this.http.post<any>(this.base, { setting_key, setting_value }, { params });
  }
}

