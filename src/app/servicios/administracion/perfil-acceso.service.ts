import { Injectable } from '@angular/core';
import { BehaviorSubject, forkJoin, Observable, of } from 'rxjs';
import { catchError, finalize, map, shareReplay, tap } from 'rxjs/operators';
import { AutorizaService } from '../../compartida/autoriza.service';
import { UsrxmodulosService } from './usrxmodulos.service';
import { VentanasService } from './ventanas.service';
import { UsuarioService } from './usuario.service';

@Injectable({ providedIn: 'root' })
export class PerfilAccesoService {
  private loadedUserId = 0;
  private loadingUserId = 0;
  private loadingRequest?: Observable<boolean>;
  private windowPermissions = new Map<string, number>();
  private enabledSections = new Set<string>();
  private readonly modulesSubject = new BehaviorSubject<any[]>([]);
  readonly modules$ = this.modulesSubject.asObservable();

  constructor(
    private authService: AutorizaService,
    private usrxmodulosService: UsrxmodulosService,
    private ventanasService: VentanasService,
    private usuarioService: UsuarioService,
  ) {}

  loadForCurrentUser(force = false): Observable<boolean> {
    if (!this.authService.sessionlog && !this.authService.canActivate()) {
      return of(false);
    }

    const userId = Number(this.authService.idusuario || 0);
    if (!userId) return of(false);
    if (!force && this.loadedUserId === userId) return of(true);
    if (this.loadingRequest && this.loadingUserId === userId) return this.loadingRequest;

    this.clearProfile();
    this.loadingUserId = userId;
    this.loadingRequest = forkJoin({
      session: this.usuarioService.validateWebSession(),
      modules: this.usrxmodulosService.getAccessProfile(userId, 'WEB'),
      windows: this.ventanasService.getPermisosUsuario(userId),
    }).pipe(
      tap(({ session, modules, windows }) => {
        if (Number(session?.userId) !== userId) throw new Error('El token no corresponde al usuario de la sesión');
        this.applyProfile(userId, modules || [], windows || []);
      }),
      map(() => true),
      // A failed verification must never grant access based on a previous browser cache.
      catchError(() => {
        this.clearProfile();
        this.authService.modules = [];
        this.authService.enabModulos();
        return of(false);
      }),
      finalize(() => {
        this.loadingRequest = undefined;
        this.loadingUserId = 0;
      }),
      shareReplay(1),
    );
    return this.loadingRequest;
  }

  hasModule(moduleId: number): boolean {
    if (this.authService.idusuario === 1) return true;
    return (this.authService.modules || []).some((module: any, index: number) =>
      this.moduleId(module, index) === moduleId && module?.enabled !== false
    );
  }

  hasWindowPermission(nombre: string, minimum: number): boolean {
    if (this.authService.idusuario === 1) return true;
    const expected = this.normalizeWindowName(nombre);
    return Array.from(this.windowPermissions.entries()).some(([windowName, level]) => {
      const candidate = this.normalizeWindowName(windowName);
      return (candidate === expected || candidate.replace(/s$/, '') === expected.replace(/s$/, ''))
        && level >= minimum;
    });
  }

  hasSection(code: string): boolean {
    if (this.authService.idusuario === 1) return true;
    return this.enabledSections.has(String(code).trim().toUpperCase())
      || this.enabledSections.has(this.normalizeAccessCode(code));
  }

  get isLoaded(): boolean {
    return this.loadedUserId === Number(this.authService.idusuario || 0);
  }

  private applyProfile(userId: number, modules: any[], windows: any[]): void {
    this.authService.modules = modules;
    this.modulesSubject.next(modules);
    sessionStorage.setItem('modulos', JSON.stringify(modules));
    this.updateSessionModules(modules);
    this.authService.enabModulos();

    windows.forEach((item: any) => {
      const nombre = String(item?.nombre || '').trim().toLowerCase();
      if (nombre) this.windowPermissions.set(nombre, Number(item?.permissions ?? 0));
    });
    // The write interceptor and read-only UI share this cache; replace it after every validation.
    sessionStorage.setItem(`ventana-permisos-${userId}`, JSON.stringify(windows));
    window.dispatchEvent(new Event('permissions-updated'));
    modules.filter((module: any) => module?.enabled !== false)
      .forEach((module: any) => this.collectEnabledCodes(module));
    this.loadedUserId = userId;
  }

  private updateSessionModules(modules: any[]): void {
    try {
      const raw = sessionStorage.getItem('abc');
      if (!raw) return;
      const session = JSON.parse(atob(raw));
      session.modules = modules;
      sessionStorage.setItem('abc', btoa(JSON.stringify(session)));
    } catch {
      // The profile remains available in the in-memory session even if legacy storage is malformed.
    }
  }

  private clearProfile(): void {
    this.loadedUserId = 0;
    this.windowPermissions.clear();
    this.enabledSections.clear();
    this.authService.modules = [];
    this.authService.enabled = Array(7).fill(false);
    this.authService.colorenabled = false;
    this.authService.nomodulo = '';
    this.modulesSubject.next([]);
  }

  private moduleId(module: any, index: number): number {
    return Number(module?.iderpmodulo ?? module?.idmodulo ?? module?.modulo ?? index + 1);
  }

  private collectEnabledCodes(node: any): void {
    if (!node) return;
    const rawCode = node.codigo ?? node.code ?? node.codseccion ?? node.codsubseccion ?? node.descripcion;
    if (rawCode) {
      this.enabledSections.add(String(rawCode).trim().toUpperCase());
      this.enabledSections.add(this.normalizeAccessCode(rawCode));
    }
    const children = [
      ...(Array.isArray(node.secciones) ? node.secciones : []),
      ...(Array.isArray(node.subsecciones) ? node.subsecciones : []),
      ...(Array.isArray(node.children) ? node.children : []),
    ];
    children.filter((child: any) => child?.enabled !== false)
      .forEach((child: any) => this.collectEnabledCodes(child));
  }

  private normalizeAccessCode(code: any): string {
    return String(code || '').trim().toUpperCase().replace(/\s+/g, '').replace(/[.-]+/g, '_');
  }

  private normalizeWindowName(nombre: any): string {
    return String(nombre || '').trim().toLowerCase().replace(/^\//, '')
      .replace(/^(add|modi|modificar|info|detalle|detalles|imp|gene|control|buscar|anular|impor)[-_]?/, '');
  }
}
