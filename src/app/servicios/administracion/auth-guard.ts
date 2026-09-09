// auth.guard.ts
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router } from '@angular/router';
import { Observable, of, switchMap } from 'rxjs';
import { AutorizaService } from '../../compartida/autoriza.service';
import { PerfilAccesoService } from './perfil-acceso.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AutorizaService,
    private router: Router,
    private perfilAcceso: PerfilAccesoService,
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean | Observable<boolean> {
    if (!this.authService.sessionlog && !this.authService.canActivate()) {
      this.router.navigate(['/inicio']);
      return false;
    }

    return this.perfilAcceso.loadForCurrentUser().pipe(
      switchMap((loaded) => {
        if (!loaded) {
          this.router.navigate(['/inicio']);
          return of(false);
        }
        if (this.authService.idusuario === 1) return of(true);

        const routePath = route.routeConfig?.path || '';
        const moduloRequerido = this.getRequiredModule(routePath);
        if (moduloRequerido != null && !this.perfilAcceso.hasModule(moduloRequerido)) {
          this.router.navigate(['/home']);
          return of(false);
        }
        return this.validarVentana(routePath, route.data?.['windowPermission']);
      })
    );
  }

  private validarVentana(routePath: string, declaredWindow?: string) {
    // Las rutas anidadas (por ejemplo admin/correos) no siempre coinciden con
    // el identificador de la ventana (admin-correos). La metadata es la fuente oficial.
    const ventana = String(declaredWindow || '').trim() || this.resolveWindow(routePath);
    if (!ventana) return of(true);
    const minimumLevel = this.isMutationRoute(routePath) ? 2 : 1;
    const allowed = this.perfilAcceso.hasWindowPermission(ventana, minimumLevel);
    if (allowed) return of(true);
    this.router.navigate(['/home']);
    return of(false);
  }

  private resolveWindow(routePath: string): string {
    const route = String(routePath || '').split('/:')[0].trim().toLowerCase();
    const aliases: Record<string, string> = {
      'forms-aguatramite': 'aguatramite',
      'modicaja': 'cajas',
      'modiemision': 'emisiones',
      'gene-emision': 'emisiones',
      'rutasxemision': 'emisiones',
      'recal-factura': 'facturacion',
      'detalle-planilla': 'facturas',
    };
    return aliases[route] || route.replace(/^(add|modi|modificar|info|detalle|detalles|imp|gene|control|buscar|anular|impor)[-_]?/, '');
  }

  private isMutationRoute(routePath: string): boolean {
    const route = String(routePath || '').split('/:')[0].trim().toLowerCase();
    return /^(add|modi|modificar|anular|gene|forms)[-_]?/.test(route)
      || ['modicaja', 'modiemision', 'gene-emision', 'forms-aguatramite'].includes(route);
  }

  private getRequiredModule(routePath: string): number | null {
    const path = routePath.split('/:')[0].toLowerCase();
    if (!path || ['inicio', 'home', 'service-unavailable'].includes(path)) {
      return null;
    }

    if (path.startsWith('admin/') || [
      'usuarios', 'perfil-usuario', 'definir', 'tabla4', 'reportesjr',
      'add-reportejr', 'modi-reportejr', 'imp-reportejr', 'documentos',
      'add-documento', 'info-documento', 'modi-documento', 'colores'
    ].includes(path)) return 7;

    if (path.startsWith('gd/') || path.startsWith('tthh/')) return 12;
    if (path.startsWith('th-') || ['personal', 'add-personal', 'modi-personal', 'info-personal'].includes(path)) return 5;
    if (path.startsWith('cv-') || ['remision', 'add-remision', 'condonaciones', 'condonaciones-pendientes'].includes(path)) return 6;

    if ([
      'cuentas', 'add-cuenta', 'modi-cuenta', 'info-cuenta', 'imp-cuentas', 'impj-cuentas', 'imp-mayor',
      'asientos', 'add-asiento', 'imp-asientos', 'modi-asiento', 'transaci', 'add-transaci', 'modi-transaci',
      'imp-transaci', 'add-trandetrami', 'add-benextran', 'modi-benextran', 'add-liquiacfp', 'add-pagoscobros',
      'modi-pagoscobros', 'add-trandecomprom', 'modi-desdetramite', 'bancos', 'conciliaban', 'imp-bancos',
      'sinafip', 'niifcuentas', 'add-homologa', 'add-niifcuenta', 'modi-niifcuenta', 'imp-niifcuentas',
      'beneficiarios', 'add-beneficiario', 'info-beneficiario', 'modi-beneficiario', 'imp-beneficiarios',
      'imp-movibene', 'info-liquida', 'imp-liquida', 'egresos', 'modi-egreso', 'imp-egresos', 'add-egreso',
      'regrecauda', 'retenciones', 'imp-retenciones', 'add-retencion', 'modi-retencion', 'preingresos',
      'add-preingreso', 'modi-preingreso', 'aux-ingreso', 'imp-preingreso', 'imp-auxingreso', 'pregastos',
      'add-pregasto', 'modi-pregasto', 'aux-gasto', 'imp-pregasto', 'imp-auxgasto', 'certipresu',
      'modi-certipresu', 'add-certipresu', 'partixcerti', 'add-partixcerti', 'imp-partixcerti', 'reintegradas',
      'add-reintegrada', 'modi-reintegrada', 'partixreinte', 'add-partixreinte', 'tramipresu', 'add-tramipresu',
      'modi-tramipresu', 'prmisoxtrami', 'add-partixtramite', 'reformas', 'add-reforma', 'modi-reforma',
      'clasificador', 'info-clasificador', 'modi-clasificador', 'add-clasificador', 'ejecucion',
      'modi-ejecucion', 'add-ejecucion', 'comprobacion', 'estsituacion', 'estresultados', 'flujoefectivo',
      'ejecupresup', 'unicostos', 'cuecostos', 'comparativo', 'resulcostos', 'imp-unicostos', 'estrfunc',
      'info-estrfunc', 'ifinan', 'info-ifinan', 'info-ifina'
    ].includes(path)) return 2;

    // Las rutas operativas no clasificadas pertenecen al módulo comercial.
    return 1;
  }
}
