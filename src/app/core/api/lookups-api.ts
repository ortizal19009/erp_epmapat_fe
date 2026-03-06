import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, of, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';

const MOCK_PERSONAL_GD = [
  { id: '11111111-1111-1111-1111-111111111111', full_name: 'María José Pérez', email: 'maria.perez@epmapat.gob.ec', active: true, source: 'MOCK' },
  { id: '22222222-2222-2222-2222-222222222222', full_name: 'Carlos Andrade', email: 'carlos.andrade@epmapat.gob.ec', active: true, source: 'MOCK' },
  { id: '33333333-3333-3333-3333-333333333333', full_name: 'Lucía Montalvo', email: 'lucia.montalvo@epmapat.gob.ec', active: true, source: 'MOCK' },
  { id: '44444444-4444-4444-4444-444444444444', full_name: 'Diego Villacís', email: 'diego.villacis@epmapat.gob.ec', active: true, source: 'MOCK' }
];

@Injectable({ providedIn: 'root' })
export class LookupsApi {
  private base = `${((environment as any).GD_API_URL || environment.API_URL) + '/api'}/lookups`;
  private rrhhPersonal = `${environment.API_URL}/personal`;
  constructor(private http: HttpClient) {}

  users(entityCode: string, q?: string, page: number = 1, pageSize: number = 100) {
    let params = new HttpParams()
      .set('entity_code', entityCode)
      .set('page', page)
      .set('page_size', pageSize);
    if (q?.trim()) params = params.set('q', q.trim());

    const fromGd$ = this.http.get<any>(`${this.base}/users`, { params });
    const fromRrhh$ = this.http.get<any[]>(this.rrhhPersonal).pipe(
      map((rows) => {
        const normalized = (rows || []).map((p: any) => ({
          id: String(p?.idpersonal ?? p?.id ?? ''),
          full_name: [p?.nombres, p?.apellidos].filter(Boolean).join(' ').trim() || p?.nomper || p?.nombre || 'Sin nombre',
          email: p?.email || p?.correo || null,
          active: p?.estado ?? true,
          source: 'RRHH'
        }));
        const term = (q || '').trim().toLowerCase();
        const filtered = term ? normalized.filter((u: any) => (u.full_name || '').toLowerCase().includes(term)) : normalized;
        const start = (page - 1) * pageSize;
        const items = filtered.slice(start, start + pageSize);
        return { items, page, page_size: pageSize, total: filtered.length, pages: Math.ceil(filtered.length / pageSize) || 1 };
      }),
      catchError(() => of({ items: [], page, page_size: pageSize, total: 0, pages: 1 }))
    );

    const fromMock$ = of((() => {
      const term = (q || '').trim().toLowerCase();
      const filtered = term ? MOCK_PERSONAL_GD.filter((u: any) => (u.full_name || '').toLowerCase().includes(term)) : MOCK_PERSONAL_GD;
      const start = (page - 1) * pageSize;
      const items = filtered.slice(start, start + pageSize);
      return { items, page, page_size: pageSize, total: filtered.length, pages: Math.ceil(filtered.length / pageSize) || 1 };
    })());

    return fromGd$.pipe(
      switchMap((res: any) => {
        const hasItems = Array.isArray(res?.items) && res.items.length > 0;
        return hasItems ? of(res) : fromRrhh$;
      }),
      switchMap((res: any) => {
        const hasItems = Array.isArray(res?.items) && res.items.length > 0;
        return hasItems ? of(res) : fromMock$;
      }),
      catchError(() => fromRrhh$.pipe(switchMap((res: any) => (Array.isArray(res?.items) && res.items.length > 0) ? of(res) : fromMock$)))
    );
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

