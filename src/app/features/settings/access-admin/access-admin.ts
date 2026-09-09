import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { ColoresService } from 'src/app/compartida/colores.service';
import { Usuarios } from 'src/app/modelos/administracion/usuarios.model';
import { Ventanas } from 'src/app/modelos/administracion/ventanas.model';
import { ErpmodulosService } from 'src/app/servicios/administracion/erpmodulos.service';
import { UsuarioService } from 'src/app/servicios/administracion/usuario.service';
import { UsrxmodulosService } from 'src/app/servicios/administracion/usrxmodulos.service';
import { VentanasService } from 'src/app/servicios/administracion/ventanas.service';

@Component({
  standalone: true,
  selector: 'app-access-admin',
  templateUrl: './access-admin.html',
  styleUrls: ['./access-admin.css'],
  imports: [CommonModule, FormsModule, RouterModule],
})
export class AccessAdminComponent implements OnInit {
  readonly roleOptions = [
    'SIN_PERFIL',
    'CONSULTA',
    'OPERATIVO',
    'SUPERVISOR',
    'ADMINISTRADOR',
  ];

  readonly permissionLevels = [
    { value: 0, label: 'Sin acceso' },
    { value: 1, label: 'Ver' },
    { value: 2, label: 'Registrar' },
    { value: 3, label: 'Aprobar' },
    { value: 5, label: 'Administrar' },
  ];

  adminNewModulo = { descripcion: '', platform: 'WEB' };
  allModules: any[] = [];
  catalogoModulosVentanas: any[] = [];
  cargandoCatalogoVentanas = false;
  guardandoCatalogoVentanas = false;
  selectedModuleId: number | null = null;
  sectionCatalog: any[] = [];
  adminNewSection: any = {
    codigo: '',
    descripcion: '',
    ruta: '',
    orden: 0,
    platform: 'WEB',
    activo: true,
  };
  sectionsCatalogEnabled = false;
  modulesWriteEnabled = true;
  sectionsCatalogMessage =
    'El catalogo de secciones todavia no esta habilitado en este backend.';
  modulesWriteMessage = '';

  usuarios: any[] = [];
  usuariosFiltrados: any[] = [];
  filtroUsuario = '';
  selectedUser: any | null = null;
  selectedPerfil = 'SIN_PERFIL';
  permisosVentana: Ventanas[] = [];
  guardandoPerfil = false;
  guardandoPermisos = false;
  cargandoPermisos = false;
  canManageAccess = false;

  constructor(
    public auth: AutorizaService,
    private router: Router,
    private erpmodulos: ErpmodulosService,
    private usrxmodulos: UsrxmodulosService,
    private usuarioService: UsuarioService,
    private ventanasService: VentanasService,
    private coloresService: ColoresService
  ) {}

  ngOnInit(): void {
    this.validarAcceso();
  }

  private resolveCurrentUserId(): number {
    if (this.auth.idusuario) {
      return Number(this.auth.idusuario) || 0;
    }

    try {
      const raw = sessionStorage.getItem('abc');
      if (!raw) {
        return 0;
      }
      const decoded = JSON.parse(atob(raw));
      return Number(decoded?.idusuario) || 0;
    } catch {
      return 0;
    }
  }

  private async validarAcceso(): Promise<void> {
    const currentUserId = this.resolveCurrentUserId();

    if (currentUserId === 1) {
      this.canManageAccess = true;
      return;
    }

    try {
      const permisos = await firstValueFrom(
        this.ventanasService.getPermisosUsuario(currentUserId)
      );
      const acceso = (permisos || []).find(
        (item: any) =>
          String(item?.nombre || '').trim().toLowerCase() ===
          'admin-access-control'
      );

      if (Number(acceso?.permissions ?? 0) >= 5) {
        this.canManageAccess = true;
        return;
      }
    } catch (e) {
      console.error(e);
    }

    this.auth.swal('warning', 'No tiene permisos para administrar accesos.');
    this.router.navigate(['/home']);
  }

  loadUsuarios(): void {
    this.usuarioService.getUsuariosWithPersonal().subscribe({
      next: (rows: any[]) => {
        this.usuarios = (rows || []).sort((a: any, b: any) =>
          String(a?.nomusu || '').localeCompare(String(b?.nomusu || ''))
        );
        this.aplicarFiltroUsuarios();
      },
      error: (e: any) => console.error(e),
    });
  }

  aplicarFiltroUsuarios(): void {
    const filtro = (this.filtroUsuario || '').trim().toLowerCase();
    this.usuariosFiltrados = (this.usuarios || []).filter((item: any) => {
      if (!filtro) return true;
      return [item?.nomusu, item?.identificausu, item?.alias, item?.perfil]
        .filter(Boolean)
        .some((valor: any) => String(valor).toLowerCase().includes(filtro));
    });
  }

