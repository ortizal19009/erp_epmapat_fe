import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DocumentosApi {
  private base = `${((environment as any).GD_API_URL || environment.API_URL) + '/api'}/documents`;

  constructor(private http: HttpClient) {}

  list(entityCode: string, filters?: { q?: string; flujo?: 'INGRESO' | 'SALIDA'; estado?: string; dependency_id?: string; type_id?: string; user_id?: string; series_id?: string; subseries_id?: string; date_from?: string; date_to?: string; page?: number; page_size?: number; }) {
    let params = new HttpParams().set('entity_code', entityCode);
    if (filters?.q) params = params.set('q', filters.q);
    if (filters?.flujo) params = params.set('flujo', filters.flujo);
    if (filters?.estado) params = params.set('estado', filters.estado);
    if (filters?.dependency_id) params = params.set('dependency_id', filters.dependency_id);
    if (filters?.type_id) params = params.set('type_id', filters.type_id);
    if (filters?.user_id) params = params.set('user_id', filters.user_id);
    if (filters?.series_id) params = params.set('series_id', filters.series_id);
    if (filters?.subseries_id) params = params.set('subseries_id', filters.subseries_id);
    if (filters?.date_from) params = params.set('date_from', filters.date_from);
    if (filters?.date_to) params = params.set('date_to', filters.date_to);
    if (filters?.page) params = params.set('page', filters.page);
    if (filters?.page_size) params = params.set('page_size', filters.page_size);
    return this.http.get<any>(this.base, { params });
  }

  get(id: string, userId?: string | null) {
    let params = new HttpParams();
    if (userId) params = params.set('user_id', userId);
    return this.http.get<any>(`${this.base}/${id}`, { params });
  }

  create(payload: any) {
    const mapped = { ...payload, entity_code: payload.entity_code ?? payload.entidad_codigo };
    delete mapped.entidad_codigo;
    return this.http.post<any>(this.base, mapped);
  }

  update(id: string, payload: any) {
    return this.http.put<any>(`${this.base}/${id}`, payload);
  }

  emit(id: string, userId: string | null, userRole?: string | null) {
    return this.http.post<any>(`${this.base}/${id}/issue`, { user_id: userId, user_role: userRole || undefined });
  }

  receive(id: string, payload: { receptor_id?: string; dependencia_id?: string; comentario?: string; usuario_id?: string | null; user_role?: string | null; }) {
    return this.http.post<any>(`${this.base}/${id}/receive`, {
      receiver_id: payload.receptor_id,
      dependency_id: payload.dependencia_id,
      comment: payload.comentario,
      user_id: payload.usuario_id,
      user_role: payload.user_role || undefined,
    });
  }

  assign(id: string, payload: any) {
    return this.http.post<any>(`${this.base}/${id}/assign`, payload);
  }

  derive(id: string, payload: any) {
    return this.http.post<any>(`${this.base}/${id}/derive`, payload);
  }

  deriveBulk(id: string, payload: any) {
    return this.http.post<any>(`${this.base}/${id}/derive/bulk`, payload);
  }

  respond(id: string, payload: any) {
    return this.http.post<any>(`${this.base}/${id}/responses`, payload);
  }

  respondNested(id: string, payload: any) {
    return this.http.post<any>(`${this.base}/${id}/responses/nested`, payload);
  }

  listRelations(id: string, relationType?: string) {
    const params: any = {};
    if (relationType) params.relation_type = relationType;
    return this.http.get<any[]>(`${this.base}/${id}/relations`, { params });
  }

  listDerivations(id: string) {
    return this.http.get<any[]>(`${this.base}/${id}/derivations`);
  }

  pendingDerivations(filters: { to_user_id?: string; to_dependency_id?: string; page?: number; page_size?: number }) {
    let params = new HttpParams();
    if (filters.to_user_id) params = params.set('to_user_id', filters.to_user_id);
    if (filters.to_dependency_id) params = params.set('to_dependency_id', filters.to_dependency_id);
    if (filters.page) params = params.set('page', filters.page);
    if (filters.page_size) params = params.set('page_size', filters.page_size);
    return this.http.get<any>(`${this.base}/derivations/pending`, { params });
  }

  markDerivationRead(derivationId: string, readerUserId?: string) {
    return this.http.patch<any>(`${this.base}/derivations/${derivationId}/read`, { reader_user_id: readerUserId || null });
  }

  attendDerivation(derivationId: string, payload?: { user_id?: string | null; note?: string | null }) {
    return this.http.patch<any>(`${this.base}/derivations/${derivationId}/attend`, {
      user_id: payload?.user_id || null,
      note: payload?.note || null,
    });
  }

  listFiles(id: string) {
    return this.http.get<any[]>(`${this.base}/${id}/files`);
  }

  uploadFile(id: string, file: File, uploadedByUserId?: string, fileKind: string = 'ANEXO') {
    const form = new FormData();
    form.append('file', file);
    if (uploadedByUserId) form.append('uploaded_by_user_id', uploadedByUserId);
    form.append('file_kind', fileKind);
    return this.http.post<any>(`${this.base}/${id}/files`, form);
  }

  downloadFile(id: string, fileId: string) {
    return `${this.base}/${id}/files/${fileId}/download`;
  }

  downloadFileBlob(id: string, fileId: string) {
    return this.http.get(`${this.base}/${id}/files/${fileId}/download`, { responseType: 'blob' });
  }

  timeline(id: string) {
    return this.http.get<any[]>(`${this.base}/${id}/timeline`);
  }

  overdue(entityCode: string) {
    return this.http.get<any[]>(`${this.base}/overdue`, { params: { entity_code: entityCode } });
  }

  dueSoon(entityCode: string, hours: number = 48) {
    return this.http.get<any[]>(`${this.base}/due-soon`, { params: { entity_code: entityCode, hours } });
  }

  // Compat: el backend actual no expone /overdue/refresh.
  // Usamos /overdue para recalcular y devolver la lista vigente.
  refreshOverdue(entityCode: string) {
    return this.http.get<any[]>(`${this.base}/overdue`, { params: { entity_code: entityCode } });
  }

  generateAlerts(entityCode: string) {
    return this.http.post<any>(`${this.base}/alerts/generate`, null, { params: { entity_code: entityCode } });
  }

  dashboard(entityCode: string, filters?: { date_from?: string; date_to?: string }) {
    const params: any = { entity_code: entityCode };
    if (filters?.date_from) params.date_from = filters.date_from;
    if (filters?.date_to) params.date_to = filters.date_to;
    return this.http.get<any>(`${this.base}/dashboard`, { params });
  }

  listAlerts(entityCode: string, state: string = 'PENDIENTE', page: number = 1, page_size: number = 20) {
    return this.http.get<any>(`${this.base}/alerts`, { params: { entity_code: entityCode, state, page, page_size } });
  }

  dispatchAlerts(entityCode: string, channel: string = 'TELEGRAM', limit: number = 50) {
    return this.http.post<any>(`${this.base}/alerts/dispatch`, null, { params: { entity_code: entityCode, channel, limit } });
  }
}





