import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { ErpmodulosService } from 'src/app/servicios/administracion/erpmodulos.service';
import { UsrxmodulosService } from 'src/app/servicios/administracion/usrxmodulos.service';

@Component({
  standalone: true,
  selector: 'app-access-admin',
  templateUrl: './access-admin.html',
  styleUrls: ['./access-admin.css'],
  imports: [CommonModule, FormsModule],
})
export class AccessAdminComponent implements OnInit {
  adminNewModulo = { descripcion: '', platform: 'WEB' };
  allModules: any[] = [];
  selectedModuleId: number | null = null;
  sectionCatalog: any[] = [];
  adminNewSection: any = { codigo: '', descripcion: '', ruta: '', orden: 0, platform: 'WEB', activo: true };
  sectionsCatalogEnabled = true;
  modulesWriteEnabled = true;
  sectionsCatalogMessage = '';
  modulesWriteMessage = '';

  constructor(
    public auth: AutorizaService,
    private router: Router,
    private erpmodulos: ErpmodulosService,
    private usrxmodulos: UsrxmodulosService,
  ) {}

  ngOnInit(): void {
    if (this.auth.idusuario !== 1) {
      this.router.navigate(['/inicio']);
      return;
    }
    this.loadAllModulesCatalog();
  }

  loadAllModulesCatalog() {
    this.erpmodulos.getAllErpModulos().subscribe({
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
          this.modulesWriteMessage = 'El backend actual no permite crear módulos desde esta pantalla.';
          return;
        }
        console.error(e);
      },
    });
  }

  saveModuloEdit(m: any) {
    if (!this.modulesWriteEnabled) return;
    this.erpmodulos.update(m.iderpmodulo, {
      descripcion: m.descripcion,
      platform: (m.platform || 'WEB').toUpperCase(),
    }, this.auth.idusuario).subscribe({
      next: () => this.loadAllModulesCatalog(),
      error: (e: any) => {
        if (e?.status === 405 || e?.status === 404) {
          this.modulesWriteEnabled = false;
          this.modulesWriteMessage = 'El backend actual no permite editar módulos desde esta pantalla.';
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
    this.usrxmodulos.getSectionCatalog(this.selectedModuleId, 'WEB').subscribe({
      next: (rows: any[]) => {
        this.sectionsCatalogEnabled = true;
        this.sectionsCatalogMessage = '';
        this.sectionCatalog = rows || [];
      },
      error: (e: any) => {
        this.sectionCatalog = [];
        if (e?.status === 404 || e?.status === 405) {
          this.sectionsCatalogEnabled = false;
          this.sectionsCatalogMessage = 'El endpoint de catálogo de secciones no está disponible en este backend.';
          return;
        }
        console.error(e);
      },
    });
  }

  saveNewSectionCatalog() {
    if (!this.sectionsCatalogEnabled || !this.selectedModuleId) return;
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
    this.usrxmodulos.saveSectionCatalog(payload).subscribe({
      next: () => {
        this.adminNewSection = { codigo: '', descripcion: '', ruta: '', orden: 0, platform: 'WEB', activo: true };
        this.loadSectionCatalog();
      },
      error: (e: any) => {
        if (e?.status === 404 || e?.status === 405) {
          this.sectionsCatalogEnabled = false;
          this.sectionsCatalogMessage = 'El backend actual no permite guardar secciones desde esta pantalla.';
          return;
        }
        console.error(e);
      },
    });
  }

  saveSectionEdit(sec: any) {
    if (!this.sectionsCatalogEnabled) return;
    this.usrxmodulos.updateSectionCatalog(sec.iderpseccion, {
      codigo: sec.codigo,
      descripcion: sec.descripcion,
      ruta: sec.ruta,
      orden: +sec.orden || 0,
      platform: (sec.platform || 'WEB').toUpperCase(),
      activo: !!sec.activo,
    }).subscribe({
      next: () => this.loadSectionCatalog(),
      error: (e: any) => {
        if (e?.status === 404 || e?.status === 405) {
          this.sectionsCatalogEnabled = false;
          this.sectionsCatalogMessage = 'El backend actual no permite actualizar secciones desde esta pantalla.';
          return;
        }
        console.error(e);
      },
    });
  }
}
