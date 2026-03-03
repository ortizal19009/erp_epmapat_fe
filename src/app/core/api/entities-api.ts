import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

export interface Entity {
  id: string;
  codigo: string;
  nombre: string;
  activo: boolean;
}

@Injectable({ providedIn: 'root' })
export class EntitiesApi {
  private base = `${((environment as any).GD_API_URL || environment.API_URL) + '/api'}/entities`;

  constructor(private http: HttpClient) {}

  list(q?: string) {
    let params = new HttpParams();
    if (q?.trim()) params = params.set('q', q.trim());
    return this.http.get<Entity[]>(this.base, { params });
  }

  get(id: string) {
    return this.http.get<Entity>(`${this.base}/${id}`);
  }

  create(payload: { codigo: string; nombre: string; active?: boolean }) {
    return this.http.post<{ id: string }>(this.base, payload);
  }

  update(id: string, payload: { codigo: string; nombre: string }) {
    return this.http.put<{ id: string }>(`${this.base}/${id}`, payload);
  }

  setStatus(id: string, active: boolean) {
    return this.http.put<{ id: string; active: boolean }>(`${this.base}/${id}/status`, { active });
  }
}

