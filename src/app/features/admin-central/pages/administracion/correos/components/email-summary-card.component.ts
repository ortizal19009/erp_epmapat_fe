import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-email-summary-card',
  imports: [CommonModule],
  template: `
    <article class="summary-card" [ngClass]="'tone-' + tone">
      <div class="summary-icon">
        <i [class]="icon"></i>
      </div>
      <div class="summary-copy">
        <div class="summary-label">{{ label }}</div>
        <div class="summary-value">{{ value }}</div>
        <div class="summary-help">{{ help }}</div>
      </div>
    </article>
  `,
  styles: [
    `
      .summary-card { display: grid; grid-template-columns: 52px 1fr; gap: 1rem; padding: 1.15rem 1.2rem; border-radius: 18px; background: #fff; border: 1px solid #dde5ef; box-shadow: 0 12px 30px rgba(15, 23, 42, 0.06); height: 100%; }
      .summary-icon { width: 52px; height: 52px; border-radius: 16px; display: grid; place-items: center; font-size: 1.2rem; background: rgba(39, 70, 144, 0.1); }
      .summary-label { font-size: 0.78rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #5c6b7a; }
      .summary-value { margin-top: 0.15rem; font-size: 1.9rem; line-height: 1; font-weight: 700; color: #112033; }
      .summary-help { margin-top: 0.35rem; color: #66768a; font-size: 0.88rem; }
      .tone-warning .summary-icon { background: #fff1cc; color: #946200; }
      .tone-success .summary-icon { background: #d9f7e8; color: #0b7a43; }
      .tone-danger .summary-icon { background: #ffe0df; color: #b42318; }
      .tone-info .summary-icon { background: #dbeafe; color: #175cd3; }
    `,
  ],
})
export class EmailSummaryCardComponent {
  @Input() label = '';
  @Input() value = '0';
  @Input() help = '';
  @Input() icon = 'bi bi-envelope';
  @Input() tone: 'warning' | 'success' | 'danger' | 'info' = 'info';
}
