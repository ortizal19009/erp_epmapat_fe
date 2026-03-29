import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import {
  BlacklistFormValue,
  EmailAccount,
  EmailAccountFormValue,
  EmailBlacklistEntry,
  EmailComposeFormValue,
  EmailLog,
} from './email-admin.models';
import { EMAIL_ACCOUNTS_MOCK, EMAIL_BLACKLIST_MOCK, EMAIL_LOGS_MOCK } from './email-admin.mocks';

@Injectable({
  providedIn: 'root',
})
export class EmailAdminService {
  readonly endpoints = {
    accounts: '/api/v1/email-accounts',
    accountActivate: (id: number) => `/api/v1/email-accounts/${id}/activate`,
    accountDeactivate: (id: number) => `/api/v1/email-accounts/${id}/deactivate`,
    emails: '/api/v1/emails',
    emailDetail: (id: string) => `/api/v1/emails/${id}`,
    retryEmail: (id: string) => `/api/v1/emails/${id}/retry`,
    cancelEmail: (id: string) => `/api/v1/emails/${id}/cancel`,
    blacklist: '/api/v1/email-blacklist',
    blacklistActivate: (id: number) => `/api/v1/email-blacklist/${id}/activate`,
    blacklistDeactivate: (id: number) => `/api/v1/email-blacklist/${id}/deactivate`,
    sendCustom: '/api/v1/emails/custom',
    sendNotifications: '/api/v1/emails/notifications',
    sendDocuments: '/api/v1/emails/documents',
  };

  private accountsSubject = new BehaviorSubject<EmailAccount[]>(this.clone(EMAIL_ACCOUNTS_MOCK));
  private emailsSubject = new BehaviorSubject<EmailLog[]>(this.clone(EMAIL_LOGS_MOCK));
  private blacklistSubject = new BehaviorSubject<EmailBlacklistEntry[]>(this.clone(EMAIL_BLACKLIST_MOCK));

  constructor(private http: HttpClient) {}

  getAccounts(): Observable<EmailAccount[]> {
    return this.accountsSubject.asObservable().pipe(map((rows) => this.clone(rows)), delay(120));
  }

  getEmails(): Observable<EmailLog[]> {
    return this.emailsSubject.asObservable().pipe(map((rows) => this.clone(rows)), delay(120));
  }

  getBlacklist(): Observable<EmailBlacklistEntry[]> {
    return this.blacklistSubject.asObservable().pipe(map((rows) => this.clone(rows)), delay(120));
  }

  saveAccount(formValue: EmailAccountFormValue, editingId?: number): Observable<EmailAccount> {
    const rows = this.clone(this.accountsSubject.value);
    const payload: EmailAccount = {
      id: editingId || this.nextNumericId(rows),
      code: formValue.code.trim(),
      name: formValue.name.trim(),
      provider: formValue.provider.trim(),
      fromAddress: formValue.fromAddress.trim(),
      fromName: formValue.fromName.trim(),
      replyTo: formValue.replyTo.trim(),
      transportType: formValue.transportType,
      host: formValue.transportType === 'SMTP' ? formValue.host.trim() : '',
      port: formValue.transportType === 'SMTP' ? Number(formValue.port || 0) : undefined,
      protocol: formValue.transportType === 'SMTP' ? formValue.protocol.trim() : '',
      securityType: formValue.transportType === 'SMTP' ? formValue.securityType : undefined,
      authRequired: formValue.transportType === 'SMTP' ? !!formValue.authRequired : false,
      username: formValue.transportType === 'SMTP' ? formValue.username.trim() : '',
      password: formValue.transportType === 'SMTP' ? formValue.password.trim() : '',
      apiKeyName: formValue.transportType === 'API_HTTP' ? formValue.apiKeyName.trim() : '',
      apiKey: formValue.transportType === 'API_HTTP' ? formValue.apiKey.trim() : '',
      apiAccessLevel: formValue.transportType === 'API_HTTP' ? formValue.apiAccessLevel : undefined,
      apiRestrictedAccess: formValue.transportType === 'API_HTTP' ? !!formValue.apiRestrictedAccess : false,
      apiKeyEnabled: formValue.transportType === 'API_HTTP' ? !!formValue.apiKeyEnabled : false,
      apiCreatedAt: formValue.transportType === 'API_HTTP' ? (formValue.apiCreatedAt || new Date().toISOString()) : '',
      apiLastActivityAt: formValue.transportType === 'API_HTTP' ? formValue.apiLastActivityAt.trim() : '',
      apiExpiresAt: formValue.transportType === 'API_HTTP' ? formValue.apiExpiresAt.trim() : '',
      active: !!formValue.active,
      defaultAccount: !!formValue.defaultAccount,
      defaultForType: formValue.defaultForType,
      lastConnectionCheck: editingId
        ? rows.find((item) => item.id === editingId)?.lastConnectionCheck
        : new Date().toISOString(),
    };

    const nextRows = payload.defaultAccount
      ? rows.map((item) => ({
          ...item,
          defaultAccount: item.id === payload.id,
          defaultForType: item.id === payload.id ? payload.defaultForType : item.defaultForType,
        }))
      : rows;

    const index = nextRows.findIndex((item) => item.id === payload.id);
    if (index >= 0) {
      nextRows[index] = payload;
    } else {
      nextRows.unshift(payload);
    }

    this.accountsSubject.next(nextRows);
    return of(payload).pipe(delay(180));
  }

