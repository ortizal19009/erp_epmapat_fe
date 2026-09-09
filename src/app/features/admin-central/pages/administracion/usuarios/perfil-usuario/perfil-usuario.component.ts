import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { Usuarios } from 'src/app/modelos/administracion/usuarios.model';
import { Ventanas } from 'src/app/modelos/administracion/ventanas.model';
import { ErpmodulosService } from 'src/app/servicios/administracion/erpmodulos.service';
import { UsrxmodulosService } from 'src/app/servicios/administracion/usrxmodulos.service';
import { UsuarioService } from 'src/app/servicios/administracion/usuario.service';
import { VentanasService } from 'src/app/servicios/administracion/ventanas.service';
import { firstValueFrom } from 'rxjs';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { ColoresService } from 'src/app/compartida/colores.service';
import Swal from 'sweetalert2';

declare const $: any;

@Component({
  selector: 'app-perfil-usuario',
  templateUrl: './perfil-usuario.component.html',
  styleUrls: ['./perfil-usuario.component.css'],
})
export class PerfilUsuarioComponent implements OnInit {
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
  idusuario: number;
  formUsuario: FormGroup;
  usuario: Usuarios;
  _erpmodulos: any;
  _usrxmodulo: any[] = [];
  _user: Usuarios = new Usuarios();
  selectedPerfil = 'SIN_PERFIL';
  permisosVentana: Ventanas[] = [];
  modulosHabilitados: string[] = [];
  cargandoPermisos = false;
  guardandoPerfil = false;
  guardandoPermisos = false;
  adminNewModulo = { descripcion: '', platform: 'WEB' };
  allModules: any[] = [];
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
  savingModules = false;

  constructor(
    private router: Router,
    private usuService: UsuarioService,
    private fb: FormBuilder,
    private s_erpmodulos: ErpmodulosService,
    private s_usrxmodulos: UsrxmodulosService,
    private ventanasService: VentanasService,
    private authService: AutorizaService,
    private coloresService: ColoresService
  ) {}

  private normalizeText(value: any): string {
    return (value || '').toString().trim().toUpperCase();
  }

  private getModulePlatform(module: any): string {
    return this.normalizeText(module?.platform || module?.plataform || 'WEB');
  }

  private getModuleMatchKey(module: any): string {
    const descripcion = this.normalizeText(module?.descripcion);
    const platform = this.getModulePlatform(module);
    return `${descripcion}::${platform}`;
  }

  private getModuleId(module: any): number {
    return (
      Number(
        module?.iderpmodulo ??
          module?.iderpmodulo_erpmodulos?.iderpmodulo ??
          module?.idmodulo ??
          0
      ) || 0
    );
  }

