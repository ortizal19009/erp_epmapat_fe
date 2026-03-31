import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { EmailAccount } from '../email-admin.models';
import { EmailStatusBadgeComponent } from './email-status-badge.component';

@Component({
  standalone: true,
  selector: 'app-email-accounts-table',
  imports: [CommonModule, EmailStatusBadgeComponent],
  templateUrl: './email-accounts-table.component.html',
  styleUrls: ['./email-accounts-table.component.css'],
})
export class EmailAccountsTableComponent {
  @Input() rows: EmailAccount[] = [];
  @Output() view = new EventEmitter<EmailAccount>();
  @Output() edit = new EventEmitter<EmailAccount>();
  @Output() toggle = new EventEmitter<EmailAccount>();
  @Output() test = new EventEmitter<EmailAccount>();
  @Output() makeDefault = new EventEmitter<EmailAccount>();

  openMenuId: number | null = null;

  resolveEndpoint(row: EmailAccount): string {
    return row.transportType === 'SMTP'
      ? `${row.host}:${row.port}`
      : `${row.apiUrl || 'Endpoint API'}${row.hasApiKey ? ' / API key registrada' : ''}`;
  }
}
