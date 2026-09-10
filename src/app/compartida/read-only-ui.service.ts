import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter, firstValueFrom } from 'rxjs';
import { AutorizaService } from './autoriza.service';
import { VentanasService } from '../servicios/administracion/ventanas.service';

@Injectable({ providedIn: 'root' })
export class ReadOnlyUiService {
  private observer?: MutationObserver;
  private readOnly = false;
  private requestVersion = 0;

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private router: Router,
    private authService: AutorizaService,
    private ventanasService: VentanasService,
  ) { }

  start(): void {
    if (this.observer) return;

    this.observer = new MutationObserver(() => this.apply());
    this.observer.observe(this.document.body, { childList: true, subtree: true });
    this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe(() => this.refresh());
    window.addEventListener('permissions-updated', () => this.refresh());
    this.refresh();
  }

  private async refresh(): Promise<void> {
    const version = ++this.requestVersion;
    const userId = this.authService.idusuario || this.getUserId();
    if (!userId || userId === 1) {
      this.readOnly = false;
      this.apply();
      return;
    }

    const ventana = this.getActiveWindow();
    if (!ventana) return;

    try {
      const permissions = await this.getPermissions(userId);
      if (version !== this.requestVersion) return;
      this.readOnly = this.resolvePermission(permissions, ventana) < 2;
    } catch {
      if (version !== this.requestVersion) return;
      // Keep the UI read-only when the permission cannot be verified.
      this.readOnly = true;
    }
    this.apply();
  }

  private async getPermissions(userId: number): Promise<any[]> {
    const key = `ventana-permisos-${userId}`;
    try {
      const cached = JSON.parse(sessionStorage.getItem(key) || 'null');
      if (Array.isArray(cached)) return cached;
    } catch { }
    return firstValueFrom(this.ventanasService.getPermisosUsuario(userId));
  }

  private apply(): void {
    const controls = this.document.querySelectorAll<HTMLElement>('button, input[type="button"], input[type="submit"]');
    controls.forEach(control => {
      if (!this.isWriteAction(control)) return;
      const input = control as HTMLButtonElement | HTMLInputElement;
      const managed = input.dataset['readonlyManaged'] === 'true';

      if (this.readOnly) {
        if (!managed) input.dataset['readonlyOriginalDisabled'] = String(input.disabled);
        input.dataset['readonlyManaged'] = 'true';
        input.disabled = true;
        input.classList.add('readonly-permission');
        return;
      }

      if (managed) {
        input.disabled = input.dataset['readonlyOriginalDisabled'] === 'true';
        delete input.dataset['readonlyManaged'];
        delete input.dataset['readonlyOriginalDisabled'];
        input.classList.remove('readonly-permission');
      }
    });
  }

  private isWriteAction(control: HTMLElement): boolean {
    if (control.hasAttribute('data-allow-readonly')) return false;
    const label = [control.textContent, control.getAttribute('aria-label'), control.getAttribute('title'),
      (control as HTMLInputElement).value].filter(Boolean).join(' ').toLowerCase();
    return /\b(aceptar|aprobar|registrar|guardar|nuevo|modificar|editar|eliminar|anular|procesar|generar|actualizar|confirmar|enviar|reabrir)\b/.test(label);
  }

  private getActiveWindow(): string {
    const route = this.router.url.split('?')[0].replace(/^#?\//, '').split('/')[0];
    const aliases: Record<string, string> = {
      'forms-aguatramite': 'aguatramite', 'modicaja': 'cajas', 'modiemision': 'emisiones',
      'gene-emision': 'emisiones', 'rutasxemision': 'emisiones', 'recal-factura': 'facturacion',
      'detalle-planilla': 'facturas', 'add-homologa': 'niifcuentas', 'conciliaban': 'bancos',
      'info-liquida': 'beneficiarios', 'info-ifinan': 'ifinan', 'info-ifina': 'ifinan',
      'info-aguatramite': 'aguatramite',
    };
    const normalized = String(route || sessionStorage.getItem('ventana') || '').trim().toLowerCase().replace(/^\//, '');
    return aliases[normalized] || normalized.replace(/^(add|modi|modificar|info|detalle|detalles|imp|gene|control|buscar|anular|impor)[-_]?/, '');
  }

  private resolvePermission(rows: any[], ventana: string): number {
    const normalized = this.normalize(ventana);
    for (const row of rows || []) {
      const name = this.normalize(row?.nombre).replace(/^(add|modi|modificar|info|detalle|detalles|imp|gene|control|buscar|anular|impor)[-_]?/, '');
      if (name === normalized || name.replace(/s$/, '') === normalized.replace(/s$/, '')) {
        return Number(row?.permissions ?? 0);
      }
    }
    return 0;
  }

  private normalize(value: any): string {
    return String(value || '').trim().toLowerCase().replace(/^\//, '');
  }

  private getUserId(): number {
    try {
      const raw = sessionStorage.getItem('abc');
      return raw ? Number(JSON.parse(atob(raw))?.idusuario) || 0 : 0;
    } catch {
      return 0;
    }
  }
}
