import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class LookupsApi {
  private base = `${environment.API_URL + '/api'}/lookups`;
  constructor(private http: HttpClient) {}

  users(entityCode: string, q?: string, page: number = 1, pageSize: number = 100) {
    let params = new HttpParams()
      .set('entity_code', entityCode)
      .set('page', page)
      .set('page_size', pageSize);
    if (q?.trim()) params = params.set('q', q.trim());
    return this.http.get<any>(`${this.base}/users`, { params });
  }

  persons(entityCode: string, q?: string, page: number = 1, pageSize: number = 100) {
    let params = new HttpParams()
      .set('entity_code', entityCode)
      .set('page', page)
      .set('page_size', pageSize);
    if (q?.trim()) params = params.set('q', q.trim());
    return this.http.get<any>(`${this.base}/persons`, { params });
  }

  updateUser(userId: string, payload: { role?: string; active?: boolean }, entityCode: string = 'EPMAPA-T', actorUserId?: string) {
    const params: any = { entity_code: entityCode };
    if (actorUserId) params.actor_user_id = actorUserId;
    return this.http.patch<any>(`${this.base}/users/${userId}`, payload, { params });
  }

  adminAudit(entityCode: string = 'EPMAPA-T', page: number = 1, pageSize: number = 50) {
    const params = new HttpParams().set('entity_code', entityCode).set('page', page).set('page_size', pageSize);
    return this.http.get<any>(`${this.base}/admin/audit`, { params });
  }
}

