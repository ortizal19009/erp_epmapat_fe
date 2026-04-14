import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription, forkJoin, of, timer } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { EmailAdminService } from './email-admin.service';
import {
  BLACKLIST_TYPE_OPTIONS,
  EMAIL_API_AUTH_SCHEME_OPTIONS,
  EMAIL_DEFAULT_USE_OPTIONS,
  EMAIL_SECURITY_OPTIONS,
  EMAIL_STATE_OPTIONS,
  EMAIL_TRANSPORT_OPTIONS,
  EMAIL_TYPE_OPTIONS,
  EmailAccount,
  EmailBlacklistEntry,
  EmailLog,
} from './email-admin.models';
import { EmailSummaryCardComponent } from './components/email-summary-card.component';
import { EmailAccountsTableComponent } from './components/email-accounts-table.component';
import { EmittedEmailsTableComponent } from './components/emitted-emails-table.component';
import { EmailBlacklistTableComponent } from './components/email-blacklist-table.component';
import { EmailStatusBadgeComponent } from './components/email-status-badge.component';

@Component({
  standalone: true,
  selector: 'app-email-admin',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    EmailSummaryCardComponent,
    EmailAccountsTableComponent,
    EmittedEmailsTableComponent,
    EmailBlacklistTableComponent,
    EmailStatusBadgeComponent,
  ],
  templateUrl: './email-admin.component.html',
  styleUrls: ['./email-admin.component.css'],
})
export class EmailAdminComponent implements OnInit, OnDestroy {
  readonly transportOptions = EMAIL_TRANSPORT_OPTIONS;
  readonly securityOptions = EMAIL_SECURITY_OPTIONS;
  readonly defaultUseOptions = EMAIL_DEFAULT_USE_OPTIONS;
  readonly stateOptions = EMAIL_STATE_OPTIONS;
  readonly typeOptions = EMAIL_TYPE_OPTIONS;
  readonly blacklistTypeOptions = BLACKLIST_TYPE_OPTIONS;
  readonly apiAuthSchemeOptions = EMAIL_API_AUTH_SCHEME_OPTIONS;

  activeSection: 'accounts' | 'emails' | 'blacklist' = 'accounts';
  loading = true;
  errorMessage = '';
  toastMessage = '';
  toastTone: 'success' | 'danger' | 'warning' | 'info' = 'info';

  accounts: EmailAccount[] = [];
  emails: EmailLog[] = [];
  blacklist: EmailBlacklistEntry[] = [];

  accountSearch = '';
  accountTransportFilter = 'ALL';
  accountStatusFilter = 'ALL';

  emailSearch = '';
  emailStatusFilter = 'ALL';
  emailTypeFilter = 'ALL';
  emailAccountFilter = 'ALL';
  emailCorrelationFilter = '';
  emailDateFrom = '';
  emailDateTo = '';

  blacklistSearch = '';
  blacklistTypeFilter = 'ALL';
  blacklistStatusFilter = 'ALL';

  testAccountId: number | null = null;
  testEmailRecipient = '';
  sendingTestEmail = false;
  private testEmailMonitor?: Subscription;

  accountDrawerOpen = false;
  composeDrawerOpen = false;
  blacklistModalOpen = false;
  detailDrawerOpen = false;
  detailMode: 'email' | 'account' = 'email';

  selectedAccount: EmailAccount | null = null;
  selectedEmail: EmailLog | null = null;
  selectedBlacklist: EmailBlacklistEntry | null = null;
  composeSourceEmail: EmailLog | null = null;
  composeMode: 'retry' | 'edit-resend' = 'retry';

  confirmDialog = {
    open: false,
    title: '',
    message: '',
    confirmLabel: '',
    action: () => {},
  };

