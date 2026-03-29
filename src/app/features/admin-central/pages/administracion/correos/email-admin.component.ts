import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { EmailAdminService } from './email-admin.service';
import {
  API_KEY_ACCESS_LEVEL_OPTIONS,
  BLACKLIST_TYPE_OPTIONS,
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
export class EmailAdminComponent implements OnInit {
  readonly transportOptions = EMAIL_TRANSPORT_OPTIONS;
  readonly securityOptions = EMAIL_SECURITY_OPTIONS;
  readonly defaultUseOptions = EMAIL_DEFAULT_USE_OPTIONS;
  readonly stateOptions = EMAIL_STATE_OPTIONS;
  readonly typeOptions = EMAIL_TYPE_OPTIONS;
  readonly blacklistTypeOptions = BLACKLIST_TYPE_OPTIONS;
  readonly apiAccessLevelOptions = API_KEY_ACCESS_LEVEL_OPTIONS;

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
    apiKeyName: [''],
    apiKey: [''],
    apiAccessLevel: ['CUSTOM'],
    apiRestrictedAccess: [true],
    apiKeyEnabled: [true],
    apiCreatedAt: [''],
    apiLastActivityAt: [''],
    apiExpiresAt: [''],
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
      const search = `${item.name} ${item.code} ${item.provider} ${item.fromAddress} ${item.apiKeyName || ''}`.toLowerCase();
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
      code: '', name: '', provider: '', fromAddress: '', fromName: '', replyTo: '', transportType: 'SMTP',
      host: '', port: 587, protocol: 'smtp', securityType: 'STARTTLS', authRequired: true,
      username: '', password: '', apiKeyName: '', apiKey: '', apiAccessLevel: 'CUSTOM', apiRestrictedAccess: true,
      apiKeyEnabled: true, apiCreatedAt: '', apiLastActivityAt: '', apiExpiresAt: '',
      active: true, defaultAccount: false, defaultForType: 'GENERAL',
    });
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
      password: account.password || '',
      apiKeyName: account.apiKeyName || '',
      apiKey: account.apiKey || '',
      apiAccessLevel: account.apiAccessLevel || 'CUSTOM',
      apiRestrictedAccess: account.apiRestrictedAccess ?? true,
      apiKeyEnabled: account.apiKeyEnabled ?? true,
      apiCreatedAt: account.apiCreatedAt || '',
      apiLastActivityAt: account.apiLastActivityAt || '',
      apiExpiresAt: account.apiExpiresAt || '',
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
      return;
    }
    const formValue = { ...this.accountForm.getRawValue() } as any;
    this.emailAdminService.saveAccount(formValue, this.selectedAccount?.id).subscribe(() => {
      this.accountDrawerOpen = false;
      this.loadAll();
      this.showToast(this.selectedAccount ? 'Cuenta actualizada correctamente.' : 'Cuenta creada correctamente.', 'success');
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
    this.emailAdminService.testConnection(account.id).subscribe((result) => {
      this.loadAll();
      this.showToast(result.message, 'success');
    });
  }

  openEmailDetail(email: EmailLog): void {
    this.selectedEmail = email;
    this.selectedAccount = this.accounts.find((item) => item.id === email.accountId) || null;
    this.detailMode = 'email';
    this.detailDrawerOpen = true;
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

  apiLastActivityLabel(): string {
    const value = this.accountForm.get('apiLastActivityAt')?.value;
    return value ? String(value) : 'Nunca';
  }

  apiExpiresLabel(): string {
    const value = this.accountForm.get('apiExpiresAt')?.value;
    return value ? String(value) : 'Nunca';
  }

  private applyTransportValidators(): void {
    const smtpFields = ['host', 'port', 'protocol', 'securityType'];
    const authFields = ['username', 'password'];
    const apiFields = ['apiKeyName', 'apiKey', 'apiAccessLevel'];
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
