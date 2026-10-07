import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/api/th-leave`;

export interface ThLeaveMovement {
  idmovement: number;
  idbalance: number;
  anio: number;
  idrequest: number | null;
  idmovement_origen: number | null;
  tipo: 'APERTURA' | 'CONSUMO' | 'REINTEGRO' | 'AJUSTE';
  dias: number;
  disponibles_antes: number;
  disponibles_despues: number;
  usados_antes: number;
  usados_despues: number;
  asignados: number;
  usuario: number;
  fecha: string;
  motivo: string | null;
}

export interface ThLeaveReconciliationYear {
  anio: number | null;
  idbalance: number | null;
  activo: boolean | null;
  estado_libro: 'SIN_SALDO' | 'SALDO_INVALIDO' | 'SIN_LIBRO' | 'DIFERENCIA' | 'COINCIDE';
  asignados_actuales: number | null;
  usados_actuales: number | null;
  disponibles_actuales: number | null;
  apertura: number | null;
  consumos: number | null;
  reintegros: number | null;
  ajustes: number | null;
  disponibles_libro: number | null;
  usados_libro: number | null;
  asignados_libro: number | null;
  diferencia_disponibles: number | null;
  diferencia_usados: number | null;
  diferencia_asignados: number | null;
  movimientos: number;
  solicitudes_sin_consumo: number[];
  alertas: string[];
}

export interface ThLeaveReconciliation {
  idpersonal: number;
  generado_en: string;
  ejercicios: ThLeaveReconciliationYear[];
}

export interface ThLeaveInboxRequest {
  idrequest: number;
  idpersonal: number | null;
  nombres: string | null;
  apellidos: string | null;
  tipolicencia: string;
  estado: string;
  fechainicio: string | null;
  fechafin: string | null;
  dias_solicitados: number | null;
  motivo: string | null;
  feccrea: string | null;
  aprobador_id: number | null;
  fecha_aprobacion: string | null;
  observacion_aprobacion: string | null;
  resuelto_por: number | null;
  fecha_resolucion: string | null;
  motivo_resolucion: string | null;
}

export interface ThLeaveInbox {
  contenido: ThLeaveInboxRequest[];
  pagina: number;
  tamano: number;
  total_elementos: number;
  total_paginas: number;
}

export interface ThLeaveInboxFilter {
  estado: string;
  tipo: string;
  idpersonal: number;
  desde: string;
  hasta: string;
}

export interface ThLeaveHistory {
  solicitud: ThLeaveInboxRequest;
  consultado_en: string;
  eventos: { idaudit: number; accion: string | null; detalle: string | null; usuario: number | null; fecha: string | null }[];
  movimientos: ThLeaveMovement[];
  advertencias: string[];
}

export interface ThLeaveBalanceState {
  idbalance: number;
  idpersonal: number;
  anio: number;
  estado: boolean | null;
  version: number;
  eventos: ThLeaveHistory['eventos'];
}

@Injectable({
  providedIn: 'root',
})
export class ThLeaveService {
  constructor(private http: HttpClient) {}

  getPermissions() {
    return this.http.get<{ userId: number; canWrite: boolean }>(`${baseUrl}/permissions`);
  }

  ajustarSaldo(idbalance: number, payload: { dias: number; motivo: string; clave: string }) {
    return this.http.post(`${baseUrl}/balances/${idbalance}/ajustar`, payload);
  }

  abrirLibro(idbalance: number) {
    return this.http.post(`${baseUrl}/balances/${idbalance}/abrir-libro`, {});
  }

  createBalance(payload: any) {
    return this.http.post(`${baseUrl}/balances`, payload);
  }

  getBalancesByPersonal(idpersonal: number) {
    return this.http.get(`${baseUrl}/balances/persona/${idpersonal}`);
  }

  getBandeja(filter: ThLeaveInboxFilter, pagina: number, tamano: number) {
    const params: { [key: string]: string | number } = { estado: filter.estado, tipo: filter.tipo, pagina, tamano };
    if (filter.idpersonal) params['idpersonal'] = filter.idpersonal;
    if (filter.desde) params['desde'] = filter.desde;
    if (filter.hasta) params['hasta'] = filter.hasta;
    return this.http.get<ThLeaveInbox>(`${baseUrl}/requests/bandeja`, { params });
  }

  exportarBandeja(filter: ThLeaveInboxFilter, pagina: number, tamano: number) {
    const params: { [key: string]: string | number } = { estado: filter.estado, tipo: filter.tipo, pagina, tamano };
    if (filter.idpersonal) params['idpersonal'] = filter.idpersonal;
    if (filter.desde) params['desde'] = filter.desde;
    if (filter.hasta) params['hasta'] = filter.hasta;
    return this.http.get(`${baseUrl}/requests/bandeja.csv`, { params, responseType: 'blob' });
  }

  getHistorial(idrequest: number) {
    return this.http.get<ThLeaveHistory>(`${baseUrl}/requests/${idrequest}/historial`);
  }

  getCalendario(tipo: string, idpersonal: number, desde: string, hasta: string, pagina: number) {
    const params: { [key: string]: string | number } = { tipo, desde, hasta, pagina };
    if (idpersonal) params['idpersonal'] = idpersonal;
    return this.http.get<ThLeaveInbox>(`${baseUrl}/requests/calendario`, { params });
  }

  cambiarEstadoSaldo(idbalance: number, payload: { activo: boolean; version: number; motivo: string }) {
    return this.http.post(`${baseUrl}/balances/${idbalance}/estado`, payload);
  }

  historialEstadoSaldo(idbalance: number) {
    return this.http.get<ThLeaveBalanceState>(`${baseUrl}/balances/${idbalance}/historial-estado`);
  }

  verificarConciliacion(idpersonal: number, anio?: number) {
    return this.http.get<ThLeaveReconciliation>(`${baseUrl}/balances/persona/${idpersonal}/conciliacion`,
      { params: anio === undefined ? {} : { anio } });
  }

  exportarConciliacion(idpersonal: number, anio?: number) {
    return this.http.get(`${baseUrl}/balances/persona/${idpersonal}/conciliacion.csv`,
      { params: anio === undefined ? {} : { anio }, responseType: 'blob' });
  }

  createRequest(payload: any) {
    return this.http.post(`${baseUrl}/requests`, payload);
  }

  getRequestsByPersonal(idpersonal: number) {
    return this.http.get(`${baseUrl}/requests/persona/${idpersonal}`);
  }

  getRequestsByEstado(estado: string) {
    return this.http.get(`${baseUrl}/requests?estado=${estado}`);
  }

  aprobar(idrequest: number, payload: { observacion: string }) {
    return this.http.post(`${baseUrl}/requests/${idrequest}/aprobar`, payload);
  }

  rechazar(idrequest: number, payload: { observacion: string }) {
    return this.http.post(`${baseUrl}/requests/${idrequest}/rechazar`, payload);
  }

  cancelar(idrequest: number, payload: { motivo: string }) {
    return this.http.post(`${baseUrl}/requests/${idrequest}/cancelar`, payload);
  }

  revertir(idrequest: number, payload: { motivo: string }) {
    return this.http.post(`${baseUrl}/requests/${idrequest}/revertir`, payload);
  }

  getMovementsByPersonal(idpersonal: number) {
    return this.http.get<ThLeaveMovement[]>(`${baseUrl}/movements/persona/${idpersonal}`);
  }

  exportarLibro(idpersonal: number, anio: number) {
    return this.http.get(`${baseUrl}/movements/persona/${idpersonal}/libro.csv`, { params: { anio }, responseType: 'blob' });
  }
}