  readonly accountForm = this.fb.group({
    code: ['', [Validators.required, Validators.maxLength(30)]],
    name: ['', [Validators.required, Validators.maxLength(80)]],
    provider: ['', [Validators.required, Validators.maxLength(50)]],
    fromAddress: ['', [Validators.required, Validators.email]],
    fromName: ['', [Validators.required, Validators.maxLength(80)]],
    replyTo: ['', [Validators.required, Validators.email]],
    transportType: ['SMTP', Validators.required],
    host: [''],
    port: [587],
    protocol: ['smtp'],
    securityType: ['STARTTLS'],
    authRequired: [true],
    username: [''],
    password: [''],
    apiUrl: [''],
    apiAuthHeader: ['Authorization'],
    apiAuthScheme: ['Bearer'],
    apiKey: [''],
    active: [true],
    defaultAccount: [false],
    defaultForType: ['GENERAL', Validators.required],
  });

  readonly composeForm = this.fb.group({
    accountId: [null as number | null, Validators.required],
    to: ['', Validators.required],
    cc: [''],
    bcc: [''],
    subject: ['', Validators.required],
    body: ['', Validators.required],
  });

  readonly blacklistForm = this.fb.group({
    type: ['DOMAIN', Validators.required],
    value: ['', Validators.required],
    reason: ['', [Validators.required, Validators.maxLength(180)]],
    active: [true],
  });

  constructor(private fb: FormBuilder, private emailAdminService: EmailAdminService) {}

  ngOnInit(): void {
    this.accountForm.get('transportType')?.valueChanges.subscribe(() => this.applyTransportValidators());
    this.accountForm.get('authRequired')?.valueChanges.subscribe(() => this.applyTransportValidators());
    this.applyTransportValidators();
    this.loadAll();
  }

  ngOnDestroy(): void {
    this.testEmailMonitor?.unsubscribe();
  }

  get summaryCards() {
    return [
      {
        label: 'Cuentas activas',
        value: String(this.accounts.filter((item) => item.active).length),
        help: 'Canales habilitados para envio inmediato',
        icon: 'bi bi-send-check',
        tone: 'success' as const,
      },
      {
        label: 'Correos pendientes',
        value: String(this.emails.filter((item) => item.state === 'PENDING').length),
        help: 'Mensajes en cola o listos para reproceso',
        icon: 'bi bi-hourglass-split',
        tone: 'warning' as const,
      },
      {
        label: 'Correos fallidos',
        value: String(this.emails.filter((item) => item.state === 'FAILED').length),
        help: 'Eventos que requieren revision operativa',
        icon: 'bi bi-exclamation-octagon',
        tone: 'danger' as const,
      },
      {
        label: 'Dominios bloqueados',
        value: String(this.blacklist.filter((item) => item.active).length),
        help: 'Entradas activas que impiden el envio',
        icon: 'bi bi-shield-slash',
        tone: 'info' as const,
      },
    ];
  }

  get filteredAccounts(): EmailAccount[] {
    return this.accounts.filter((item) => {
      const search = `${item.name} ${item.code} ${item.provider} ${item.fromAddress} ${item.apiUrl || ''}`.toLowerCase();
      const matchesSearch = !this.accountSearch || search.includes(this.accountSearch.toLowerCase());
      const matchesTransport = this.accountTransportFilter === 'ALL' || item.transportType === this.accountTransportFilter;
      const matchesStatus =
        this.accountStatusFilter === 'ALL' ||
        (this.accountStatusFilter === 'ACTIVE' && item.active) ||
        (this.accountStatusFilter === 'INACTIVE' && !item.active);
      return matchesSearch && matchesTransport && matchesStatus;
    });
  }

  get filteredEmails(): EmailLog[] {
    return this.emails.filter((item) => {
      const quickSearch = `${item.subject} ${item.to.join(',')} ${item.fromAddress}`.toLowerCase();
      const createdDate = item.createdAt.slice(0, 10);
      const matchesSearch = !this.emailSearch || quickSearch.includes(this.emailSearch.toLowerCase());
      const matchesState = this.emailStatusFilter === 'ALL' || item.state === this.emailStatusFilter;
      const matchesType = this.emailTypeFilter === 'ALL' || item.type === this.emailTypeFilter;
      const matchesAccount = this.emailAccountFilter === 'ALL' || String(item.accountId) === String(this.emailAccountFilter);
      const matchesCorrelation = !this.emailCorrelationFilter || item.correlationId.toLowerCase().includes(this.emailCorrelationFilter.toLowerCase());
      const matchesFrom = !this.emailDateFrom || createdDate >= this.emailDateFrom;
      const matchesTo = !this.emailDateTo || createdDate <= this.emailDateTo;
      return matchesSearch && matchesState && matchesType && matchesAccount && matchesCorrelation && matchesFrom && matchesTo;
    });
  }

