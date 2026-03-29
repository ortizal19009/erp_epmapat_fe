import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { UsrxmodulosService } from '../servicios/administracion/usrxmodulos.service';
import { AutorizaService } from '../compartida/autoriza.service';

@Component({
  selector: 'app-main-sidebar',
  templateUrl: './main-sidebar.component.html',
  styleUrls: ['./main-sidebar.component.css'],
})
export class MainSidebarComponent implements OnInit {
  fondo1: number;
  private _sessionLog = new BehaviorSubject<boolean>(false);
  accessLoaded = false;
  enabledSections = new Set<string>();

  constructor(
    public authService: AutorizaService,
    private router: Router,
    private usrxmodulosService: UsrxmodulosService
  ) {}

  private normalizeAccessCode(code: any): string {
    return String(code || '')
      .trim()
      .toUpperCase()
      .replace(/\s+/g, '')
      .replace(/[.-]+/g, '_');
  }

  private collectEnabledCodes(node: any): void {
    if (!node) return;

    const isEnabled = node.enabled !== false;
    const rawCode = node.codigo ?? node.code ?? node.codseccion ?? node.codsubseccion;
    if (isEnabled && rawCode) {
      this.enabledSections.add(String(rawCode).trim().toUpperCase());
      this.enabledSections.add(this.normalizeAccessCode(rawCode));
    }

    const children = [
      ...(Array.isArray(node.secciones) ? node.secciones : []),
      ...(Array.isArray(node.subsecciones) ? node.subsecciones : []),
      ...(Array.isArray(node.children) ? node.children : []),
    ];

    children.forEach((child: any) => this.collectEnabledCodes(child));
  }

  ngOnInit(): void {
    //Fondo
    let fondoActual = sessionStorage.getItem('fondoActual')?.toString();
    this.fondo1 = +fondoActual!;
    //Módulo
    // this.authService.modulo = +sessionStorage.getItem("moduloOld")!
    // this.authService.modulo = this.authService.moduActual
    // Verifica sesión al inicializar el componente
    if (!this.authService.sessionlog) {
      this.router.navigate(['/inicio']); // redirige inmediatamente
    }

    this.loadSectionAccess();
  }

  isOptionEnabled(modulo: number, i: number): boolean {
    // console.log('Ejecuta main-sidebar.isOptionEnabled con: ', modulo, i, 'this.authService.priusu: ', this.authService.priusu)

    if (this.authService.idusuario == 1) return true;
    // console.log('modulo: ', modulo)
    // switch (modulo) {
    //   case 0:
    //     priusu = this.authService.priusu;
    //     break;
    //   case 1:
    //     // Bloque de código para value2
    //     break;
    //   case 5:
    //     // priusu = '1660';
    //     priusu = this.authService.priusu;
    //     break;
    //   default:
    //     // Bloque de código para el caso por defecto
    //     break;
    // }
    // let priusu: string = '';

    // let priusu = this.authService.priusu;
    if (this.authService.priusu != null) {
      let pi = this.authService.priusu.slice(i, i + 1);
      if (+pi >= 5) return true;
      else return false;
    } else return false;
  }

  navUsuario() {
    if (this.authService.idusuario == 1) {
      this.router.navigateByUrl('/usuarios');
    } else {
      sessionStorage.setItem(
        'idusuarioToModi',
        this.authService.idusuario.toString()
      );
      // this.router.navigateByUrl('/modi-usuario');
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

  private loadSectionAccess(): void {
    const userId = this.resolveUserId();
    if (!userId || userId === 1) {
      this.accessLoaded = true;
      return;
    }

    this.usrxmodulosService.getAccessProfile(userId, 'WEB').subscribe({
      next: (rows: any[]) => {
        this.enabledSections.clear();
        (rows || []).forEach((m: any) => {
          if (!m?.enabled) return;
          this.collectEnabledCodes(m);
        });
        this.accessLoaded = true;
      },
      error: () => {
        this.accessLoaded = true;
      }
    });
  }

  canSection(code: string): boolean {
    if (this.authService.idusuario == 1) return true;
    if (!this.accessLoaded) return false;
    return this.enabledSections.has(String(code).trim().toUpperCase())
      || this.enabledSections.has(this.normalizeAccessCode(code));
  }

  canAnySection(codes: string[]): boolean {
    if (this.authService.idusuario == 1) return true;
    return codes.some((c) => this.canSection(c));
  }
}
