import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-email-status-badge',
  imports: [CommonModule],
  template: `
    <span class="status-badge" [ngClass]="'tone-' + tone">
      {{ label }}
    </span>
  `,
  styles: [
    `
      .status-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 1.75rem;
        padding: 0.1rem 0.6rem;
        border-radius: 999px;
        font-size: 0.72rem;
        font-weight: 700;
        letter-spacing: 0.04em;
      }
      .tone-success { background: #d9f7e8; color: #0b7a43; }
      .tone-warning { background: #fff1cc; color: #946200; }
      .tone-danger { background: #ffe0df; color: #b42318; }
      .tone-muted { background: #eceff3; color: #51606f; }
      .tone-info { background: #dbeafe; color: #175cd3; }
      .tone-primary { background: #e6ecff; color: #274690; }
    `,
  ],
})
export class EmailStatusBadgeComponent {
  @Input() label = '';
  @Input() tone: 'success' | 'warning' | 'danger' | 'muted' | 'info' | 'primary' = 'info';
}