  get filteredBlacklist(): EmailBlacklistEntry[] {
    return this.blacklist.filter((item) => {
      const search = `${item.value} ${item.reason}`.toLowerCase();
      const matchesSearch = !this.blacklistSearch || search.includes(this.blacklistSearch.toLowerCase());
      const matchesType = this.blacklistTypeFilter === 'ALL' || item.type === this.blacklistTypeFilter;
      const matchesStatus =
        this.blacklistStatusFilter === 'ALL' ||
        (this.blacklistStatusFilter === 'ACTIVE' && item.active) ||
        (this.blacklistStatusFilter === 'INACTIVE' && !item.active);
      return matchesSearch && matchesType && matchesStatus;
    });
  }

  loadAll(): void {
    this.loading = true;
    this.errorMessage = '';
    forkJoin({
      accounts: this.emailAdminService.getAccounts(),
      emails: this.emailAdminService.getEmails(),
      blacklist: this.emailAdminService.getBlacklist(),
    }).subscribe({
      next: ({ accounts, emails, blacklist }) => {
        this.accounts = accounts;
        this.emails = emails;
        this.blacklist = blacklist;
        if (this.testAccountId && !this.accounts.some((item) => item.id === this.testAccountId)) {
          this.testAccountId = null;
        }
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'No fue posible cargar el modulo de correos. Intenta nuevamente.';
        this.loading = false;
      },
    });
  }

  openNewAccount(): void {
    this.selectedAccount = null;
    this.accountForm.reset({
      code: '',
      name: '',
      provider: '',
      fromAddress: '',
      fromName: '',
      replyTo: '',
      transportType: 'SMTP',
      host: '',
      port: 587,
      protocol: 'smtp',
      securityType: 'STARTTLS',
      authRequired: true,
      username: '',
      password: '',
      apiUrl: '',
      apiAuthHeader: 'Authorization',
      apiAuthScheme: 'Bearer',
      apiKey: '',
      active: true,
      defaultAccount: false,
      defaultForType: 'GENERAL',
    });
    this.applyLegacyFacturaSmtpDefaults(false);
    this.applyTransportValidators();
    this.accountDrawerOpen = true;
  }

  openEditAccount(account: EmailAccount): void {
    this.selectedAccount = account;
    this.accountForm.reset({
      code: account.code,
      name: account.name,
      provider: account.provider,
      fromAddress: account.fromAddress,
      fromName: account.fromName,
      replyTo: account.replyTo,
      transportType: account.transportType,
      host: account.host || '',
      port: account.port || 587,
      protocol: account.protocol || 'smtp',
      securityType: account.securityType || 'STARTTLS',
      authRequired: !!account.authRequired,
      username: account.username || '',
      password: '',
      apiUrl: account.apiUrl || '',
      apiAuthHeader: account.apiAuthHeader || 'Authorization',
      apiAuthScheme: account.apiAuthScheme || 'Bearer',
      apiKey: '',
      active: account.active,
      defaultAccount: account.defaultAccount,
      defaultForType: account.defaultForType,
    });
    this.applyTransportValidators();
    this.accountDrawerOpen = true;
  }

  submitAccount(): void {
    if (this.accountForm.invalid) {
      this.accountForm.markAllAsTouched();
      this.showToast(this.invalidAccountFormMessage(), 'warning');
      return;
    }
    const formValue = { ...this.accountForm.getRawValue() } as any;
    this.emailAdminService.saveAccount(formValue, this.selectedAccount?.id).subscribe({
      next: () => {
        this.accountDrawerOpen = false;
        this.loadAll();
        this.showToast(this.selectedAccount ? 'Cuenta actualizada correctamente.' : 'Cuenta creada correctamente.', 'success');
      },
      error: (error: any) => {
        this.handleActionError(error, 'No fue posible guardar la cuenta en el backend.');
      },
    });
  }

