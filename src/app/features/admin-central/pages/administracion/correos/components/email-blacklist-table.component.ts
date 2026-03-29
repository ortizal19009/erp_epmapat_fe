import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { EmailBlacklistEntry } from '../email-admin.models';
import { EmailStatusBadgeComponent } from './email-status-badge.component';

@Component({
  standalone: true,
  selector: 'app-email-blacklist-table',
  imports: [CommonModule, EmailStatusBadgeComponent],
  templateUrl: './email-blacklist-table.component.html',
  styleUrls: ['./email-blacklist-table.component.css'],
})
export class EmailBlacklistTableComponent {
  @Input() rows: EmailBlacklistEntry[] = [];
  @Output() edit = new EventEmitter<EmailBlacklistEntry>();
  @Output() toggle = new EventEmitter<EmailBlacklistEntry>();
  @Output() remove = new EventEmitter<EmailBlacklistEntry>();

  openMenuId: number | null = null;
}
