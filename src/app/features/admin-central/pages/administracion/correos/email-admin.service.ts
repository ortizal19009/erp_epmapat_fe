import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import {
  BlacklistFormValue,
  EmailAccount,
  EmailAccountFormValue,
  EmailBlacklistEntry,
  EmailComposeFormValue,
  EmailDashboardSummary,
  EmailLog,
  EmailLogPage,
} from './email-admin.models';

@Injectable({
  providedIn: 'root',
})
export class EmailAdminService {
  readonly endpoints = {
    accounts: '/api/v1/email-accounts',
    accountDetail: (id: number) => `/api/v1/email-accounts/${id}`,
    accountActivate: (id: number) => `/api/v1/email-accounts/${id}/activate`,
    accountDeactivate: (id: number) => `/api/v1/email-accounts/${id}/deactivate`,
    emails: '/api/v1/emails',
    emailSummary: '/api/v1/emails/summary',
    emailDetail: (id: string) => `/api/v1/emails/${id}`,
    retryEmail: (id: string) => `/api/v1/emails/${id}/retry`,
    cancelEmail: (id: string) => `/api/v1/emails/${id}/cancel`,
    blacklist: '/api/v1/email-blacklist',
    blacklistDetail: (id: number) => `/api/v1/email-blacklist/${id}`,
    blacklistActivate: (id: number) => `/api/v1/email-blacklist/${id}/activate`,
    blacklistDeactivate: (id: number) => `/api/v1/email-blacklist/${id}/deactivate`,
    sendCustom: '/api/v1/emails/custom',
    sendNotifications: '/api/v1/emails/notifications',
    sendDocuments: '/api/v1/emails/documents',
  };

  private accountsSubject = new BehaviorSubject<EmailAccount[]>([]);
  private blacklistSubject = new BehaviorSubject<EmailBlacklistEntry[]>([]);

  constructor(private http: HttpClient) {}

  getAccounts(): Observable<EmailAccount[]> {
    return this.http.get<unknown>(this.url(this.endpoints.accounts)).pipe(
      map((response) => this.extractCollection(response).map((item) => this.mapAccount(item))),
      tap((rows) => this.accountsSubject.next(rows))
    );
  }

  getAccountById(accountId: number): Observable<EmailAccount> {
    return this.http.get<unknown>(this.url(this.endpoints.accountDetail(accountId))).pipe(
      map((response) => this.mapAccount(response))
    );
  }