  openAccountDetail(account: EmailAccount): void {
    this.selectedAccount = account;
    this.selectedEmail = null;
    this.detailMode = 'account';
    this.detailDrawerOpen = true;
  }

  confirmToggleAccount(account: EmailAccount): void {
    this.openConfirm(
      account.active ? 'Desactivar cuenta' : 'Activar cuenta',
      `La cuenta ${account.code} ${account.active ? 'dejara de' : 'volvera a'} enviar correos del ERP.`,
      account.active ? 'Desactivar' : 'Activar',
      () => {
        this.emailAdminService.toggleAccountActive(account.id).subscribe(() => {
          this.loadAll();
          this.showToast(`Estado de ${account.code} actualizado.`, 'info');
        });
      }
    );
  }

  markAsDefault(account: EmailAccount): void {
    this.emailAdminService.markAccountAsDefault(account.id).subscribe(() => {
      this.loadAll();
      this.showToast(`La cuenta ${account.code} ahora es la predeterminada.`, 'success');
    });
  }

  testConnection(account: EmailAccount): void {
    this.openEditAccount(account);
    this.showToast('Tu backend no expone prueba de conexion. Usa el bloque de envio de prueba dentro de la cuenta.', 'info');
  }

  openEmailDetail(email: EmailLog): void {
    this.selectedAccount = this.accounts.find((item) => item.id === email.accountId) || null;
    this.detailMode = 'email';
    this.detailDrawerOpen = true;
    this.selectedEmail = email;
    this.emailAdminService.getEmailById(email.id).subscribe({
      next: (detail) => {
        this.selectedEmail = detail;
      },
      error: () => {
        this.showToast('No fue posible cargar el detalle completo del correo.', 'warning');
      },
    });
  }

  openCompose(email: EmailLog, mode: 'retry' | 'edit-resend'): void {
    this.composeSourceEmail = email;
    this.composeMode = mode;
    this.composeForm.reset({
      accountId: email.accountId,
      to: email.to.join(', '),
      cc: email.cc.join(', '),
      bcc: email.bcc.join(', '),
      subject: email.subject,
      body: email.body,
    });
    this.composeDrawerOpen = true;
  }

  submitCompose(): void {
    if (this.composeForm.invalid || !this.composeSourceEmail) {
      this.composeForm.markAllAsTouched();
      return;
    }
    const composeValue = { ...this.composeForm.getRawValue() } as any;
    this.emailAdminService.retryEmail(this.composeSourceEmail.id, composeValue, this.composeMode).subscribe(() => {
      this.composeDrawerOpen = false;
      this.loadAll();
      this.showToast(this.composeMode === 'edit-resend' ? 'Correo editado y reenviado como nuevo intento.' : 'Correo enviado nuevamente a la cola de salida.', 'success');
    });
  }

  cancelPendingEmail(email: EmailLog): void {
    this.openConfirm(
      'Cancelar correo pendiente',
      `El correo ${email.correlationId} quedara en estado CANCELLED y ya no sera enviado.`,
      'Cancelar correo',
      () => {
        this.emailAdminService.cancelEmail(email.id).subscribe(() => {
          this.loadAll();
          this.showToast(`Correo ${email.correlationId} cancelado.`, 'warning');
        });
      }
    );
  }

  openBlacklistModal(entry?: EmailBlacklistEntry): void {
    this.selectedBlacklist = entry || null;
    this.blacklistForm.reset({ type: entry?.type || 'DOMAIN', value: entry?.value || '', reason: entry?.reason || '', active: entry?.active ?? true });
    this.blacklistModalOpen = true;
  }

  submitBlacklist(): void {
    if (this.blacklistForm.invalid) {
      this.blacklistForm.markAllAsTouched();
      return;
    }
    const blacklistValue = { ...this.blacklistForm.getRawValue() } as any;
    this.emailAdminService.saveBlacklist(blacklistValue, this.selectedBlacklist?.id).subscribe(() => {
      this.blacklistModalOpen = false;
      this.loadAll();
      this.showToast(this.selectedBlacklist ? 'Bloqueo actualizado.' : 'Registro agregado a la lista negra.', 'success');
    });
  }

