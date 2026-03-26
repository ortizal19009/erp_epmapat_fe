import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpBase } from './http-base';
import { TipoDocumento } from '../models/tipo-documento';

@Injectable({ providedIn: 'root' })
export class DocumentTypeApi extends HttpBase {
  constructor(http: HttpClient) { super(http); }

  list(entityCode: string) {
    return this.http.get<TipoDocumento[]>(this.api(`/document-types?entity_code=${encodeURIComponent(entityCode)}`));
  }

  get(id: string) {
    return this.http.get<TipoDocumento>(this.api(`/document-types/${id}`));
  }

  create(payload: {
    entity_code: string;
    codigo: string;
    nombre: string;
    flujo: 'INGRESO' | 'SALIDA';
    active?: boolean;
  }) {
    return this.http.post<{ id: string }>(this.api('/document-types'), payload);
  }

  update(id: string, payload: { codigo: string; nombre: string; flujo: 'INGRESO' | 'SALIDA'; }) {
    return this.http.put<{ id: string }>(this.api(`/document-types/${id}`), payload);
  }

  setStatus(id: string, active: boolean) {
    return this.http.put<{ id: string; active: boolean }>(this.api(`/document-types/${id}/status`), { active });
  }
}

