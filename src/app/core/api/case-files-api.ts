import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CaseFilesApi {
  private base = `${((environment as any).GD_API_URL || environment.API_URL) + '/api'}/case-files`;
  constructor(private http: HttpClient) {}

  list(entityCode: string) {
    const params = new HttpParams().set('entity_code', entityCode);
    return this.http.get<any[]>(this.base, { params });
  }

  create(entityCode: string, payload: { code: string; title: string; owner_dependency_id?: string | null; created_by?: string | null }) {
    const params = new HttpParams().set('entity_code', entityCode);
    return this.http.post<any>(this.base, payload, { params });
  }

  addDocument(caseFileId: string, documentId: string, actorUserId?: string) {
    return this.http.post<any>(`${this.base}/${caseFileId}/items`, { document_id: documentId, actor_user_id: actorUserId || null });
  }

  items(caseFileId: string) {
    return this.http.get<any[]>(`${this.base}/${caseFileId}/items`);
  }

  close(caseFileId: string, closedBy?: string) {
    return this.http.post<any>(`${this.base}/${caseFileId}/close`, { closed_by: closedBy || null });
  }
}