  toggleBlacklist(entry: EmailBlacklistEntry): void {
    this.emailAdminService.toggleBlacklistActive(entry.id).subscribe(() => {
      this.loadAll();
      this.showToast(`Registro ${entry.value} actualizado.`, 'info');
    });
  }

  removeBlacklist(entry: EmailBlacklistEntry): void {
    this.openConfirm('Eliminar bloqueo', `El valor ${entry.value} sera retirado de la lista negra.`, 'Eliminar', () => {
      this.emailAdminService.removeBlacklist(entry.id).subscribe(() => {
        this.loadAll();
        this.showToast(`Registro ${entry.value} eliminado.`, 'warning');
      });
    });
  }

  showError(email: EmailLog): void {
    this.showToast(email.lastError || 'El correo no registra error tecnico.', email.lastError ? 'danger' : 'info');
  }

  showAttachments(email: EmailLog): void {
    const summary = email.attachments.map((item) => `${item.name} (${item.sizeLabel})`).join(' | ');
    this.showToast(summary || 'El correo no tiene adjuntos.', email.attachments.length ? 'info' : 'warning');
  }

  openConfirm(title: string, message: string, confirmLabel: string, action: () => void): void {
    this.confirmDialog = { open: true, title, message, confirmLabel, action };
  }

  confirmNow(): void {
    const action = this.confirmDialog.action;
    this.confirmDialog.open = false;
    action();
  }

  closeConfirm(): void { this.confirmDialog.open = false; }
  closeDetail(): void { this.detailDrawerOpen = false; }

  transportType(): string {
    return this.accountForm.get('transportType')?.value || 'SMTP';
  }

  toneForState(state: string): 'warning' | 'success' | 'danger' | 'muted' {
    switch (state) {
      case 'PENDING': return 'warning';
      case 'SENT': return 'success';
      case 'FAILED': return 'danger';
      default: return 'muted';
    }
  }

  canSendTestEmail(): boolean {
    return !!this.testAccountId && this.isValidEmail(this.testEmailRecipient) && !this.sendingTestEmail;
  }

  sendTestEmail(): void {
    if (!this.testAccountId) {
      this.showToast('Selecciona una cuenta guardada para poder enviar un correo de prueba.', 'warning');
      return;
    }
    if (!this.isValidEmail(this.testEmailRecipient)) {
      this.showToast('Ingresa un correo valido para la prueba.', 'warning');
      return;
    }

    this.sendingTestEmail = true;
    this.emailAdminService.sendTestEmail(this.testAccountId, this.testEmailRecipient).subscribe({
      next: (queuedEmail) => {
        this.showToast('Correo de prueba encolado para ' + this.testEmailRecipient + '. Verificando entrega...', 'info');
        this.loadAll();
        this.monitorTestEmail(queuedEmail.id, this.testEmailRecipient);
      },
      error: (error: any) => {
        this.sendingTestEmail = false;
        this.handleActionError(error, 'No fue posible enviar el correo de prueba.');
      },
    });
  }

  applyLegacyFacturaSmtpDefaults(preserveCurrentValues = true): void {
    const current = this.accountForm.getRawValue() as any;
    const fromAddress = preserveCurrentValues ? (current.fromAddress || '') : '';
    const nextUsername = (preserveCurrentValues ? current.username : '') || fromAddress;
    this.accountForm.patchValue({
      provider: current.provider || 'CMAGINET SMTP',
      transportType: 'SMTP',
      host: 'smtp.cmaginet.net',
      port: 465,
      protocol: 'smtp',
      securityType: 'SSL_TLS',
      authRequired: true,
      replyTo: current.replyTo || fromAddress,
      username: nextUsername,
    });
    this.applyTransportValidators();
    this.showToast('Se cargó la configuración SMTP legacy de facturación. Revisa usuario, remitente y contraseña antes de guardar.', 'info');
  }