  seleccionarUsuario(usuario: any): void {
    this.selectedUser = usuario;
    this.selectedPerfil = String(usuario?.perfil || 'SIN_PERFIL').trim() || 'SIN_PERFIL';
    this.cargarPermisosVentana(usuario?.idusuario);
  }

  cargarPermisosVentana(idusuario: number): void {
    if (!idusuario) {
      this.permisosVentana = [];
      return;
    }
    this.cargandoPermisos = true;
    this.ventanasService.getPermisosUsuario(idusuario).subscribe({
      next: (rows: any[]) => {
        this.permisosVentana = (rows || []).map((item: any) => ({
          idventana: item.idventana,
          nombre: item.nombre,
          color1: item.color1,
          color2: item.color2,
          idusuario: item.idusuario,
          permissions: Number(item.permissions ?? 0),
        }));
        this.cargandoPermisos = false;
      },
      error: (e: any) => {
        this.cargandoPermisos = false;
        this.permisosVentana = [];
        console.error(e);
      },
    });
  }

  guardarPerfil(): void {
    if (!this.selectedUser?.idusuario || this.guardandoPerfil) {
      return;
    }
    const perfil = String(this.selectedPerfil || 'SIN_PERFIL').trim().toUpperCase();
    this.guardandoPerfil = true;
    this.usuarioService
      .updatePerfil(
        this.selectedUser.idusuario,
        perfil === 'SIN_PERFIL' ? '' : perfil,
        this.resolveCurrentUserId() || undefined
      )
      .subscribe({
        next: () => {
          this.selectedUser.perfil =
            perfil === 'SIN_PERFIL' ? '' : perfil;
          this.selectedPerfil = perfil;
          this.coloresService.clearPermissionCache(this.selectedUser.idusuario);
          this.guardandoPerfil = false;
          this.auth.swal('success', 'Perfil actualizado correctamente.');
          this.aplicarFiltroUsuarios();
        },
        error: (e: any) => {
          this.guardandoPerfil = false;
          console.error(e);
          this.auth.swal('error', e?.error?.message || 'No se pudo actualizar el perfil.');
        },
      });
  }

  guardarPermisosVentana(): void {
    if (!this.selectedUser?.idusuario || this.guardandoPermisos) {
      return;
    }

    const payload = (this.permisosVentana || []).map((item: Ventanas) => ({
      idventana: item.idventana,
      nombre: item.nombre,
      color1: item.color1,
      color2: item.color2,
      idusuario: this.selectedUser.idusuario,
      permissions: Number(item.permissions ?? 0),
    })) as Ventanas[];

    this.guardandoPermisos = true;
    this.ventanasService
      .savePermisosUsuario(this.selectedUser.idusuario, payload)
      .subscribe({
        next: () => {
          this.guardandoPermisos = false;
          this.coloresService.clearPermissionCache(this.selectedUser.idusuario);
          this.auth.swal('success', 'Permisos por ventana actualizados correctamente.');
          this.cargarPermisosVentana(this.selectedUser.idusuario);
        },
        error: (e: any) => {
          this.guardandoPermisos = false;
          console.error(e);
          this.auth.swal('error', e?.error?.message || 'No se pudieron guardar los permisos.');
        },
      });
  }

  getPermissionLabel(value: number): string {
    const row = this.permissionLevels.find((item) => item.value === Number(value));
    return row?.label || 'Sin acceso';
  }

  get webModules(): any[] {
    return (this.allModules || []).filter((modulo: any) => {
      const platform = String(modulo?.platform || 'WEB').trim().toUpperCase();
      return platform === 'WEB' || platform === 'BOTH';
    });
  }

  loadAllModulesCatalog() {
    this.erpmodulos.getAllErpModulos().subscribe({
      next: (mods: any[]) => {
        this.allModules = mods || [];
        this.loadCatalogoModulosVentanas();
        if (this.selectedModuleId == null && this.allModules.length > 0) {
          this.selectedModuleId = this.allModules[0].iderpmodulo;
          this.loadSectionCatalog();
        }
      },
      error: (e: any) => console.error(e),
    });
  }

  loadCatalogoModulosVentanas(): void {
    this.cargandoCatalogoVentanas = true;
    this.ventanasService.getCatalogoModulosVentanas().subscribe({
      next: (rows: any[]) => {
        this.catalogoModulosVentanas = (rows || []).map((item: any) => ({
          nombre: item.nombre,
          iderpmodulo:
            item.iderpmodulo == null ? null : Number(item.iderpmodulo),
        }));
        this.cargandoCatalogoVentanas = false;
      },
      error: (e: any) => {
        this.cargandoCatalogoVentanas = false;
        console.error(e);
        this.auth.swal('error', 'No se pudo cargar el catálogo de ventanas.');
      },
    });
  }