  getEmails(filters: {
    page: number;
    size: number;
    status?: string;
    type?: string;
    accountId?: string;
    correlationId?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Observable<EmailLogPage> {
    let params = new HttpParams()
      .set('page', String(filters.page))
      .set('size', String(filters.size));

    if (filters.status && filters.status !== 'ALL') params = params.set('status', filters.status);
    if (filters.type && filters.type !== 'ALL') params = params.set('type', filters.type);
    if (filters.accountId && filters.accountId !== 'ALL') params = params.set('accountId', filters.accountId);
    if (filters.correlationId) params = params.set('correlationId', this.toText(filters.correlationId));
    if (filters.search) params = params.set('search', this.toText(filters.search));
    if (filters.dateFrom) params = params.set('dateFrom', filters.dateFrom);
    if (filters.dateTo) params = params.set('dateTo', filters.dateTo);

    return this.http.get<unknown>(this.url(this.endpoints.emails), { params }).pipe(
      map((response: any) => ({
        rows: this.extractCollection(response).map((item) => this.mapEmail(item)),
        totalElements: Number(response?.totalElements ?? 0),
        totalPages: Number(response?.totalPages ?? 0),
        page: Number(response?.number ?? filters.page),
        size: Number(response?.size ?? filters.size),
      }))
    );
  }

  getEmailSummary(): Observable<EmailDashboardSummary> {
    return this.http.get<any>(this.url(this.endpoints.emailSummary)).pipe(
      map((response) => ({
        activeAccounts: Number(response?.activeAccounts ?? 0),
        pendingEmails: Number(response?.pendingEmails ?? 0),
        failedEmails: Number(response?.failedEmails ?? 0),
        blockedDomains: Number(response?.blockedDomains ?? 0),
      }))
    );
  }

  getEmailById(emailId: string): Observable<EmailLog> {
    return this.http.get<unknown>(this.url(this.endpoints.emailDetail(emailId))).pipe(
      map((response) => this.mapEmail(response))
    );
  }

  getBlacklist(): Observable<EmailBlacklistEntry[]> {
    return this.http.get<unknown>(this.url(this.endpoints.blacklist)).pipe(
      map((response) => this.extractCollection(response).map((item) => this.mapBlacklist(item))),
      tap((rows) => this.blacklistSubject.next(rows))
    );
  }

  saveAccount(formValue: EmailAccountFormValue, editingId?: number): Observable<EmailAccount> {
    const payload = this.buildAccountPayload(formValue);
    const request$ = editingId
      ? this.http.put<unknown>(this.url(this.endpoints.accountDetail(editingId)), payload)
      : this.http.post<unknown>(this.url(this.endpoints.accounts), payload);

    return request$.pipe(map((response) => this.mapAccount(response)));
  }

  toggleAccountActive(accountId: number): Observable<void> {
    const account = this.accountsSubject.value.find((item) => item.id === accountId);
    const endpoint = account?.active
      ? this.endpoints.accountDeactivate(accountId)
      : this.endpoints.accountActivate(accountId);

    return this.http.post<unknown>(this.url(endpoint), {}).pipe(map(() => void 0));
  }

  markAccountAsDefault(accountId: number): Observable<void> {
    return throwError(() => new Error('El backend de cuentas de correo no expone un endpoint para marcar cuenta predeterminada.'));
  }

  testConnection(accountId: number): Observable<{ success: boolean; message: string }> {
    return throwError(() => new Error('El backend de cuentas de correo no expone un endpoint para probar conexion.'));
  }

  retryEmail(emailId: string, compose: EmailComposeFormValue, mode: 'retry' | 'edit-resend'): Observable<EmailLog> {
    if (mode === 'retry') {
      return this.http.post<unknown>(this.url(this.endpoints.retryEmail(emailId)), {}).pipe(
        map((response) => this.mapQueuedEmailResponse(response, compose, emailId))
      );
    }

    return this.http.post<unknown>(this.url(this.endpoints.sendCustom), this.buildSendEmailPayload(compose)).pipe(
      map((response) => this.mapQueuedEmailResponse(response, compose, emailId))
    );
  }

  cancelEmail(emailId: string): Observable<void> {
    return this.http.post<unknown>(this.url(this.endpoints.cancelEmail(emailId)), {}).pipe(map(() => void 0));
  }

  sendTestEmail(accountId: number, to: string): Observable<EmailLog> {
    const compose: EmailComposeFormValue = {
      accountId,
      to: this.toText(to),
      cc: '',
      bcc: '',
      subject: 'Prueba de configuracion de correo',
      body: '<p>Este es un correo de prueba enviado desde el modulo de administracion de correos.</p>',
    };

    return this.http.post<unknown>(this.url(this.endpoints.sendCustom), this.buildSendEmailPayload(compose)).pipe(
      map((response) => this.mapQueuedEmailResponse(response, compose))
    );
  }

  saveBlacklist(formValue: BlacklistFormValue, editingId?: number): Observable<EmailBlacklistEntry> {
    const payload = {
      type: formValue.type,
      value: formValue.value.trim(),
      reason: this.toText(formValue.reason),
      active: !!formValue.active,
    };
    const request$ = editingId
      ? this.http.put<unknown>(this.url(this.endpoints.blacklistDetail(editingId)), payload)
      : this.http.post<unknown>(this.url(this.endpoints.blacklist), payload);

    return request$.pipe(map((response) => this.mapBlacklist(response)));
  }

  toggleBlacklistActive(id: number): Observable<void> {
    const entry = this.blacklistSubject.value.find((item) => item.id === id);
    const endpoint = entry?.active
      ? this.endpoints.blacklistDeactivate(id)
      : this.endpoints.blacklistActivate(id);

    return this.http.post<unknown>(this.url(endpoint), {}).pipe(map(() => void 0));
  }

  removeBlacklist(id: number): Observable<void> {
    return throwError(() => new Error('El backend de lista negra no expone un endpoint para eliminar registros.'));
  }

  private url(path: string): string {
    return `${environment.API_URL}${path}`;
  }

  private buildAccountPayload(formValue: EmailAccountFormValue): Record<string, unknown> {
    const transportType = formValue.transportType;

    return {
      code: formValue.code.trim(),
      name: formValue.name.trim(),
      provider: formValue.provider.trim(),
      fromAddress: formValue.fromAddress.trim(),
      fromName: formValue.fromName.trim(),
      replyTo: formValue.replyTo.trim(),
      transportType,
      host: transportType === 'SMTP' ? this.nullableText(formValue.host) : null,
      port: transportType === 'SMTP' ? Number(formValue.port || 0) : null,
      protocol: transportType === 'SMTP' ? this.nullableText(formValue.protocol) : null,
      securityType: transportType === 'SMTP' ? formValue.securityType : null,
      authRequired: transportType === 'SMTP' ? !!formValue.authRequired : false,
      username: transportType === 'SMTP' ? this.nullableText(formValue.username) : null,
      password: transportType === 'SMTP' ? this.nullableText(formValue.password) : null,
      apiUrl: transportType === 'API_HTTP' ? this.nullableText(formValue.apiUrl) : null,
      apiAuthHeader: transportType === 'API_HTTP' ? this.nullableText(formValue.apiAuthHeader) : null,
      apiAuthScheme: transportType === 'API_HTTP' ? this.nullableText(formValue.apiAuthScheme) : null,
      apiKey: transportType === 'API_HTTP' ? this.nullableText(formValue.apiKey) : null,
      active: !!formValue.active,
      defaultAccount: !!formValue.defaultAccount,
      defaultForType: this.mapDefaultForTypeToBackend(formValue.defaultForType),
    };
  }

  private buildSendEmailPayload(compose: EmailComposeFormValue): Record<string, unknown> {
    return {
      accountId: compose.accountId,
      to: this.parseList(compose.to),
      cc: this.parseList(compose.cc),
      bcc: this.parseList(compose.bcc),
      subject: this.toText(compose.subject),
      html: this.toText(compose.body),
      text: this.stripHtml(this.toText(compose.body)),
    };
  }

  private extractCollection(response: any): any[] {
    if (Array.isArray(response)) {
      return response;
    }
    if (Array.isArray(response?.content)) {
      return response.content;
    }
    if (Array.isArray(response?.data)) {
      return response.data;
    }
    if (Array.isArray(response?.items)) {
      return response.items;
    }
    return [];
  }

  private mapQueuedEmailResponse(response: any, compose: EmailComposeFormValue, sourceId?: string): EmailLog {
    const queuedId = this.toText(response?.id ?? response?.emailId ?? sourceId ?? crypto.randomUUID());
    return {
      id: queuedId,
      subject: this.toText(compose.subject),
      type: 'CUSTOM',
      state: 'PENDING',
      fromAddress: '',
      accountId: Number(compose.accountId || 0),
      accountCode: '',
      accountName: undefined,
      to: this.parseList(compose.to),
      cc: this.parseList(compose.cc),
      bcc: this.parseList(compose.bcc),
      attempts: 0,
      correlationId: '',
      lastError: '',
      createdAt: new Date().toISOString(),
      body: this.toText(compose.body),
      attachments: [],
    };
  }

  private mapAccount(raw: any): EmailAccount {
    return {
      id: Number(raw?.id ?? raw?.accountId ?? 0),
      code: this.toText(raw?.code ?? raw?.codigo),
      name: this.toText(raw?.name ?? raw?.nombre),
      provider: this.toText(raw?.provider ?? raw?.proveedor),
      fromAddress: this.toText(raw?.fromAddress ?? raw?.from ?? raw?.correoDesde),
      fromName: this.toText(raw?.fromName ?? raw?.nombreDesde),
      replyTo: this.toText(raw?.replyTo ?? raw?.reply_to ?? raw?.responderA),
      transportType: this.toTransportType(raw?.transportType ?? raw?.tipoTransporte),
      host: this.nullableText(raw?.host),
      port: this.toOptionalNumber(raw?.port),
      protocol: this.nullableText(raw?.protocol ?? raw?.protocolo),
      securityType: this.toSecurityType(raw?.securityType ?? raw?.tipoSeguridad),
      authRequired: this.toBoolean(raw?.authRequired ?? raw?.requiereAuth, false),
      username: this.nullableText(raw?.username ?? raw?.usuario),
      password: this.nullableText(raw?.password ?? raw?.clave),
      apiUrl: this.nullableText(raw?.apiUrl ?? raw?.apiKeyName ?? raw?.nombreApiKey),
      apiAuthHeader: this.nullableText(raw?.apiAuthHeader),
      apiAuthScheme: this.toApiAuthScheme(raw?.apiAuthScheme ?? raw?.apiAccessLevel ?? raw?.nivelAccesoApi),
      apiKey: this.nullableText(raw?.apiKey),
      hasApiKey: this.toBoolean(raw?.hasApiKey ?? raw?.apiKeyEnabled, false),
      active: this.toBoolean(raw?.active ?? raw?.activo, false),
      defaultAccount: this.toBoolean(raw?.defaultAccount ?? raw?.cuentaDefault, false),
      defaultForType: this.toDefaultUse(raw?.defaultForType ?? raw?.usoPorDefecto),
      lastConnectionCheck: this.nullableText(raw?.lastConnectionCheck ?? raw?.ultimaVerificacionConexion),
      createdAt: this.nullableText(raw?.createdAt),
      updatedAt: this.nullableText(raw?.updatedAt),
    };
  }

  private mapEmail(raw: any): EmailLog {
    const attachmentSource = raw?.attachments ?? raw?.adjuntos ?? [];

    return {
      id: this.toText(raw?.id ?? raw?.emailId),
      subject: this.toText(raw?.subject ?? raw?.asunto),
      type: this.toMessageType(raw?.type ?? raw?.tipo),
      state: this.toMessageState(raw?.state ?? raw?.status ?? raw?.estado),
      fromAddress: this.toText(raw?.fromAddress ?? raw?.from ?? raw?.correoDesde),
      accountId: Number(raw?.accountId ?? raw?.emailAccountId ?? raw?.cuentaId ?? 0),
      accountCode: this.toText(raw?.accountCode ?? raw?.codigoCuenta),
      accountName: this.nullableText(raw?.accountName ?? raw?.nombreCuenta),
      to: this.toStringArray(raw?.to ?? raw?.destinatarios),
      cc: this.toStringArray(raw?.cc),
      bcc: this.toStringArray(raw?.bcc),
      attempts: Number(raw?.attempts ?? raw?.intentos ?? 0),
      correlationId: this.toText(raw?.correlationId ?? raw?.correlacion ?? raw?.traceId),
      lastError: this.toText(raw?.lastError ?? raw?.error ?? raw?.ultimoError),
      createdAt: this.toText(raw?.createdAt ?? raw?.fechaCreacion ?? new Date().toISOString()),
      sentAt: this.nullableText(raw?.sentAt ?? raw?.fechaEnvio),
      body: this.toText(raw?.bodyHtml ?? raw?.body ?? raw?.contenidoHtml ?? raw?.contenido ?? raw?.bodyText),
      attachments: Array.isArray(attachmentSource)
        ? attachmentSource.map((item: any) => ({
            name: this.toText(item?.name ?? item?.nombre ?? item?.filename),
            sizeLabel: this.resolveAttachmentSize(item),
          }))
        : [],
    };
  }

  private mapBlacklist(raw: any): EmailBlacklistEntry {
    return {
      id: Number(raw?.id ?? raw?.blacklistId ?? 0),
      type: this.toBlacklistType(raw?.type ?? raw?.tipo),
      value: this.toText(raw?.value ?? raw?.valor),
      reason: this.toText(raw?.reason ?? raw?.motivo),
      active: this.toBoolean(raw?.active ?? raw?.activo, false),
      createdAt: this.toText(raw?.createdAt ?? raw?.fechaCreacion ?? new Date().toISOString()),
    };
  }

  private resolveAttachmentSize(raw: any): string {
    const directLabel = this.nullableText(raw?.sizeLabel ?? raw?.tamanoLabel);
    if (directLabel) {
      return directLabel;
    }

    const sizeValue = Number(raw?.size ?? raw?.bytes ?? 0);
    if (!sizeValue) {
      return '0 KB';
    }

    if (sizeValue >= 1024 * 1024) {
      return `${(sizeValue / (1024 * 1024)).toFixed(1)} MB`;
    }

    return `${Math.max(1, Math.round(sizeValue / 1024))} KB`;
  }

  private toStringArray(value: unknown): string[] {
    if (Array.isArray(value)) {
      return value.map((item) => this.toText(item)).filter(Boolean);
    }
    return this.parseList(this.toText(value));
  }

  private parseList(raw: string): string[] {
    return String(raw || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  private stripHtml(value: string): string {
    return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  private toText(value: unknown, fallback = ''): string {
    if (value === null || value === undefined) {
      return fallback;
    }
    return String(value).trim();
  }

  private nullableText(value: unknown): string | undefined {
    const text = this.toText(value);
    return text ? text : undefined;
  }

  private toBoolean(value: unknown, fallback: boolean): boolean {
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'string') {
      return ['true', '1', 'yes', 'si'].includes(value.toLowerCase());
    }
    if (typeof value === 'number') {
      return value !== 0;
    }
    return fallback;
  }

  private toOptionalNumber(value: unknown): number | undefined {
    const next = Number(value);
    return Number.isFinite(next) && next > 0 ? next : undefined;
  }

  private toTransportType(value: unknown): 'SMTP' | 'API_HTTP' {
    const text = this.toText(value, 'SMTP').toUpperCase();
    return text === 'API_HTTP' ? 'API_HTTP' : 'SMTP';
  }

  private toSecurityType(value: unknown): 'NONE' | 'STARTTLS' | 'SSL_TLS' | undefined {
    const text = this.toText(value).toUpperCase();
    if (text === 'NONE' || text === 'STARTTLS' || text === 'SSL_TLS') {
      return text;
    }
    return undefined;
  }

  private toApiAuthScheme(value: unknown): 'Bearer' | 'Basic' | 'Token' | undefined {
    const text = this.toText(value);
    if (!text) {
      return undefined;
    }
    const normalized = text.toLowerCase();
    if (normalized === 'bearer') {
      return 'Bearer';
    }
    if (normalized === 'basic') {
      return 'Basic';
    }
    if (normalized === 'token') {
      return 'Token';
    }
    return undefined;
  }

  private toDefaultUse(value: unknown): 'FACTURACION' | 'NOTIFICACION' | 'CUSTOM' | 'GENERAL' {
    const text = this.toText(value, 'GENERAL').toUpperCase();
    if (text === 'DOC_ELECTRONICO') {
      return 'FACTURACION';
    }
    if (text === 'FACTURACION' || text === 'NOTIFICACION' || text === 'CUSTOM' || text === 'GENERAL') {
      return text;
    }
    return 'GENERAL';
  }

  private mapDefaultForTypeToBackend(value: 'FACTURACION' | 'NOTIFICACION' | 'CUSTOM' | 'GENERAL'): 'DOC_ELECTRONICO' | 'NOTIFICACION' | 'CUSTOM' {
    switch (value) {
      case 'FACTURACION':
        return 'DOC_ELECTRONICO';
      case 'NOTIFICACION':
        return 'NOTIFICACION';
      case 'CUSTOM':
        return 'CUSTOM';
      case 'GENERAL':
      default:
        return 'CUSTOM';
    }
  }

  private toMessageState(value: unknown): 'PENDING' | 'SENT' | 'FAILED' | 'CANCELLED' {
    const text = this.toText(value, 'PENDING').toUpperCase();
    if (text === 'SENT' || text === 'FAILED' || text === 'CANCELLED') {
      return text;
    }
    return 'PENDING';
  }

  private toMessageType(value: unknown): 'DOC_ELECTRONICO' | 'NOTIFICACION' | 'CUSTOM' {
    const text = this.toText(value, 'CUSTOM').toUpperCase();
    if (text === 'DOC_ELECTRONICO' || text === 'NOTIFICACION' || text === 'CUSTOM') {
      return text;
    }
    return 'CUSTOM';
  }

  private toBlacklistType(value: unknown): 'DOMAIN' | 'HOST' | 'EMAIL' {
    const text = this.toText(value, 'DOMAIN').toUpperCase();
    if (text === 'HOST' || text === 'EMAIL') {
      return text;
    }
    return 'DOMAIN';
  }
}
