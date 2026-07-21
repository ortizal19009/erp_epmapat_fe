import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { Usuarios } from 'src/app/modelos/administracion/usuarios.model';
import { AccesoService } from 'src/app/servicios/administracion/acceso.service';
import { ErpmodulosService } from 'src/app/servicios/administracion/erpmodulos.service';
import { UsrxmodulosService } from 'src/app/servicios/administracion/usrxmodulos.service';
import { UsuarioService } from 'src/app/servicios/administracion/usuario.service';
import { firstValueFrom } from 'rxjs';

declare const $: any;

@Component({
  selector: 'app-perfil-usuario',
  templateUrl: './perfil-usuario.component.html',
  styleUrls: ['./perfil-usuario.component.css'],
})
export class PerfilUsuarioComponent implements OnInit {
  idusuario: number;
  formUsuario: FormGroup;
  usuario: Usuarios;
  _acceso: any;
  filtro: string;
  _erpmodulos: any;
  _usrxmodulo: any[] = [];
  _user: Usuarios = new Usuarios();
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
    private accService: AccesoService,
    private s_erpmodulos: ErpmodulosService,
    private s_usrxmodulos: UsrxmodulosService
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
            this.buscaAcceso();
            this.getAllErpModulos();
          }
        },
        error: (err) => console.error(err.error),
      });
    } else {
      this.router.navigate(['/usuarios']);
    }
  }

  buscaAcceso() {
    let regacc: number;
    this.accService.getAcceso().subscribe({
      next: (resp) => {
        this._acceso = resp;
        if (this._acceso != null) {
          let i = 0;
          this._acceso.forEach(() => {
            this._acceso[i].indice = i;
            this._acceso[i].largo = +this._acceso[i].codacc.length;
            this._acceso[i].espacios = this._acceso[i].codacc.slice(2, 10);
            this._acceso[i].selec = false;
            regacc = +this._acceso[i].regacc;
            if (this.usuario.priusu != null) {
              this._acceso[i].selec =
                +this.usuario.priusu.slice(regacc, regacc + 1) >= 5;
            }
            i++;
          });
        }
      },
      error: (err) => console.error(err.error),
    });
  }

  guardar() {
    let priusu = '';
    for (let i = 0; i < 300; i++) {
      const posi = this._acceso.find((opcion: any) => opcion.regacc == i);
      let j = -1;
      if (posi) j = posi.indice;
      if (j >= 0) {
        if (
          this._acceso[j].selec != null &&
          this._acceso[j].selec != undefined
        ) {
          if (this._acceso[j].selec) {
            const pi = Math.floor(Math.random() * (9 - 5 + 1)) + 5;
            priusu = priusu + pi.toString();
          } else {
            const pi = Math.floor(Math.random() * (4 - 0 + 1)) + 0;
            priusu = priusu + pi.toString();
          }
        }
      } else {
        const pi = Math.floor(Math.random() * (4 - 0 + 1)) + 0;
        priusu = priusu + pi.toString();
      }
    }
    this.usuario.priusu = priusu;
    this.usuService.updateUsuario(this.idusuario, this.usuario).subscribe({
      next: () => this.regresar(),
      error: (err) => console.error('Al actualizar el Usuario; ', err.error),
    });
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
          alert(
            `Error al ${
              enabled ? 'habilitar' : 'deshabilitar'
            } la secciÃ³n: ${err.error?.message || 'Error desconocido'}`
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
    } catch (e: any) {
      pendientes.forEach((row: any) => (row.item.saving = false));
      console.error('Error al guardar mÃ³dulos del usuario:', e);
      alert(
        `Error al guardar los mÃ³dulos del usuario: ${
          e?.error?.message || 'Error desconocido'
        }`
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