  private isEnabled(value: any): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value === 1;
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      return normalized === 'true' || normalized === '1' || normalized === 't';
    }
    return false;
  }

  private mostrarAlerta(
    icon: 'success' | 'error' | 'warning' | 'info',
    title: string,
    text?: string
  ): void {
    Swal.fire({
      icon,
      title,
      text,
      timer: icon === 'success' ? 1800 : undefined,
      showConfirmButton: icon !== 'success',
    });
  }

  private buildModuloPayload(item: any): any | null {
    const idusuario = Number(this._user?.idusuario || this.idusuario || 0);
    const iderpmodulo = Number(
      item?.iderpmodulo_erpmodulos?.iderpmodulo || 0
    );

    if (!idusuario || !iderpmodulo) {
      return null;
    }

    return {
      idusuario_usuarios: { idusuario },
      iderpmodulo_erpmodulos: { iderpmodulo },
      enabled: !!item?.enabled,
      platform: this.getModulePlatform(item?.iderpmodulo_erpmodulos || item),
    };
  }

  private cerrarModalModulos(): void {
    $('#modulos').modal('hide');
    $('body').removeClass('modal-open');
    $('.modal-backdrop').remove();
  }

  private resolveActorUserId(): number {
    if (this.authService.idusuario) {
      return Number(this.authService.idusuario) || 0;
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

  ngOnInit(): void {
    sessionStorage.setItem('ventana', '/usuarios');
    const coloresJSON = sessionStorage.getItem('/usuarios');
    this.colocaColor(JSON.parse(coloresJSON!));

    this.idusuario = +sessionStorage.getItem('idusuarioToPerfil')!;
    sessionStorage.removeItem('idusuarioToPerfil');

    this.formUsuario = this.fb.group({
      identificausu: '',
      nomusu: '',
    });

    this.buscaUsuario();
    this.loadAllModulesCatalog();
  }

  colocaColor(colores: any) {
    document.documentElement.style.setProperty('--bgcolor1', colores[0]);
    const cabecera = document.querySelector('.cabecera');
    if (cabecera) cabecera.classList.add('nuevoBG1');
    document.documentElement.style.setProperty('--bgcolor2', colores[1]);
    const detalle = document.querySelector('.detalle');
    if (detalle) detalle.classList.add('nuevoBG2');
  }

  buscaUsuario() {
    if (this.idusuario != 0) {
      this.usuService.getByIdusuario(this.idusuario).subscribe({
        next: (datos: any) => {
          this.usuario = datos;
          this._user.idusuario = datos.idusuario;
          this._user.nomusu = datos.nomusu;
          this.formUsuario.patchValue({
            identificausu: this.usuario.identificausu,
            nomusu: this.usuario.nomusu,
          });
          if (this.usuario != null) {
            this.selectedPerfil =
              String(this.usuario.perfil || 'SIN_PERFIL').trim() || 'SIN_PERFIL';
            this.cargarPermisosVentana();
            this.getAllErpModulos();
          }
        },
        error: (err) => console.error(err.error),
      });
    } else {
      this.router.navigate(['/usuarios']);
    }
  }

  cargarPermisosVentana(): void {
    this.cargandoPermisos = true;
    this.ventanasService.getPermisosUsuario(this.idusuario).subscribe({
      next: (rows: any[]) => {
        this.permisosVentana = (rows || []).map((item: any) => ({
          idventana: item.idventana,
          nombre: item.nombre,
          modulo: item.modulo,
          color1: item.color1,
          color2: item.color2,
          idusuario: item.idusuario,
          permissions: Number(item.permissions ?? 0),
        }));
        this.cargandoPermisos = false;
      },
      error: (err: any) => {
        this.cargandoPermisos = false;
        this.permisosVentana = [];
        console.error(err);
      },
    });
  }

  guardarPerfil(): void {
    if (this.guardandoPerfil) {
      return;
    }
    const perfil = this.normalizeText(this.selectedPerfil || 'SIN_PERFIL');
    const usumodi = this.resolveActorUserId();
    this.guardandoPerfil = true;
    this.usuService
      .updatePerfil(
        this.idusuario,
        perfil === 'SIN_PERFIL' ? '' : perfil,
        usumodi || undefined
      )
      .subscribe({
        next: () => {
          this.guardandoPerfil = false;
          this.selectedPerfil = perfil;
          this.usuario.perfil =
            perfil === 'SIN_PERFIL' ? '' : perfil;
          this.coloresService.clearPermissionCache(this.idusuario);
          this.mostrarAlerta('success', 'Perfil actualizado');
        },
        error: (err: any) => {
          this.guardandoPerfil = false;
          console.error(err);
          this.mostrarAlerta(
            'error',
            'No se pudo actualizar el perfil',
            err?.error?.message
          );
        },
      });
  }

  guardarPermisosVentana(): void {
    if (this.guardandoPermisos) {
      return;
    }
    this.guardandoPermisos = true;
    this.ventanasService
      .savePermisosUsuario(this.idusuario, this.permisosVentana)
      .subscribe({
        next: () => {
          this.guardandoPermisos = false;
          this.coloresService.clearPermissionCache(this.idusuario);
          this.cargarPermisosVentana();
          this.mostrarAlerta('success', 'Permisos actualizados');
        },
        error: (err: any) => {
          this.guardandoPermisos = false;
          console.error(err);
          this.mostrarAlerta(
            'error',
            'No se pudieron actualizar los permisos',
            err?.error?.message
          );
        },
      });
  }

  guardar(): void {
    this.guardarPerfil();
  }

  getPermissionLabel(value: number): string {
    const item = this.permissionLevels.find((level) => level.value === Number(value));
    return item?.label || 'Sin acceso';
  }

  getAllErpModulos() {
    if (!this._user?.idusuario) {
      return;
    }

    this._usrxmodulo = [];

    this.s_erpmodulos.getAllErpModulos().subscribe({
      next: (mods: any[]) => {
        const catalog = mods || [];

        this.s_usrxmodulos.getAllModulos(this.idusuario).subscribe({
          next: (userModules: any[]) => {
            const byId = new Map<number, any>();
            const byKey = new Map<string, any>();

            (userModules || []).forEach((r: any) => {
              const moduleId = this.getModuleId(r);
              if (!Number.isNaN(moduleId) && moduleId > 0) {
                byId.set(moduleId, r);
              }

              const keySource = r?.iderpmodulo_erpmodulos || r;
              byKey.set(this.getModuleMatchKey(keySource), r);
            });

            this._usrxmodulo = catalog.map((m: any) => {
              const id = +m.iderpmodulo;
              const assigned =
                byId.get(id) || byKey.get(this.getModuleMatchKey(m));
              return {
                iderpmodulo_erpmodulos: m,
                enabled: this.isEnabled(
                  assigned?.enabled ?? assigned?.estado ?? assigned?.activo
                ),
                idusuario_usuarios: this._user,
                secciones: assigned?.secciones || [],
                platform: m.platform || m.plataform || 'WEB',
                dirty: false,
                saving: false,
              };
            });
            this.modulosHabilitados = this._usrxmodulo
              .filter((modulo: any) => modulo.enabled)
              .map((modulo: any) => modulo.iderpmodulo_erpmodulos.descripcion);
          },
          error: (e: any) => {
            console.error('Error obteniendo mÃ³dulos del usuario:', e);
            this._usrxmodulo = catalog.map((m: any) => ({
              iderpmodulo_erpmodulos: m,
              enabled: false,
              idusuario_usuarios: this._user,
              secciones: [],
              platform: m.platform || m.plataform || 'WEB',
              dirty: false,
              saving: false,
            }));
            this.modulosHabilitados = [];
          },
        });
      },
      error: (e: any) => console.error('Error obteniendo mÃ³dulos ERP:', e),
    });
  }

  setModuloToUser(e: any, data: any): void {
    data.enabled = !!e.target.checked;
    data.dirty = true;
  }

  setSectionToUser(e: any, sec: any): void {
    const enabled = !!e.target.checked;
    const prev = !!sec.enabled;
    sec.enabled = enabled;

    sec.saving = true;

    this.s_usrxmodulos
      .saveAccessSeccion({
        idusuario: this.idusuario,
        iderpseccion: +sec.iderpseccion,
        enabled,
      })
      .subscribe({
        next: () => {
          sec.saving = false;
          console.log(
            `SecciÃ³n ${sec.descripcion} ${
              enabled ? 'habilitada' : 'deshabilitada'
            } para el usuario`
          );
        },
        error: (err: any) => {
          sec.saving = false;
          console.error('Error al guardar secciÃ³n:', err);
          sec.enabled = prev;
          this.mostrarAlerta(
            'error',
            `No se pudo ${enabled ? 'habilitar' : 'deshabilitar'} la sección`,
            err.error?.message || 'Error desconocido'
          );
        },
      });
  }

  async guardarModulos() {
    if (this.savingModules) {
      return;
    }

    const pendientes = this._usrxmodulo
      .filter((item: any) => item?.dirty)
      .map((item: any) => ({ item, payload: this.buildModuloPayload(item) }))
      .filter((row: any) => !!row.payload);

    if (!pendientes.length) {
      this.cerrarModalModulos();
      return;
    }

    this.savingModules = true;
    pendientes.forEach((row: any) => (row.item.saving = true));

    try {
      await Promise.all(
        pendientes.map((row: any) =>
          firstValueFrom(this.s_usrxmodulos.saveAccessModulos(row.payload))
        )
      );

      pendientes.forEach((row: any) => {
        row.item.dirty = false;
        row.item.saving = false;
      });

      this.cerrarModalModulos();
      this.getAllErpModulos();
      this.cargarPermisosVentana();
      this.mostrarAlerta('success', 'Módulos actualizados');
    } catch (e: any) {
      pendientes.forEach((row: any) => (row.item.saving = false));
      console.error('Error al guardar mÃ³dulos del usuario:', e);
      this.mostrarAlerta(
        'error',
        'No se pudieron guardar los módulos',
        e?.error?.message || 'Error desconocido'
      );
    } finally {
      this.savingModules = false;
    }
  }

  loadAllModulesCatalog() {
    this.s_erpmodulos.getAllErpModulos().subscribe({
      next: (mods: any[]) => {
        this.allModules = mods || [];
        if (this.selectedModuleId == null && this.allModules.length > 0) {
          this.selectedModuleId = this.allModules[0].iderpmodulo;
          this.loadSectionCatalog();
        }
      },
      error: (e: any) => console.error(e),
    });
  }

  saveNewModulo() {
    if (this.idusuario !== 1) return;
    if (!this.adminNewModulo.descripcion?.trim()) return;

    const payload = {
      descripcion: this.adminNewModulo.descripcion.trim(),
      platform: (this.adminNewModulo.platform || 'WEB').toUpperCase(),
    };

    this.s_erpmodulos.save(payload).subscribe({
      next: () => {
        this.adminNewModulo = { descripcion: '', platform: 'WEB' };
        this.loadAllModulesCatalog();
        this.getAllErpModulos();
      },
      error: (e: any) => console.error(e),
    });
  }

  saveModuloEdit(m: any) {
    if (this.idusuario !== 1) return;
    this.s_erpmodulos
      .update(
        m.iderpmodulo,
        {
          descripcion: m.descripcion,
          platform: (m.platform || 'WEB').toUpperCase(),
        },
        this.idusuario
      )
      .subscribe({
        next: () => {
          this.loadAllModulesCatalog();
          this.getAllErpModulos();
        },
        error: (e: any) => console.error(e),
      });
  }

  loadSectionCatalog() {
    if (!this.selectedModuleId) {
      this.sectionCatalog = [];
      return;
    }
    this.sectionCatalog = [];
  }

  saveNewSectionCatalog() {
    if (this.idusuario !== 1 || !this.selectedModuleId) return;
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

    this.s_usrxmodulos.saveSectionCatalog(payload).subscribe({
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
        this.getAllErpModulos();
      },
      error: (e: any) => console.error(e),
    });
  }

  saveSectionEdit(sec: any) {
    if (this.idusuario !== 1) return;
    this.s_usrxmodulos
      .updateSectionCatalog(sec.iderpseccion, {
        codigo: sec.codigo,
        descripcion: sec.descripcion,
        ruta: sec.ruta,
        orden: +sec.orden || 0,
        platform: (sec.platform || 'WEB').toUpperCase(),
        activo: !!sec.activo,
      })
      .subscribe({
        next: () => {
          this.loadSectionCatalog();
          this.getAllErpModulos();
        },
        error: (e: any) => console.error(e),
      });
  }

  regresar() {
    this.router.navigate(['/usuarios']);
  }
}
