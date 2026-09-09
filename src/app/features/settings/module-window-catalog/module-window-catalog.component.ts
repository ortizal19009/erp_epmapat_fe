import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { ErpmodulosService } from 'src/app/servicios/administracion/erpmodulos.service';
import { VentanasService } from 'src/app/servicios/administracion/ventanas.service';

@Component({
  standalone: true,
  selector: 'app-module-window-catalog',
  templateUrl: './module-window-catalog.component.html',
  styleUrls: ['./module-window-catalog.component.css'],
  imports: [CommonModule, FormsModule],
})
export class ModuleWindowCatalogComponent implements OnInit {
  allModules: any[] = [];
  catalogoModulosVentanas: any[] = [];
  auditoriaCatalogo: any = null;
  cargando = false;
  guardando = false;
  creandoVentana = false;
  canManageAccess = false;
  nuevaVentanaNombre = '';
  nuevoModuloId: number | null = null;

  constructor(
    public auth: AutorizaService,
    private router: Router,
    private erpmodulos: ErpmodulosService,
    private ventanasService: VentanasService
  ) {}

  ngOnInit(): void {
    this.validarAcceso();
  }

  get webModules(): any[] {
    return (this.allModules || []).filter((modulo: any) => {
      const platform = String(modulo?.platform || 'WEB').trim().toUpperCase();
      return platform === 'WEB' || platform === 'BOTH';
    });
  }

  private resolveCurrentUserId(): number {
    if (this.auth.idusuario) return Number(this.auth.idusuario) || 0;
    try {
      const raw = sessionStorage.getItem('abc');
      return raw ? Number(JSON.parse(atob(raw))?.idusuario) || 0 : 0;
    } catch {
      return 0;
    }
  }

  private async validarAcceso(): Promise<void> {
    const idusuario = this.resolveCurrentUserId();
    if (idusuario === 1) {
      this.canManageAccess = true;
      this.cargarCatalogo();
      return;
    }

    try {
      const permisos = await firstValueFrom(this.ventanasService.getPermisosUsuario(idusuario));
      const acceso = (permisos || []).find(
        (item: any) => String(item?.nombre || '').trim().toLowerCase() === 'admin-access-control'
      );
      if (Number(acceso?.permissions ?? 0) >= 5) {
        this.canManageAccess = true;
        this.cargarCatalogo();
        return;
      }
    } catch (error) {
      console.error(error);
    }

    this.auth.swal('warning', 'No tiene permisos para administrar el catálogo.');
    this.router.navigate(['/home']);
  }

  cargarCatalogo(): void {
    this.cargando = true;
    this.erpmodulos.getAllErpModulos().subscribe({
      next: (modules: any[]) => {
        this.allModules = modules || [];
        this.ventanasService.getCatalogoModulosVentanas().subscribe({
          next: (rows: any[]) => {
            this.catalogoModulosVentanas = (rows || []).map((item: any) => ({
              nombre: item.nombre,
              iderpmodulo: item.iderpmodulo == null ? null : Number(item.iderpmodulo),
            }));
            this.cargando = false;
            this.cargarAuditoriaCatalogo();
          },
          error: (error) => this.mostrarError(error),
        });
      },
      error: (error) => this.mostrarError(error),
    });
  }

  private cargarAuditoriaCatalogo(): void {
    this.ventanasService.getAuditoriaCatalogoModulosVentanas().subscribe({
      next: (auditoria: any) => (this.auditoriaCatalogo = auditoria),
      error: (error) => console.error('No se pudo cargar la auditoría del catálogo', error),
    });
  }

  guardarRelacion(): void {
    if (this.guardando) return;
    this.guardando = true;
    this.ventanasService.saveCatalogoModulosVentanas(this.catalogoModulosVentanas).subscribe({
      next: () => {
        this.guardando = false;
        this.auth.swal('success', 'Relación de módulos y ventanas actualizada.');
        this.cargarCatalogo();
      },
      error: (error) => {
        this.guardando = false;
        this.mostrarError(error);
      },
    });
  }

  crearVentana(): void {
    if (this.creandoVentana) return;

    const nombre = this.nuevaVentanaNombre.trim().toLowerCase();
    if (!/^[a-z0-9][a-z0-9/_-]{0,99}$/.test(nombre)) {
      this.auth.swal('warning', 'Use un identificador de ruta, por ejemplo: mi-nueva-ventana.');
      return;
    }
    if (!this.nuevoModuloId) {
      this.auth.swal('warning', 'Seleccione el módulo WEB responsable.');
      return;
    }

    this.creandoVentana = true;
    this.ventanasService.createCatalogoVentana(nombre, this.nuevoModuloId).subscribe({
      next: () => {
        this.creandoVentana = false;
        this.nuevaVentanaNombre = '';
        this.nuevoModuloId = null;
        this.auth.swal('success', 'Ventana creada y asignada al módulo seleccionado.');
        this.cargarCatalogo();
      },
      error: (error) => {
        this.creandoVentana = false;
        this.mostrarError(error);
      },
    });
  }

  regresar(): void {
    this.router.navigate(['/admin/access-control']);
  }

  private mostrarError(error: any): void {
    this.cargando = false;
    console.error(error);
    this.auth.swal('error', error?.error?.message || 'No se pudo cargar o guardar el catálogo.');
  }
}
