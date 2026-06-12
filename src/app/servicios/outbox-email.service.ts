import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { PageResponse } from '../interfaces/page-response';

export interface OutboxAttachment {
  name: string;
  contentType: string;
  base64: string;
}

export interface OutboxEmailPayload {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  html?: string;
  text?: string;
  correlationId?: string;
  accountId?: number | null;
  attachments?: OutboxAttachment[];
}

export interface OutboxEmailHistory {
  id: string;
  type: string;
  status: string;
  subject: string;
  correlationId: string;
  accountId?: number | null;
  accountCode?: string | null;
  accountName?: string | null;
  fromAddress?: string | null;
  attempts: number;
  lastError?: string | null;
  createdAt: string;
  sentAt?: string | null;
  to: string[];
  cc: string[];
  bcc: string[];
}

@Injectable({
  providedIn: 'root',
})
export class OutboxEmailService {
  private readonly baseUrl = `${environment.API_URL}/api/v1/emails`;

  constructor(private http: HttpClient) {}

  sendDocumentEmail(payload: OutboxEmailPayload): Observable<any> {
    return this.http.post(`${this.baseUrl}/documents`, payload);
  }

  sendNotificationEmail(payload: OutboxEmailPayload): Observable<any> {
    return this.http.post(`${this.baseUrl}/notifications`, payload);
  }

  getNotificationHistoryByAbonado(
    idabonado: number,
    page: number = 0,
    size: number = 10
  ): Observable<PageResponse<OutboxEmailHistory>> {
    const correlationId = `NOTIFICACION-${idabonado}-`;
    return this.http.get<PageResponse<OutboxEmailHistory>>(
      `${this.baseUrl}?type=NOTIFICACION&correlationId=${encodeURIComponent(correlationId)}&page=${page}&size=${size}`
    );
  }
}
