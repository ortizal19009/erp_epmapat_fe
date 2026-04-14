import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

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
}
