import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { EmailAccount, EmailLog } from '../email-admin.models';
import { EmailStatusBadgeComponent } from './email-status-badge.component';

@Component({
  standalone: true,
  selector: 'app-emitted-emails-table',
  imports: [CommonModule, EmailStatusBadgeComponent],
  templateUrl: './emitted-emails-table.component.html',
  styleUrls: ['./emitted-emails-table.component.css'],
})
export class EmittedEmailsTableComponent {
  @Input() rows: EmailLog[] = [];
  @Input() accounts: EmailAccount[] = [];
  @Output() viewDetail = new EventEmitter<EmailLog>();
  @Output() retry = new EventEmitter<EmailLog>();
  @Output() editRetry = new EventEmitter<EmailLog>();
  @Output() cancel = new EventEmitter<EmailLog>();
  @Output() viewError = new EventEmitter<EmailLog>();
  @Output() viewAttachments = new EventEmitter<EmailLog>();

  openMenuId: string | null = null;

  badgeTone(state: string): 'warning' | 'success' | 'danger' | 'muted' {
    switch (state) {
      case 'PENDING': return 'warning';
      case 'SENT': return 'success';
      case 'FAILED': return 'danger';
      default: return 'muted';
    }
  }

  accountLabel(accountId: number): string {
    return this.accounts.find((item) => item.id === accountId)?.name || 'Sin cuenta';
  }

  recipientsPreview(row: EmailLog): string {
    return row.to.slice(0, 2).join(', ') + (row.to.length > 2 ? ` +${row.to.length - 2}` : '');
  }
}