  private isValidEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
  }

  private monitorTestEmail(emailId: string, recipient: string): void {
    let pollCount = 0;
    this.testEmailMonitor?.unsubscribe();
    this.testEmailMonitor = timer(2000, 2000).pipe(
      switchMap(() => this.emailAdminService.getEmailById(emailId).pipe(catchError(() => of(null))))
    ).subscribe((email) => {
      pollCount += 1;

      if (!email) {
        this.sendingTestEmail = false;
        this.showToast('No fue posible consultar el estado del correo de prueba.', 'warning');
        this.testEmailMonitor?.unsubscribe();
        return;
      }

      if (email.state === 'SENT') {
        this.sendingTestEmail = false;
        this.loadAll();
        this.showToast('Correo de prueba entregado a ' + recipient + '.', 'success');
        this.testEmailMonitor?.unsubscribe();
        return;
      }

      if (email.state === 'FAILED') {
        this.sendingTestEmail = false;
        this.loadAll();
        this.showToast(email.lastError || 'El correo de prueba fallo durante el envio.', 'danger');
        this.testEmailMonitor?.unsubscribe();
        return;
      }

      if (pollCount >= 12) {
        this.sendingTestEmail = false;
        this.loadAll();
        this.showToast('El correo de prueba sigue pendiente en la cola. Revisa intentos y ultimo error.', 'warning');
        this.testEmailMonitor?.unsubscribe();
      }
    });
  }

  private applyTransportValidators(): void {
    const smtpFields = ['host', 'port', 'protocol', 'securityType'];
    const authFields = ['username', 'password'];
    const apiFields = ['apiUrl', 'apiKey'];
    const isSmtp = this.transportType() === 'SMTP';
    smtpFields.forEach((field) => {
      const control = this.accountForm.get(field);
      control?.setValidators(isSmtp ? [Validators.required] : []);
      control?.updateValueAndValidity({ emitEvent: false });
    });
    authFields.forEach((field) => {
      const control = this.accountForm.get(field);
      control?.setValidators(isSmtp && this.accountForm.get('authRequired')?.value ? [Validators.required] : []);
      control?.updateValueAndValidity({ emitEvent: false });
    });
    apiFields.forEach((field) => {
      const control = this.accountForm.get(field);
      control?.setValidators(!isSmtp ? [Validators.required] : []);
      control?.updateValueAndValidity({ emitEvent: false });
    });
  }

  private invalidAccountFormMessage(): string {
    const labels: Record<string, string> = {
      code: 'Codigo',
      name: 'Nombre',
      provider: 'Proveedor',
      fromAddress: 'Correo remitente',
      fromName: 'Nombre remitente',
      replyTo: 'Reply-To',
      transportType: 'Tipo de transporte',
      host: 'Host SMTP',
      port: 'Puerto SMTP',
      protocol: 'Protocolo SMTP',
      securityType: 'Seguridad SMTP',
      username: 'Usuario SMTP',
      password: 'Contrasena SMTP',
      apiUrl: 'URL del endpoint API',
      apiKey: 'Clave API',
      defaultForType: 'Uso por defecto',
    };
    const missing = Object.keys(this.accountForm.controls)
      .filter((key) => this.accountForm.get(key)?.invalid)
      .map((key) => labels[key] || key);

    return missing.length
      ? 'Revisa estos campos obligatorios: ' + missing.join(', ') + '.'
      : 'El formulario tiene datos invalidos. Revisa los campos obligatorios.';
  }

  private extractErrorMessage(error: any, fallback: string): string {
    if (typeof error?.error === 'string' && error.error.trim()) {
      return error.error.trim();
    }
    if (typeof error?.error?.message === 'string' && error.error.message.trim()) {
      return error.error.message.trim();
    }
    if (typeof error?.message === 'string' && error.message.trim()) {
      return error.message.trim();
    }
    if (error?.status) {
      return fallback + ' (HTTP ' + error.status + ').';
    }
    return fallback;
  }

  private handleActionError(error: any, fallback: string): void {
    this.showToast(this.extractErrorMessage(error, fallback), 'danger');
  }

  private showToast(message: string, tone: 'success' | 'danger' | 'warning' | 'info'): void {
    this.toastMessage = message;
    this.toastTone = tone;
    setTimeout(() => {
      if (this.toastMessage === message) {
        this.toastMessage = '';
      }
    }, 3400);
  }
}
