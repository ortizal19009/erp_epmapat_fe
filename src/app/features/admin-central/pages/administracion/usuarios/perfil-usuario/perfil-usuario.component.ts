import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { Usrxmodulos } from 'src/app/modelos/administracion/usrxmodulos.model';
import { Usuarios } from 'src/app/modelos/administracion/usuarios.model';
import { AccesoService } from 'src/app/servicios/administracion/acceso.service';
import { ErpmodulosService } from 'src/app/servicios/administracion/erpmodulos.service';
import { UsrxmodulosService } from 'src/app/servicios/administracion/usrxmodulos.service';
import { UsuarioService } from 'src/app/servicios/administracion/usuario.service';

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
  _usrxmodulo: any = [];
  _user: Usuarios = new Usuarios();
  adminNewModulo = { descripcion: '', platform: 'WEB' };
  allModules: any[] = [];
  selectedModuleId: number | null = null;
  sectionCatalog: any[] = [];
  adminNewSection: any = { codigo: '', descripcion: '', ruta: '', orden: 0, platform: 'WEB', activo: true };

  constructor(
    private router: Router,
    private usuService: UsuarioService,
    private fb: FormBuilder,
    private accService: AccesoService,
    private s_erpmodulos: ErpmodulosService,
    private s_usrxmodulos: UsrxmodulosService
  ) {}

  ngOnInit(): void {
    sessionStorage.setItem('ventana', '/usuarios');
    let coloresJSON = sessionStorage.getItem('/usuarios');
    this.colocaColor(JSON.parse(coloresJSON!));

    this.idusuario = +sessionStorage.getItem('idusuarioToPerfil')!;
    sessionStorage.removeItem('idusuarioToPerfil');

    this.formUsuario = this.fb.group({
      identificausu: '',
      nomusu: '',
    });
    this.buscaUsuario();
    this.getAllErpModulos();
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
          if (this.usuario != null) this.buscaAcceso();
        },
        error: (err) => console.error(err.error),
      });
    } else {
      this.router.navigate(['/usuarios']);
    }
  }

  //Recupera los registros de la Tabla Acceso
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
              if (+this.usuario.priusu.slice(regacc, regacc + 1) >= 5)
                this._acceso[i].selec = true;
              else this._acceso[i].selec = false;
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
      next: (nex) => this.regresar(),
      error: (err) => console.error('Al actualizar el Usuario; ', err.error),
    });
  }
  getAllErpModulos() {
    this._usrxmodulo = [];

    this.s_erpmodulos.getAllErpModulos().subscribe({
      next: (mods: any[]) => {
        const catalog = (mods || []).filter((m: any) => {
          const pf = String(m?.platform || 'BOTH').toUpperCase();
          return pf === 'WEB' || pf === 'BOTH';
        });

        this.s_usrxmodulos.getAccessProfile(this.idusuario, 'WEB').subscribe({
          next: (rows: any[]) => {
            const byId = new Map<number, any>();
            (rows || []).forEach((r: any) => byId.set(+r.iderpmodulo, r));

            this._usrxmodulo = catalog.map((m: any) => {
              const id = +m.iderpmodulo;
              const assigned = byId.get(id);
              return {
                iderpmodulo_erpmodulos: m,
                enabled: !!assigned?.enabled,
                idusuario_usuarios: this._user,
                secciones: assigned?.secciones || [],
                platform: 'WEB',
              };
            });
          },
          error: (e: any) => console.error(e),
        });
      },
      error: (e: any) => console.error(e),
    });
  }
  setModuloToUser(e: any, data: any): void {
    const enabled = !!e.target.checked;
    data.enabled = enabled;

    const payload = {
      ...data,
      enabled,
      platform: 'WEB',
      idusuario_usuarios: this._user,
      iderpmodulo_erpmodulos: data.iderpmodulo_erpmodulos,
    };

    this.s_usrxmodulos.saveAccessModulos(payload).subscribe({
      next: () => {},
      error: (err: any) => {
        console.error(err);
        data.enabled = !enabled;
      }
    });
  }

  setSectionToUser(e: any, sec: any): void {
    const enabled = !!e.target.checked;
    const prev = !!sec.enabled;
    sec.enabled = enabled;

    this.s_usrxmodulos.saveAccessSeccion({
      idusuario: this.idusuario,
      iderpseccion: +sec.iderpseccion,
      enabled,
    }).subscribe({
      next: () => {},
      error: (err: any) => {
        console.error(err);
        sec.enabled = prev;
      }
    });
  }

  guardarModulos() {
    this._usrxmodulo.forEach((item: any) => {
      this.s_usrxmodulos.saveAccessModulos(item).subscribe({
        next: () => {},
        error: (e: any) => console.error(e),
      });
    });
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
    this.s_erpmodulos.update(m.iderpmodulo, {
      descripcion: m.descripcion,
      platform: (m.platform || 'WEB').toUpperCase(),
    }).subscribe({
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
    this.s_usrxmodulos.getSectionCatalog(this.selectedModuleId, 'WEB').subscribe({
      next: (rows: any[]) => this.sectionCatalog = rows || [],
      error: (e: any) => console.error(e),
    });
  }

  saveNewSectionCatalog() {
    if (this.idusuario !== 1 || !this.selectedModuleId) return;
    if (!this.adminNewSection.codigo?.trim() || !this.adminNewSection.descripcion?.trim()) return;

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
        this.adminNewSection = { codigo: '', descripcion: '', ruta: '', orden: 0, platform: 'WEB', activo: true };
        this.loadSectionCatalog();
        this.getAllErpModulos();
      },
      error: (e: any) => console.error(e),
    });
  }

  saveSectionEdit(sec: any) {
    if (this.idusuario !== 1) return;
    this.s_usrxmodulos.updateSectionCatalog(sec.iderpseccion, {
      codigo: sec.codigo,
      descripcion: sec.descripcion,
      ruta: sec.ruta,
      orden: +sec.orden || 0,
      platform: (sec.platform || 'WEB').toUpperCase(),
      activo: !!sec.activo,
    }).subscribe({
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