  guardarCatalogoModulosVentanas(): void {
    if (this.guardandoCatalogoVentanas) {
      return;
    }
    this.guardandoCatalogoVentanas = true;
    this.ventanasService
      .saveCatalogoModulosVentanas(this.catalogoModulosVentanas)
      .subscribe({
        next: () => {
          this.guardandoCatalogoVentanas = false;
          this.auth.swal('success', 'Relación de módulos y ventanas actualizada.');
          this.loadCatalogoModulosVentanas();
        },
        error: (e: any) => {
          this.guardandoCatalogoVentanas = false;
          console.error(e);
          this.auth.swal(
            'error',
            e?.error?.message || 'No se pudo guardar la relación de módulos y ventanas.'
          );
        },
      });
  }

  saveNewModulo() {
    if (!this.modulesWriteEnabled) return;
    if (!this.adminNewModulo.descripcion?.trim()) return;
    const payload = {
      descripcion: this.adminNewModulo.descripcion.trim(),
      platform: (this.adminNewModulo.platform || 'WEB').toUpperCase(),
    };
    this.erpmodulos.save(payload).subscribe({
      next: () => {
        this.adminNewModulo = { descripcion: '', platform: 'WEB' };
        this.loadAllModulesCatalog();
      },
      error: (e: any) => {
        if (e?.status === 405 || e?.status === 404) {
          this.modulesWriteEnabled = false;
          this.modulesWriteMessage =
            'El backend actual no permite crear modulos desde esta pantalla.';
          return;
        }
        console.error(e);
      },
    });
  }

  saveModuloEdit(m: any) {
    if (!this.modulesWriteEnabled) return;
    this.erpmodulos
      .update(
        m.iderpmodulo,
        {
          descripcion: m.descripcion,
          platform: (m.platform || 'WEB').toUpperCase(),
        },
        this.resolveCurrentUserId() || 0
      )
      .subscribe({
        next: () => this.loadAllModulesCatalog(),
        error: (e: any) => {
          if (e?.status === 405 || e?.status === 404) {
            this.modulesWriteEnabled = false;
            this.modulesWriteMessage =
              'El backend actual no permite editar modulos desde esta pantalla.';
            return;
          }
          console.error(e);
        },
      });
  }

  loadSectionCatalog() {
    if (!this.selectedModuleId) {
      this.sectionCatalog = [];
      return;
    }
    this.sectionCatalog = [];
    this.sectionsCatalogEnabled = false;
    this.sectionsCatalogMessage =
      'El catalogo de secciones todavia no esta habilitado en este backend.';
  }

  saveNewSectionCatalog() {
    if (!this.sectionsCatalogEnabled || !this.selectedModuleId) return;
    if (
      !this.adminNewSection.codigo?.trim() ||
      !this.adminNewSection.descripcion?.trim()
    )
      return;
    const payload = {
      iderpmodulo: this.selectedModuleId,
      codigo: this.adminNewSection.codigo.trim(),
      descripcion: this.adminNewSection.descripcion.trim(),
      ruta: this.adminNewSection.ruta?.trim() || null,
      orden: +this.adminNewSection.orden || 0,
      platform: (this.adminNewSection.platform || 'WEB').toUpperCase(),
      activo: !!this.adminNewSection.activo,
    };
    this.usrxmodulos.saveSectionCatalog(payload).subscribe({
      next: () => {
        this.adminNewSection = {
          codigo: '',
          descripcion: '',
          ruta: '',
          orden: 0,
          platform: 'WEB',
          activo: true,
        };
        this.loadSectionCatalog();
      },
      error: (e: any) => {
        if (e?.status === 404 || e?.status === 405) {
          this.sectionsCatalogEnabled = false;
          this.sectionsCatalogMessage =
            'El backend actual no permite guardar secciones desde esta pantalla.';
          return;
        }
        console.error(e);
      },
    });
  }

  saveSectionEdit(sec: any) {
    if (!this.sectionsCatalogEnabled) return;
    this.usrxmodulos
      .updateSectionCatalog(sec.iderpseccion, {
        codigo: sec.codigo,
        descripcion: sec.descripcion,
        ruta: sec.ruta,
        orden: +sec.orden || 0,
        platform: (sec.platform || 'WEB').toUpperCase(),
        activo: !!sec.activo,
      })
      .subscribe({
        next: () => this.loadSectionCatalog(),
        error: (e: any) => {
          if (e?.status === 404 || e?.status === 405) {
            this.sectionsCatalogEnabled = false;
            this.sectionsCatalogMessage =
              'El backend actual no permite actualizar secciones desde esta pantalla.';
            return;
          }
          console.error(e);
        },
      });
  }
}
