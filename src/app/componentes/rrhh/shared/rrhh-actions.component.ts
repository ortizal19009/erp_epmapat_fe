import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, Input, OnDestroy, ViewChild, ViewEncapsulation } from '@angular/core';

/** Keeps the original projected actions, including their permission and disabled bindings. */
@Component({
  selector: 'app-rrhh-actions', standalone: true, imports: [CommonModule],
  encapsulation: ViewEncapsulation.None,
  template: `
    <button #trigger type="button" class="btn btn-outline-secondary btn-sm rrhh-actions-trigger"
      [disabled]="disabled" [attr.aria-label]="label" aria-haspopup="menu" [attr.aria-expanded]="open"
      [attr.aria-controls]="menuId" (click)="toggle()" (keydown.arrowdown)="$event.preventDefault(); show()">
      <i class="bi bi-three-dots" aria-hidden="true"></i><span>Acciones</span><i class="bi bi-chevron-down" aria-hidden="true"></i>
    </button>
    <div *ngIf="open" #menu class="rrhh-actions-menu" role="menu" [id]="menuId" [attr.aria-label]="label"
      [style.top.px]="top" [style.left.px]="left" [style.visibility]="positioned ? 'visible' : 'hidden'"
      (keydown)="navigate($event)" (click)="select($event)"><ng-content></ng-content></div>`,
  styles: [`
    app-rrhh-actions{display:inline-block;white-space:nowrap}
    .rrhh-actions-column{width:1%;white-space:nowrap;text-align:center}
    .rrhh-actions-trigger{display:inline-flex;align-items:center;gap:6px;white-space:nowrap;min-height:32px}
    .rrhh-actions-trigger>.bi-chevron-down{font-size:10px}
    .rrhh-actions-menu{position:fixed;z-index:1080;width:250px;max-width:calc(100vw - 16px);max-height:calc(100vh - 16px);overflow-y:auto;
      padding:5px;background:#fff;color:#263545;border:1px solid #dce3eb;border-radius:5px;box-shadow:0 6px 20px #0003;text-align:left}
    .rrhh-actions-menu button.dropdown-item{display:flex;align-items:center;gap:8px;width:100%;padding:9px 12px;margin:0;
      border:0;border-radius:3px;background:transparent;color:#263545;text-align:left;white-space:normal;font-size:13px;line-height:1.4;transition:none}
    .rrhh-actions-menu button.dropdown-item:hover:not(:disabled),.rrhh-actions-menu button.dropdown-item:focus-visible{background:#edf2f7;outline:2px solid #8296ac;outline-offset:-2px}
    .rrhh-actions-menu button.dropdown-item:disabled{opacity:.5;cursor:not-allowed}
    .rrhh-actions-menu button.dropdown-item.text-danger{color:#b42318}
    .rrhh-actions-menu button.dropdown-item.text-success{color:#187345}
    .rrhh-actions-menu .dropdown-divider{border-top:1px solid #e1e6ed;margin:5px 0}
  `]
})
export class RrhhActionsComponent implements OnDestroy {
  private static nextId = 0;
  readonly menuId = `rrhh-actions-${++RrhhActionsComponent.nextId}`;
  @Input() label = 'Acciones del registro';
  @Input() disabled = false;
  @ViewChild('trigger') trigger!: ElementRef<HTMLButtonElement>;
  @ViewChild('menu') menu?: ElementRef<HTMLElement>;
  open = false; positioned = false; top = 0; left = 0;
  private timer?: ReturnType<typeof setTimeout>;
  private scroll = (event: Event) => { if (!this.menu?.nativeElement.contains(event.target as Node)) this.close(); };
  constructor(private host: ElementRef<HTMLElement>) {
    document.addEventListener('scroll', this.scroll, true);
  }
  toggle() { if (this.open) this.close(true); else this.show(); }
  show() {
    if (this.disabled || this.open) return;
    this.open = true; this.positioned = false;
    this.timer = setTimeout(() => {
      if (!this.open || !this.menu) return;
      const anchor = this.trigger.nativeElement.getBoundingClientRect();
      const rect = this.menu.nativeElement.getBoundingClientRect();
      this.left = Math.max(8, Math.min(anchor.right - rect.width, window.innerWidth - rect.width - 8));
      this.top = anchor.bottom + rect.height + 4 <= window.innerHeight - 8
        ? anchor.bottom + 4 : Math.max(8, anchor.top - rect.height - 4);
      this.positioned = true;
      // Apply visibility/position before focus; Angular updates bindings after this timer returns.
      this.menu.nativeElement.style.top = `${this.top}px`;
      this.menu.nativeElement.style.left = `${this.left}px`;
      this.menu.nativeElement.style.visibility = 'visible';
      this.menu.nativeElement.querySelectorAll('button').forEach(button => button.setAttribute('role', 'menuitem'));
      this.buttons()[0]?.focus();
    });
  }
  close(focus = false) {
    if (!this.open) return;
    this.open = false; clearTimeout(this.timer);
    if (focus) this.trigger.nativeElement.focus();
  }
  private buttons(): HTMLButtonElement[] {
    return Array.from(this.menu?.nativeElement.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') || []);
  }
  select(event: MouseEvent) {
    const button = (event.target as HTMLElement).closest('button');
    if (button && !button.disabled) this.close(true);
  }
  navigate(event: KeyboardEvent) {
    const buttons = this.buttons(); const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); this.close(true); }
    else if (event.key === 'Tab') this.close();
    else if (['ArrowDown','ArrowUp','Home','End'].includes(event.key) && buttons.length) {
      event.preventDefault();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1
        : (index + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length;
      buttons[next].focus();
    }
  }
  @HostListener('document:click', ['$event']) outside(event: MouseEvent) {
    if (!this.host.nativeElement.contains(event.target as Node)) this.close();
  }
  @HostListener('window:resize') resize() { this.close(); }
  ngOnDestroy() { clearTimeout(this.timer); document.removeEventListener('scroll', this.scroll, true); }
}