  toggleAccountActive(accountId: number): Observable<void> {
    const nextRows = this.clone(this.accountsSubject.value).map((item) =>
      item.id === accountId ? { ...item, active: !item.active } : item
    );
    this.accountsSubject.next(nextRows);
    return of(void 0).pipe(delay(120));
  }

  markAccountAsDefault(accountId: number): Observable<void> {
    const target = this.accountsSubject.value.find((item) => item.id === accountId);
    if (!target) {
      return of(void 0);
    }
    const nextRows = this.clone(this.accountsSubject.value).map((item) => ({
      ...item,
      defaultAccount: item.id === accountId,
      defaultForType: item.id === accountId ? target.defaultForType : item.defaultForType,
    }));
    this.accountsSubject.next(nextRows);
    return of(void 0).pipe(delay(120));
  }

  testConnection(accountId: number): Observable<{ success: boolean; message: string }> {
    const nextRows = this.clone(this.accountsSubject.value).map((item) =>
      item.id === accountId ? { ...item, lastConnectionCheck: new Date().toISOString() } : item
    );
    const account = nextRows.find((item) => item.id === accountId);
    this.accountsSubject.next(nextRows);
    return of({
      success: true,
      message: `Conexion verificada correctamente para ${account?.code || 'la cuenta seleccionada'}.`,
    }).pipe(delay(320));
  }

  retryEmail(emailId: string, compose: EmailComposeFormValue, mode: 'retry' | 'edit-resend'): Observable<EmailLog> {
    const source = this.emailsSubject.value.find((item) => item.id === emailId);
    const account = this.accountsSubject.value.find((item) => item.id === compose.accountId);
    const nextEmail: EmailLog = {
      id: this.nextEmailId(),
      subject: compose.subject.trim(),
      type: source?.type || 'CUSTOM',
      state: 'PENDING',
      fromAddress: account?.fromAddress || source?.fromAddress || '',
      accountId: account?.id || source?.accountId || 0,
      accountCode: account?.code || source?.accountCode || '',
      accountName: account?.name || source?.accountName || '',
      to: this.parseList(compose.to),
      cc: this.parseList(compose.cc),
      bcc: this.parseList(compose.bcc),
      attempts: mode === 'retry' ? (source?.attempts || 0) + 1 : 1,
      correlationId: `${source?.correlationId || 'MAIL'}-R${new Date().getTime().toString().slice(-4)}`,
      lastError: '',
      createdAt: new Date().toISOString(),
      body: compose.body,
      attachments: this.clone(source?.attachments || []),
    };

    this.emailsSubject.next([nextEmail, ...this.clone(this.emailsSubject.value)]);
    return of(nextEmail).pipe(delay(180));
  }

  cancelEmail(emailId: string): Observable<void> {
    const nextRows = this.clone(this.emailsSubject.value).map((item) =>
      item.id === emailId
        ? {
            ...item,
            state: 'CANCELLED' as const,
            lastError: item.lastError || 'Cancelado manualmente por operador.',
          }
        : item
    );
    this.emailsSubject.next(nextRows);
    return of(void 0).pipe(delay(140));
  }

  saveBlacklist(formValue: BlacklistFormValue, editingId?: number): Observable<EmailBlacklistEntry> {
    const rows = this.clone(this.blacklistSubject.value);
    const payload: EmailBlacklistEntry = {
      id: editingId || this.nextNumericId(rows),
      type: formValue.type,
      value: formValue.value.trim(),
      reason: formValue.reason.trim(),
      active: !!formValue.active,
      createdAt: editingId
        ? rows.find((item) => item.id === editingId)?.createdAt || new Date().toISOString()
        : new Date().toISOString(),
    };

    const index = rows.findIndex((item) => item.id === payload.id);
    if (index >= 0) {
      rows[index] = payload;
    } else {
      rows.unshift(payload);
    }
    this.blacklistSubject.next(rows);
    return of(payload).pipe(delay(160));
  }

  toggleBlacklistActive(id: number): Observable<void> {
    const nextRows = this.clone(this.blacklistSubject.value).map((item) =>
      item.id === id ? { ...item, active: !item.active } : item
    );
    this.blacklistSubject.next(nextRows);
    return of(void 0).pipe(delay(120));
  }

  removeBlacklist(id: number): Observable<void> {
    const nextRows = this.clone(this.blacklistSubject.value).filter((item) => item.id !== id);
    this.blacklistSubject.next(nextRows);
    return of(void 0).pipe(delay(120));
  }

  private parseList(raw: string): string[] {
    return String(raw || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  private nextNumericId<T extends { id: number }>(rows: T[]): number {
    return rows.reduce((max, item) => Math.max(max, item.id), 0) + 1;
  }

  private nextEmailId(): string {
    const chunk = new Date().getTime().toString(16).slice(-12).padStart(12, '0');
    return `00000000-0000-4000-8000-${chunk}`;
  }

  private clone<T>(value: T): T {
    return JSON.parse(JSON.stringify(value));
  }
}
