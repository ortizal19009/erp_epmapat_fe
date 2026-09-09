import { HttpBackend, HttpClient, HttpEvent, HttpHandler, HttpHeaders, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { environment } from 'src/environments/environment';

@Injectable()
export class WritePermissionInterceptor implements HttpInterceptor {
  private readonly rawHttp: HttpClient;

  constructor(handler: HttpBackend, private router: Router) {
    // Uses the backend directly so permission lookup never re-enters this interceptor.
    this.rawHttp = new HttpClient(handler);
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.isWriteRequest(req) || this.isTechnicalRequest(req.url) || this.isAdministrator()) {
      return next.handle(req);
    }

    const userId = this.getUserId();
    const ventana = this.getActiveWindow();
    if (!userId || !ventana) {
      return this.block('No se pudo identificar el permiso de la ventana actual.');
    }

    return this.getPermissions(userId).pipe(
      catchError(() => this.block('No se pudo validar el permiso para modificar información.')),
      switchMap((permissions) => {
        const level = this.resolvePermission(permissions, ventana);
        if (level >= 2) {
          return next.handle(req);
        }
        return this.block('Su nivel de permiso solo permite consultar información.');
      })
    );
  }

  private isWriteRequest(req: HttpRequest<any>): boolean {
    return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method.toUpperCase());
  }

  private isTechnicalRequest(url: string): boolean {
    const normalized = url.toLowerCase();
    return normalized.includes('/usuarios/login')
      || normalized.includes('/ventanas')
      || normalized.includes('/usrxmodulos/access');
  }

  private getPermissions(userId: number): Observable<any[]> {
    const key = `ventana-permisos-${userId}`;
    try {
      const cached = JSON.parse(sessionStorage.getItem(key) || 'null');
      if (Array.isArray(cached)) return of(cached);
    } catch {}

    const token = sessionStorage.getItem('webJwt');
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    return this.rawHttp.get<any[]>(`${environment.API_URL}/ventanas/usuario/${userId}`, { headers });
  }

  private resolvePermission(rows: any[], ventana: string): number {
    const normalized = this.normalize(ventana);
    const candidates = new Set([normalized, this.stripAction(normalized)]);

    for (const row of rows || []) {
      const name = this.normalize(row?.nombre);
      if (candidates.has(name) || this.sameWindow(this.stripAction(name), this.stripAction(normalized))) {
        return Number(row?.permissions ?? 0);
      }
    }
    return 0;
  }

  private getActiveWindow(): string {
    // The current route is authoritative; sessionStorage can still contain the previous screen.
    const route = this.router.url.split('?')[0].replace(/^#?\//, '').split('/')[0];
    return this.resolveWindowAlias(route || sessionStorage.getItem('ventana') || '');
  }

  private resolveWindowAlias(route: string): string {
    const normalized = this.normalize(route);
    const aliases: Record<string, string> = {
      'forms-aguatramite': 'aguatramite',
      'modicaja': 'cajas',
      'modiemision': 'emisiones',
      'gene-emision': 'emisiones',
      'rutasxemision': 'emisiones',
      'recal-factura': 'facturacion',
      'detalle-planilla': 'facturas',
      'add-homologa': 'niifcuentas',
      'conciliaban': 'bancos',
      'info-liquida': 'beneficiarios',
    };

    return aliases[normalized] || this.stripAction(normalized);
  }

  private sameWindow(left: string, right: string): boolean {
    if (left === right) return true;
    return left.replace(/s$/, '') === right.replace(/s$/, '');
  }

  private stripAction(value: string): string {
    return value.replace(/^(add|modi|modificar|info|detalle|detalles|imp|gene|control|buscar|anular|impor)[-_]?/, '');
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

  private isAdministrator(): boolean {
    return this.getUserId() === 1;
  }

  private block(message: string): Observable<never> {
    Swal.fire({ icon: 'warning', title: 'Operación no permitida', text: message });
    return throwError(() => new Error(message));
  }
}
