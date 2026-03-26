import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpBase } from './http-base';
import { Dependencia } from '../models/dependencia';

@Injectable({ providedIn: 'root' })
export class DependencyApi extends HttpBase {
  constructor(http: HttpClient) { super(http); }

  list(entityCode: string) {
    return this.http.get<Dependencia[]>(this.api(`/dependencies?entity_code=${encodeURIComponent(entityCode)}`));
  }

  get(id: string) {
    return this.http.get<Dependencia>(this.api(`/dependencies/${id}`));
  }

  create(payload: { entity_code: string; codigo: string; nombre: string; padre_id?: string | null; }) {
    return this.http.post<{ id: string }>(this.api(`/dependencies`), payload);
  }

  update(id: string, payload: { codigo: string; nombre: string; padre_id?: string | null; }) {
    return this.http.put<{ id: string }>(this.api(`/dependencies/${id}`), payload);
  }

  setStatus(id: string, active: boolean) {
    return this.http.put<{ id: string; active: boolean }>(this.api(`/dependencies/${id}/status`), { active });
  }
}

