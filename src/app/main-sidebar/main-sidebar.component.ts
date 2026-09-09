import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { BehaviorSubject, filter } from 'rxjs';
import { AutorizaService } from '../compartida/autoriza.service';
import { ColoresService } from '../compartida/colores.service';
import { PerfilAccesoService } from '../servicios/administracion/perfil-acceso.service';

@Component({
  selector: 'app-main-sidebar',
  templateUrl: './main-sidebar.component.html',
  styleUrls: ['./main-sidebar.component.css'],
})
export class MainSidebarComponent implements OnInit {
  fondo1: number;
  private _sessionLog = new BehaviorSubject<boolean>(false);
  puedeAprobarCondonaciones = false;
  private readonly mobileBreakpoint = 992;
  private permissionsUserId = 0;

  constructor(
    public authService: AutorizaService,
    private router: Router,
    private perfilAcceso: PerfilAccesoService,
    private coloresService: ColoresService
  ) {}

  ngOnInit(): void {
    const fondoActual = sessionStorage.getItem('fondoActual')?.toString();
    this.fondo1 = +fondoActual!;

    if (!this.authService.sessionlog && !this.authService.canActivate()) {
      this.router.navigate(['/inicio']);
    }

    this.refreshPermissionsForCurrentUser();
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
      this.refreshPermissionsForCurrentUser();
    });
  }

  private refreshPermissionsForCurrentUser(): void {
    const userId = this.resolveUserId();
    if (!userId || userId === this.permissionsUserId) return;

    this.permissionsUserId = userId;
    this.perfilAcceso.loadForCurrentUser().subscribe();
    this.loadCondonacionesApprovalAccess();
  }

  navUsuario() {
    if (this.authService.idusuario == 1) {
      this.router.navigateByUrl('/usuarios');
    } else {
      sessionStorage.setItem(
        'idusuarioToModi',
        this.authService.idusuario.toString()
      );
      this.router.navigate(['/modi-usuario']);
    }
  }

  sessionLog$ = this._sessionLog.asObservable();

  get sessionlog(): boolean {
    return this._sessionLog.value;
  }

  login() {
    this._sessionLog.next(true);
  }

  logout() {
    this._sessionLog.next(false);
  }

  private resolveUserId(): number {
    if (this.authService.idusuario) return this.authService.idusuario;
    try {
      const raw = sessionStorage.getItem('abc');
      if (!raw) return 0;
      const decoded = JSON.parse(atob(raw));
      return +decoded?.idusuario || 0;
    } catch {
      return 0;
    }
  }

  canWindowPermission(nombre: string, minimo: number): boolean {
    return this.perfilAcceso.hasWindowPermission(nombre, minimo);
  }

  canSection(code: string): boolean {
    return this.perfilAcceso.hasSection(code);
  }

  canAnySection(codes: string[]): boolean {
    if (this.authService.idusuario == 1) return true;
    return codes.some((c) => this.canSection(c));
  }

  canAnyWindowPermission(windows: string[], minimo: number): boolean {
    if (this.authService.idusuario == 1) return true;
    return windows.some((windowName) =>
      this.canWindowPermission(windowName, minimo)
    );
  }

  private async loadCondonacionesApprovalAccess(): Promise<void> {
    if (this.authService.idusuario == 1) {
      this.puedeAprobarCondonaciones = true;
      return;
    }

    const userId = this.resolveUserId();
    if (!userId) {
      this.puedeAprobarCondonaciones = false;
      return;
    }

    try {
      const permission = await this.coloresService.getRolePermission(
        userId,
        'condonaciones-pendientes'
      );
      this.puedeAprobarCondonaciones = permission >= 3;
    } catch {
      this.puedeAprobarCondonaciones = false;
    }
  }

  closeSidebar(): void {
    if (window.innerWidth < this.mobileBreakpoint) {
      document.body.classList.remove('sidebar-open');
      document.body.classList.add('sidebar-collapse');
    }
  }
}
