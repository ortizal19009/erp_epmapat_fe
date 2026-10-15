import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

export interface PerformanceReview {
  idreview: number; idpersonal: number; periodo: string; fecha: string; puntaje: number;
  evaluador: string; observaciones: string; planMejora: string; usuario: number; creado: string;
}
export type PerformanceInput = Pick<PerformanceReview, 'idpersonal' | 'periodo' | 'fecha' | 'puntaje' | 'evaluador' | 'observaciones' | 'planMejora'>;

@Injectable({ providedIn: 'root' })
export class ThPerformanceService {
  private readonly base = `${environment.API_URL}/api/th-performance`;
  constructor(private http: HttpClient) {}
  permissions() { return this.http.get<{ userId: number; canWrite: boolean }>(`${this.base}/permissions`); }
  byPersonal(id: number, page = 0, size = 20) {
    return this.http.get<{ content: PerformanceReview[]; totalPages: number; totalElements: number }>(
      `${this.base}/persona/${id}`, { params: { page, size } });
  }
  save(input: PerformanceInput) { return this.http.post<PerformanceReview>(this.base, input); }
}
